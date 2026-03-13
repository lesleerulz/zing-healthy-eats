import os

import csv
from datetime import datetime
from io import StringIO
from flask import Flask, Response, current_app, flash, redirect, render_template, request, url_for, session
from flask_login import current_user, LoginManager, login_required
from sqlalchemy import func, or_
from urllib.parse import urlparse
from werkzeug.utils import secure_filename

from flask_compress import Compress

from app.auth import auth_bp
from app.models import db, AboutContent, CartItem, CarouselImage, Category, FAQ, Order, OrderItem, Product, ProductImage, SocialLink, TeamMember, User, SiteSetting
from app.mpesa import MpesaClient
from config import Config
from flask_mail import Mail, Message

def allowed_file(filename: str) -> bool:
    """
    Check if filename extension is allowed.
    """

    # Return True if filename has an allowed extension.
    return ("." in filename and filename.rsplit(".", 1)[1].lower() in current_app.config["IMAGE_EXTENSIONS"])


def create_app() -> Flask:
    """
    Build and return the Flask application.
    """

    app = Flask(
        __name__,
        static_folder="../static",
        template_folder="../templates"
    )
    app.config.from_object(Config)

    # Enable gzip/brotli compression for all responses
    Compress(app)

    # Cache static files for 1 year (browser-side)
    app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 31536000

    # Initialize database.
    db.init_app(app)

    # Initialize Flask-Mail
    mail = Mail(app)
    app.extensions['mail'] = mail

    login_manager = LoginManager()
    login_manager.login_view = "auth.login"
    login_manager.login_message_category = "warning"
    login_manager.init_app(app)

    # Fix for cPanel/Passenger running behind a proxy (forces HTTPS)
    from werkzeug.middleware.proxy_fix import ProxyFix
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

    # OAuth Setup
    from authlib.integrations.flask_client import OAuth
    oauth = OAuth(app)
    
    # Register Google
    # We register it here so it's available globally via current_app.extensions if needed,
    # or by importing `oauth` if we extracted it. But since create_app is a factory,
    # we need to be careful. The simplest way for a factory is:
    
    if app.config["GOOGLE_CLIENT_ID"] and app.config["GOOGLE_CLIENT_SECRET"]:
        oauth.register(
            name='google',
            client_id=app.config["GOOGLE_CLIENT_ID"],
            client_secret=app.config["GOOGLE_CLIENT_SECRET"],
            server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
            client_kwargs={'scope': 'openid email profile'},
        )
    
    # Store oauth in app extensions so we can access it in blueprints
    app.extensions['oauth'] = oauth

    # Load user by ID.
    @login_manager.user_loader
    def load_user(user_id: str):
        """
        Return a user instance by ID.
        """

        return User.query.get(int(user_id))

    # Register authentication blueprint.
    app.register_blueprint(auth_bp)

    @app.context_processor
    def inject_globals():
        """
        Inject global variables into templates.
        """
        ga_setting = SiteSetting.query.filter_by(key="ga_measurement_id").first()
        sale_enabled_setting = SiteSetting.query.filter_by(key="sale_page_enabled").first()
        sale_title_setting = SiteSetting.query.filter_by(key="sale_page_title").first()
        support_phone_setting = SiteSetting.query.filter_by(key="support_phone").first()

        return {
            "cart_count": CartItem.query.filter_by(user_id=current_user.id).count() if current_user.is_authenticated else 0,
            "current_year": datetime.utcnow().year,
            "social_links": SocialLink.query.all(),
            "ga_measurement_id": ga_setting.value if ga_setting else None,
            "sale_page_enabled": (sale_enabled_setting.value == "true") if sale_enabled_setting else True,
            "sale_page_title": sale_title_setting.value if sale_title_setting else "People's Choice",
            "support_phone": support_phone_setting.value if support_phone_setting else None,
        }

    @app.route("/")
    def index():
        """
        Render home page.
        """

        # Fetch homepage carousel images.
        carousel_images = CarouselImage.query.order_by(CarouselImage.created_at.desc()).all()

        # Fetch FAQs.
        faqs = FAQ.query.all()

        return render_template("main/index.html", title="Home", carousel_images=carousel_images, faqs=faqs)

    @app.route("/about")
    def about():
        """
        Render about page.
        """

        team_members = TeamMember.query.all()
        # Fallback if no team members
        if not team_members:
             team_members = []

        # Fetch "Our Story" content.
        our_story_content = AboutContent.query.filter_by(section="our_story").first()
        our_story_text = our_story_content.content if our_story_content else "Our story content goes here."
        
        # Fetch "About Hero" image (stored as content in AboutContent with section='about_hero')
        hero_content = AboutContent.query.filter_by(section="about_hero").first()
        hero_image = hero_content.content if hero_content else "hero.webp" # Default fallback

        # Render about template.
        return render_template("main/about.html", title="About", team_members=team_members, our_story_text=our_story_text, hero_image=hero_image)

    @app.route("/peoples-choice")
    def peoples_choice():
        """
        Render the admin-controlled sale/featured page.
        """
        sale_enabled = SiteSetting.query.filter_by(key="sale_page_enabled").first()
        if sale_enabled and sale_enabled.value == "false":
            from flask import abort
            abort(404)
        sale_title = SiteSetting.query.filter_by(key="sale_page_title").first()
        title = sale_title.value if sale_title else "People's Choice"
        products = Product.query.filter_by(is_peoples_choice=True).all()
        return render_template("main/peoples_choice.html", title=title, products=products)

    @app.route("/terms_of_use")
    def terms_of_use():
        """
        Render terms of use page.
        """

        # Render terms of use template.
        return render_template("policies/terms_of_use.html", title="Terms of Use")

    @app.route("/legals")
    def legals():
        """
        Render legals page.
        """

        # Render legals template.
        return render_template("policies/legals.html", title="Legals")

    @app.context_processor
    def inject_theme():
        """
        Injects the current seasonal theme based on date.
        """
        from datetime import date
        today = date.today()
        month, day = today.month, today.day

        # Seasonal themes
        if month == 12 and day >= 15:
            current_theme = "theme-christmas"
            greeting = "Merry Christmas"
        elif month == 1 and day <= 5:
            current_theme = "theme-newyear"
            greeting = "Happy New Year"
        elif month == 2 and day == 14:
            current_theme = "theme-valentine"
            greeting = "Happy Valentine's Day"
        else:
            # Force Halloween theme for cutscene/theme work
            current_theme = "theme-halloween"
            greeting = "Happy Halloween"

        return dict(current_theme=current_theme, greeting=greeting)

    @app.context_processor
    def inject_products():
        """
        Injects the latest and top-selling products into the template context.
        """

        latest_products = (
            Product.query
            .order_by(Product.id.desc())
            .limit(4)
            .all()
        )

        top_query = (
            db.session
            .query(Product, func.sum(OrderItem.quantity).label("total"))
            .join(OrderItem, Product.id == OrderItem.product_id)
            .group_by(Product.id)
            .order_by(func.sum(OrderItem.quantity).desc())
            .limit(4)
            .all()
        )
        top_products = [p for p, _ in top_query]

        return dict(latest_products=latest_products, top_products=top_products)

    @app.context_processor
    def inject_cart_quantity():
        if current_user.is_authenticated:
            count = db.session.query(func.sum(CartItem.quantity)).filter_by(user_id=current_user.id).scalar() or 0
        else:
            count = 0
        return dict(cart_quantity=count)

    @app.route("/dashboard")
    @login_required
    def dashboard():
        """
        Render admin dashboard.
        """
        if not current_user.is_admin:
            return render_template("error/403.html"), 403

        # Fetch all products for the table.
        products = Product.query.all()
        categories = Category.query.all()
        carousel_images = CarouselImage.query.all()

        # Count total orders across all time.
        total_orders = Order.query.count()

        # Determine the first day of the current month.
        now = datetime.now()
        month_start = datetime(now.year, now.month, 1)

        # Count orders placed since the start of this month.
        total_orders_month = Order.query.filter(Order.created_at >= month_start).count()
        faqs = FAQ.query.all()

        # Fetch About content.
        our_story = AboutContent.query.filter_by(section="our_story").first()
        about_hero = AboutContent.query.filter_by(section="about_hero").first()
        team_members = TeamMember.query.all()

        # Render the dashboard template with all metrics.
        return render_template(
            "admin/dashboard.html",
            title="Dashboard",
            products=products,
            categories=categories,
            total_orders=total_orders,
            total_orders_month=total_orders_month,
            carousel_images=carousel_images,
            faqs=faqs,
            our_story=our_story,
            about_hero=about_hero,
            team_members=team_members
        )

    @app.route("/dashboard/manage-carousel", methods=["POST"])
    @login_required
    def manage_carousel():
        """
        Add or delete carousel images.
        """
        if not current_user.is_admin:
            return render_template("error/403.html"), 403

        if "delete_id" in request.form:
             # Deletion logic
             image_id = request.form.get("delete_id")
             image = CarouselImage.query.get_or_404(image_id)
             
             image_path = os.path.join(current_app.config["CAROUSEL_PICTURE_FOLDER"], image.image_filename)
             if os.path.exists(image_path):
                 try:
                    os.remove(image_path)
                 except Exception:
                    pass # Continue deletion even if file missing
                 
             db.session.delete(image)
             db.session.commit()
             flash("Image removed from carousel.", "success")
             
        elif "carousel_image" in request.files:
            # Upload logic
            file = request.files["carousel_image"]
            if file and file.filename != "" and allowed_file(file.filename):
                upload_folder = current_app.config["CAROUSEL_PICTURE_FOLDER"]
                if not os.path.exists(upload_folder):
                    os.makedirs(upload_folder)
                    
                filename = secure_filename(file.filename)
                # Ensure unique filename to prevent overwrites
                timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
                filename = f"{timestamp}_{filename}"
                
                file.save(os.path.join(upload_folder, filename))
                
                new_image = CarouselImage(image_filename=filename)
                db.session.add(new_image)
                db.session.commit()
                flash("Image added to carousel.", "success")
            else:
                flash("Invalid file.", "danger")

        return redirect(url_for("dashboard"))

    @app.route("/dashboard/add-category", methods=["POST"])
    @login_required
    def add_category():
        """
        Add a new category.
        """
        if not current_user.is_admin:
            return render_template("error/403.html"), 403

        name = request.form.get("name")
        if name:
            if Category.query.filter_by(name=name).first():
                flash(f"Category '{name}' already exists.", "warning")
            else:
                category = Category(name=name)
                db.session.add(category)
                db.session.commit()
                flash(f"Category '{name}' added.", "success")
        return redirect(url_for("dashboard"))

    @app.route("/dashboard/delete-category/<int:category_id>", methods=["POST"])
    @login_required
    def delete_category(category_id: int):
        if not current_user.is_admin:
            flash("Access denied.", "danger")
            return redirect(url_for("index"))

        category = Category.query.get_or_404(category_id)
        db.session.delete(category)
        db.session.commit()
        flash("Category deleted successfully.", "success")
        return redirect(url_for("dashboard"))

    @app.route("/dashboard/manage-faqs", methods=["POST"])
    @login_required
    def manage_faqs():
        if not current_user.is_admin:
            flash("Access denied.", "danger")
            return redirect(url_for("index"))

        question = request.form.get("question")
        answer = request.form.get("answer")

        if question and answer:
            new_faq = FAQ(question=question, answer=answer)
            db.session.add(new_faq)
            db.session.commit()
            flash("FAQ added successfully.", "success")
        else:
            flash("Both question and answer are required.", "danger")

        return redirect(url_for("dashboard"))

    @app.route("/dashboard/delete-faq/<int:faq_id>", methods=["POST"])
    @login_required
    def delete_faq(faq_id: int):
        if not current_user.is_admin:
            flash("Access denied.", "danger")
            return redirect(url_for("index"))

        faq = FAQ.query.get_or_404(faq_id)
        db.session.delete(faq)
        db.session.commit()
        flash("FAQ deleted successfully.", "success")
        return redirect(url_for("dashboard"))

    @app.route("/dashboard/update-faq/<int:faq_id>", methods=["POST"])
    @login_required
    def update_faq(faq_id: int):
        if not current_user.is_admin:
            flash("Access denied.", "danger")
            return redirect(url_for("index"))

        faq = FAQ.query.get_or_404(faq_id)
        question = request.form.get("question")
        answer = request.form.get("answer")

        if question and answer:
            faq.question = question
            faq.answer = answer
            db.session.commit()
            flash("FAQ updated successfully.", "success")
        else:
            flash("Both question and answer are required.", "danger")
            
        return redirect(url_for("dashboard"))

    @app.route("/dashboard/update-about", methods=["POST"])
    @login_required
    def update_about():
        if not current_user.is_admin:
            flash("Access denied.", "danger")
            return redirect(url_for("index"))

        content = request.form.get("content")
        section = "our_story"

        about_entry = AboutContent.query.filter_by(section=section).first()
        if about_entry:
            about_entry.content = content
        else:
            new_entry = AboutContent(section=section, content=content)
            db.session.add(new_entry)
        
        db.session.commit()
        flash("About content updated successfully.", "success")
        return redirect(url_for("dashboard"))

    @app.route("/dashboard/add-product", methods=["GET", "POST"])
    @login_required
    def add_product():
        """
        Add a new product.
        """

        if not current_user.is_admin:
            return render_template("error/403.html"), 403

        if request.method == "POST":
            # Get form fields.
            title = request.form["title"]
            description = request.form["description"]
            price = float(request.form["price"])
            quantity = int(request.form["quantity"])
            category_id = request.form.get("category_id")
            image_file = request.files["image"]

            # Ensure upload folder exists.
            upload_folder = current_app.config["PRODUCT_PICTURE_FOLDER"]
            if not os.path.exists(upload_folder):
                os.makedirs(upload_folder)

            # Save uploaded image or use default.
            if image_file and image_file.filename != "" and allowed_file(image_file.filename):
                filename = secure_filename(image_file.filename)
                image_path = os.path.join(upload_folder, filename)
                image_file.save(image_path)
            else:
                filename = current_app.config["DEFAULT_PRODUCT_PICTURE"]

            # Create product record.
            product = Product(
                title=title,
                description=description,
                image=filename,
                price=price,
                quantity=quantity,
                category_id=category_id,
                is_peoples_choice=True if request.form.get("is_peoples_choice") == "on" else False
            )
            db.session.add(product)
            db.session.flush() # Get ID for ProductImage

            # Handle multiple images (including the primary one)
            images = request.files.getlist("image")
            for img in images:
                if img and img.filename != "" and allowed_file(img.filename):
                    img_filename = secure_filename(img.filename)
                    # Avoid re-saving if it's the primary (already saved above)
                    img_path = os.path.join(upload_folder, img_filename)
                    if not os.path.exists(img_path):
                         img.save(img_path)
                    
                    new_product_image = ProductImage(product_id=product.id, image_filename=img_filename)
                    db.session.add(new_product_image)

            db.session.commit()
            flash("Product added successfully.", "success")
            return redirect(url_for("dashboard"))

        # Render add-product form.
        categories = Category.query.all()
        return render_template("admin/add_product.html", categories=categories)

    @app.route("/dashboard/update-social-link/<int:link_id>", methods=["POST"])
    @login_required
    def update_social_link(link_id: int):
        if not current_user.is_admin:
            flash("Access denied.", "danger")
            return redirect(url_for("index"))

        link = SocialLink.query.get_or_404(link_id)
        platform = request.form.get("platform")
        url = request.form.get("url")
        icon_class = request.form.get("icon_class")

        if platform and url and icon_class:
            link.platform = platform
            link.url = url
            link.icon_class = icon_class
            db.session.commit()
            flash("Social link updated successfully.", "success")
        else:
            flash("All fields are required.", "danger")

        return redirect(url_for("dashboard"))

    @app.route("/dashboard/update-team-member/<int:member_id>", methods=["POST"])
    @login_required
    def update_team_member(member_id: int):
        if not current_user.is_admin:
             return redirect(url_for("index"))
        
        member = TeamMember.query.get_or_404(member_id)
        name = request.form.get("name")
        role = request.form.get("role")
        
        if name and role:
            member.name = name
            member.role = role
            
            # Handle optional image update
            if "photo" in request.files:
                 file = request.files["photo"]
                 if file and file.filename != "" and allowed_file(file.filename):
                      # Delete old image if it's not a default? (Assuming not tracking defaults strictly here, but simple replace)
                      old_image_path = os.path.join(current_app.config["TEAM_PICTURE_FOLDER"], member.image_filename)
                      if os.path.exists(old_image_path):
                           try: os.remove(old_image_path)
                           except: pass
                      
                      filename = secure_filename(file.filename)
                      timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
                      filename = f"{timestamp}_{filename}"
                      file.save(os.path.join(current_app.config["TEAM_PICTURE_FOLDER"], filename))
                      member.image_filename = filename
            
            db.session.commit()
            flash("Team member updated.", "success")
        else:
             flash("Name and Role are required.", "warning")
             
        return redirect(url_for("dashboard"))
    @app.route("/dashboard/delete-product/<int:product_id>", methods=["POST"])
    @login_required
    def delete_product(product_id):
        """
        Delete a product and its image.
        """

        if not current_user.is_admin:
            return render_template("error/403.html"), 403

        product = Product.query.get_or_404(product_id)

        # Empty users' cart.
        CartItem.query.filter_by(product_id=product.id).delete()

        # Remove image file if not default.
        default_image = current_app.config["DEFAULT_PRODUCT_PICTURE"]
        if product.image != default_image:
            image_path = os.path.join(current_app.config["PRODUCT_PICTURE_FOLDER"], product.image)

            if os.path.exists(image_path):
                os.remove(image_path)
                
        # Remove additional images
        for img in product.images:
            img_path = os.path.join(current_app.config["PRODUCT_PICTURE_FOLDER"], img.image_filename)
            if os.path.exists(img_path):
                os.remove(img_path)

        # Delete product record.
        db.session.delete(product)
        db.session.commit()
        flash("Product deleted successfully.", "warning")
        return redirect(url_for("dashboard"))

    @app.route("/dashboard/edit-product/<int:product_id>", methods=["GET", "POST"])
    @login_required
    def edit_product(product_id):
        """
        Edit an existing product.
        """

        if not current_user.is_admin:
            return render_template("error/403.html"), 403

        product = Product.query.get_or_404(product_id)

        if request.method == "POST":
            # Update basic fields.
            product.title = request.form["title"]
            product.description = request.form["description"]
            product.price = float(request.form["price"])
            product.quantity = int(request.form["quantity"])
            product.category_id = request.form.get("category_id")
            product.is_peoples_choice = True if request.form.get("is_peoples_choice") == "on" else False

            # Ensure upload folder exists.
            upload_folder = current_app.config["PRODUCT_PICTURE_FOLDER"]

            if not os.path.exists(upload_folder):
                os.makedirs(upload_folder)

            image_file = request.files["image"]
            # Handle image replacement if provided.
            if image_file and image_file.filename != "" and allowed_file(image_file.filename):
                # Remove old image if not default.
                old_image = os.path.join(upload_folder, product.image)

                if (product.image != current_app.config["DEFAULT_PRODUCT_PICTURE"] and os.path.exists(old_image)):
                    os.remove(old_image)

                # Save new image.
                filename = secure_filename(image_file.filename)
                image_path = os.path.join(upload_folder, filename)
                image_file.save(image_path)
                product.image = filename
            
            # Add ALL uploaded images to the gallery (ProductImage)
            images = request.files.getlist("image")
            for img in images:
                if img and img.filename != "" and allowed_file(img.filename):
                    img_filename = secure_filename(img.filename)
                    img_path = os.path.join(upload_folder, img_filename)
                    
                    # Save if not exists (might have been saved by the block above if it was the first one)
                    if not os.path.exists(img_path):
                        img.save(img_path)
                    
                    # Add to database
                    new_product_image = ProductImage(product_id=product.id, image_filename=img_filename)
                    db.session.add(new_product_image)

            db.session.commit()
            flash("Product updated successfully.", "success")
            return redirect(url_for("dashboard"))

        # Render edit-product form.
        categories = Category.query.all()
        return render_template("admin/edit_product.html", product=product, categories=categories)

    @app.route("/catalog")
    def catalog():
        """
        List all products with optional sorting, pagination, and search.
        """

        sort_by = request.args.get("sort_by", "title")
        page = request.args.get("page", 1, type=int)
        search = request.args.get("search", "").strip()
        category_id = request.args.get("category_id", type=int)
        per_page = 12

        query = Product.query

        # Filter by category
        if category_id:
            query = query.filter(Product.category_id == category_id)

        # Apply search filter if provided
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Product.title.ilike(search_term),
                    Product.description.ilike(search_term)
                )
            )

        # Apply sorting
        if sort_by == "price_asc": query = query.order_by(Product.price.asc())
        elif sort_by == "price_desc": query = query.order_by(Product.price.desc())
        elif sort_by == "quantity_asc": query = query.order_by(Product.quantity.asc())
        elif sort_by == "quantity_desc": query = query.order_by(Product.quantity.desc())
        else: query = query.order_by(Product.title.asc())

        products = query.paginate(page=page, per_page=per_page, error_out=False)
        categories = Category.query.all()

        return render_template(
            "shop/catalog.html", 
            title="Catalog", 
            products=products, 
            categories=categories,
            sort_by=sort_by, 
            search=search,
            category_id=category_id
        )

    @app.route("/product/<int:product_id>")
    def product_detail(product_id):
        """
        Show product details.
        """

        product = Product.query.get_or_404(product_id)
        return render_template("shop/product_detail.html", product=product)

    @app.route("/add-to-cart/<int:product_id>", methods=["POST"])
    # Removed @login_required to allow persistence
    def add_to_cart(product_id):
        """
        Add item to shopping cart.
        """

        # Retrieve product or 404.
        product = Product.query.get_or_404(product_id)
        quantity = int(request.form.get("quantity", 1))

        next_page = request.form.get("next") or request.referrer or url_for("catalog")
        if urlparse(next_page).netloc: next_page = url_for("catalog")

        # Validate quantity.
        if quantity <= 0:
            flash("Invalid quantity.", "danger")
            return redirect(next_page)

        # If user is not logged in, store in session and redirect
        if not current_user.is_authenticated:
            session["pending_cart"] = {"product_id": product_id, "quantity": quantity}
            flash("Please log in to add this item to your cart.", "info")
            return redirect(url_for("auth.login"))

        # Get current cart.
        item = CartItem.query.filter_by(user_id=current_user.id, product_id=product.id).first()
        current_quantity = item.quantity if item else 0
        total_requested = current_quantity + quantity

        # Check stock availability.
        if total_requested > product.quantity:
            flash("Not enough stock available.", "danger")
            return redirect(next_page)

        if item:
            item.quantity += quantity
        else:
            item = CartItem(user_id=current_user.id, product_id=product.id, quantity=quantity)
            db.session.add(item)

        db.session.commit()
        flash("Product added to cart.", "success")
        return redirect(next_page)

    @app.route("/cart")
    @login_required
    def cart():
        """
        Display shopping cart contents.
        """

        items = CartItem.query.filter_by(user_id=current_user.id).all()
        cart_items = []
        total = 0

        for item in items:
            product = item.product
            # Calculate subtotal and add to total.
            subtotal = product.price * item.quantity
            total += subtotal
            cart_items.append({
                "product": product,
                "quantity": item.quantity,
                "subtotal": subtotal
            })

        # Render cart template with items and total.
        return render_template("shop/cart.html", title="Cart", items=cart_items, total=total)

    @app.route("/update-cart-quantity/<int:product_id>", methods=["POST"])
    @login_required
    def update_cart_quantity(product_id):
        """
        Update the quantity of an item in the cart.
        """
        quantity = int(request.form.get("quantity", 1))
        
        if quantity <= 0:
            return redirect(url_for("remove_from_cart", product_id=product_id))
            
        item = CartItem.query.filter_by(user_id=current_user.id, product_id=product_id).first()
        
        if item:
            # Check stock
            if quantity > item.product.quantity:
                flash(f"Only {item.product.quantity} items available in stock.", "danger")
            else:
                item.quantity = quantity
                db.session.commit()
                flash("Cart updated.", "success")
        
        return redirect(url_for("cart"))

    @app.route("/dashboard/manage-social-links", methods=["POST"])
    @login_required
    def manage_social_links():
         if not current_user.is_admin:
             return redirect(url_for("index"))
             
         action = request.form.get("action")
         if action == "add":
             platform = request.form.get("platform")
             url_link = request.form.get("url")
             icon = request.form.get("icon_class")
             if platform and url_link and icon:
                 db.session.add(SocialLink(platform=platform, url=url_link, icon_class=icon))
                 db.session.commit()
                 flash("Social link added.", "success")
         
         elif action == "delete":
             link_id = request.form.get("link_id")
             link = SocialLink.query.get(link_id)
             if link:
                 db.session.delete(link)
                 db.session.commit()
                 flash("Social link removed.", "success")
                 
         return redirect(url_for("dashboard"))

    @app.route("/remove-from-cart/<int:product_id>", methods=["POST"])
    @login_required
    def remove_from_cart(product_id):
        """
        Remove item from shopping cart.
        """

        item = CartItem.query.filter_by(user_id=current_user.id, product_id=product_id).first()
        if item:
            # Remove item and save cart.
            db.session.delete(item)
            db.session.commit()
            flash("Item removed from cart.", "warning")
        return redirect(url_for("cart"))

    @app.route("/checkout")
    @login_required
    def initiate_checkout_view():
        """
        Render the payment page for checkout.
        """
        items = CartItem.query.filter_by(user_id=current_user.id).all()
        if not items:
            flash("Your cart is empty.", "warning")
            return redirect(url_for("cart"))
            
        total = sum(item.product.price * item.quantity for item in items)
        
        return render_template("shop/payment.html", total=total, saved_phone=current_user.saved_phone)

    @app.route("/process_payment", methods=["POST"])
    @login_required
    def process_payment():
        """
        Initiate M-Pesa STK Push and create order.
        """
        phone_number = request.form.get("phone_number")
        save_phone = request.form.get("save_phone") == "on"
        if not phone_number:
            flash("Phone number is required.", "danger")
            return redirect(url_for("initiate_checkout_view"))

        # Simple validation for formatting (naive)
        # Assuming user enters 9 digits like 712345678
        if phone_number.startswith("0"):
            phone_number = "254" + phone_number[1:]
        elif phone_number.startswith("+254"):
            phone_number = phone_number[1:]
        elif not phone_number.startswith("254"):
            phone_number = "254" + phone_number
            
        items = CartItem.query.filter_by(user_id=current_user.id).all()
        if not items:
            flash("Cart is empty.", "warning")
            return redirect(url_for("cart"))

        # Calculate total
        amount = sum(item.product.price * item.quantity for item in items)

        # Create Order (Pending)
        order = Order(user_id=current_user.id, phone_number=phone_number, status="Pending")
        db.session.add(order)
        db.session.flush()  # Assign order.id before STK Push
        print(f"[M-Pesa] Created Order #{order.id} for {phone_number}")
        
        # Check stock and create OrderItems
        for item in items:
            product = item.product
            if product.quantity < item.quantity:
                db.session.rollback()
                flash(f"Not enough stock for {product.title}.", "danger")
                return redirect(url_for("cart"))
                
            product.quantity -= item.quantity
            order_item = OrderItem(
                order=order,
                product_id=product.id,
                quantity=item.quantity,
                product_title=product.title,
                product_price=product.price
            )
            db.session.add(order_item)

        try:
            # Initiate STK Push
            base_url = "https://api.safaricom.co.ke" if app.config["MPESA_ENV"] == "production" else "https://sandbox.safaricom.co.ke"
            mpesa = MpesaClient(
                consumer_key=app.config["MPESA_CONSUMER_KEY"],
                consumer_secret=app.config["MPESA_CONSUMER_SECRET"],
                shortcode=app.config["MPESA_SHORTCODE"],
                passkey=app.config["MPESA_PASSKEY"],
                transaction_type=app.config["MPESA_TRANSACTION_TYPE"],
                base_url=base_url
            )
            
            response = mpesa.stk_push(
                phone_number=phone_number,
                amount=amount,
                callback_url=app.config["MPESA_CALLBACK_URL"],
                account_reference=f"Order-{order.id}",
                transaction_desc=f"Payment for Order {order.id}"
            )
            print(f"[M-Pesa STK Response] Order #{order.id}: {response}")
            
            checkout_request_id = response.get("CheckoutRequestID")
            if checkout_request_id:
                order.checkout_request_id = checkout_request_id
                # Save phone to user profile if requested
                if save_phone and current_user.saved_phone != phone_number:
                    current_user.saved_phone = phone_number
                # Commit everything
                CartItem.query.filter_by(user_id=current_user.id).delete()
                db.session.commit()
                flash("Payment initiated! Check your phone to complete the transaction.", "info")
                return redirect(url_for("order_history"))
            else:
                db.session.rollback()
                flash(f"Failed to initiate payment: {response.get('errorMessage')}", "danger")
                return redirect(url_for("initiate_checkout_view"))
                
        except Exception as e:
            db.session.rollback()
            flash(f"An error occurred: {str(e)}", "danger")
            return redirect(url_for("initiate_checkout_view"))

    def send_order_invoice_email(order):
        try:
            user = User.query.get(order.user_id)
            support_setting = SiteSetting.query.filter_by(key="support_phone").first()
            support_phone = support_setting.value if support_setting else ""
            
            html_body = render_template('email/invoice.html', order=order, user=user, support_phone=support_phone)
            
            msg = Message(
                subject=f"Order Invoice - #{order.id} Zing Healthy Eats",
                sender=current_app.config["MAIL_USERNAME"],
                recipients=[user.email, "sarahmogoi@gmail.com", "lesleenyanducha@gmail.com"]
            )
            msg.html = html_body
            
            mail = current_app.extensions.get('mail')
            if mail:
                mail.send(msg)
                print(f"[Mail] Invoice emailed to {user.email}")
            else:
                print("[Mail Error] Mail extension not found.")
        except Exception as e:
            print(f"[Mail Error] Failed to send invoice email: {str(e)}")

    @app.route("/payment/callback", methods=["POST"])
    def mpesa_callback():
        """
        Handle M-Pesa STK Push callback.
        """
        data = request.get_json()
        print(f"[M-Pesa Callback] Received: {data}")
        
        if not data or "Body" not in data:
            return {"result": "fail", "message": "Invalid data"}, 400
            
        stk_callback = data["Body"]["stkCallback"]
        checkout_request_id = stk_callback["CheckoutRequestID"]
        result_code = str(stk_callback["ResultCode"])
        
        order = Order.query.filter_by(checkout_request_id=checkout_request_id).first()
        if not order:
            print(f"[M-Pesa Callback] Order not found for CheckoutRequestID: {checkout_request_id}")
            return {"result": "fail", "message": "Order not found"}, 404
            
        if result_code == "0":
            # Payment success
            order.status = "Paid"
            metadata = stk_callback.get("CallbackMetadata", {}).get("Item", [])
            for item in metadata:
                if item["Name"] == "MpesaReceiptNumber":
                    order.mpesa_receipt_number = item["Value"]
            print(f"[M-Pesa Callback] Order #{order.id} marked as Paid")
            send_order_invoice_email(order)
        else:
            # Payment failed or cancelled
            order.status = "Failed"
            print(f"[M-Pesa Callback] Order #{order.id} marked as Failed (ResultCode: {result_code})")
            
        db.session.commit()
        return {"result": "success"}

    @app.route("/payment/status/<int:order_id>")
    @login_required
    def check_payment_status(order_id):
        """
        Check and update payment status for an order.
        """
        order = Order.query.get_or_404(order_id)
        
        # Ensure user owns the order
        if order.user_id != current_user.id and not current_user.is_admin:
            return {"status": "error", "message": "Access denied"}, 403
            
        # If already paid or failed, just return status
        if order.status in ["Paid", "Failed", "Cancelled"]:
            return {"status": order.status}
            
         # If pending, query M-Pesa
        if order.status == "Pending" and order.checkout_request_id:
            try:
                base_url = "https://api.safaricom.co.ke" if app.config["MPESA_ENV"] == "production" else "https://sandbox.safaricom.co.ke"
                mpesa = MpesaClient(
                    consumer_key=app.config["MPESA_CONSUMER_KEY"],
                    consumer_secret=app.config["MPESA_CONSUMER_SECRET"],
                    shortcode=app.config["MPESA_SHORTCODE"],
                    passkey=app.config["MPESA_PASSKEY"],
                    transaction_type=app.config["MPESA_TRANSACTION_TYPE"],
                    base_url=base_url
                )
                
                response = mpesa.query_transaction_status(order.checkout_request_id)
                print(f"[M-Pesa Status Query] Order #{order.id}: {response}")
                
                if "ResultCode" in response:
                    result_code = str(response["ResultCode"])
                    
                    if result_code == "0":
                        order.status = "Paid"
                        # Try to extract receipt number from metadata
                        if "CallbackMetadata" in response:
                            try:
                                for item in response["CallbackMetadata"]["Item"]:
                                    if item["Name"] == "MpesaReceiptNumber":
                                        order.mpesa_receipt_number = item["Value"]
                            except (KeyError, TypeError):
                                pass
                        send_order_invoice_email(order)
                    elif result_code == "1032":
                        order.status = "Cancelled"
                    elif result_code == "1":
                        # Still processing — leave as Pending
                        pass
                    else:
                        order.status = "Failed"
                         
                    db.session.commit()
                    
                # If errorCode is present, it might still be processing, so we leave as Pending
                    
            except Exception as e:
                # Log error but return current status
                print(f"[M-Pesa Status Query] Error for Order #{order.id}: {e}")
                pass
                
        return {"status": order.status}

    @app.route("/orders")
    @login_required
    def order_history():
        """
        Show user's past orders.
        """

        # Retrieve orders sorted by creation date.
        orders = Order.query.filter_by(user_id=current_user.id).order_by(Order.created_at.desc()).all()
        return render_template("shop/orders.html", orders=orders)

    @app.route("/dashboard/update-about-hero", methods=["POST"])
    @login_required
    def update_about_hero():
        if not current_user.is_admin:
            return redirect(url_for("index"))
            
        if "hero_image" not in request.files:
             flash("No file part", "danger")
             return redirect(url_for("dashboard"))
             
        file = request.files["hero_image"]
        if file.filename == "":
            flash("No selected file", "danger")
            return redirect(url_for("dashboard"))
            
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Ensure folder exists
            os.makedirs(app.config["ABOUT_PICTURE_FOLDER"], exist_ok=True)
            file.save(os.path.join(app.config["ABOUT_PICTURE_FOLDER"], filename))
            
            # Update DB
            content = AboutContent.query.filter_by(section="about_hero").first()
            if content:
                content.content = filename
            else:
                content = AboutContent(section="about_hero", content=filename)
                db.session.add(content)
            
            db.session.commit()
            flash("About Hero image updated.", "success")
            
        return redirect(url_for("dashboard"))

    @app.route("/dashboard/manage-team", methods=["POST"])
    @login_required
    def manage_team():
        if not current_user.is_admin:
             return redirect(url_for("index"))
             
        action = request.form.get("action")
        
        if action == "add":
            name = request.form.get("name")
            role = request.form.get("role")
            file = request.files.get("photo")
            
            if name and role and file and allowed_file(file.filename):
                 filename = secure_filename(file.filename)
                 # Ensure folder exists
                 os.makedirs(app.config["TEAM_PICTURE_FOLDER"], exist_ok=True)
                 file.save(os.path.join(app.config["TEAM_PICTURE_FOLDER"], filename))
                 
                 member = TeamMember(name=name, role=role, image_filename=filename)
                 db.session.add(member)
                 db.session.commit()
                 flash("Team member added.", "success")
            else:
                 flash("Missing data or invalid file.", "danger")
                 
        elif action == "delete":
             member_id = request.form.get("member_id")
             member = TeamMember.query.get(member_id)
             if member:
                 db.session.delete(member)
                 db.session.commit()
                 flash("Team member removed.", "success")
                 
        return redirect(url_for("dashboard"))

    @app.route("/dashboard/export-emails")
    @login_required
    def export_emails():
        """
        Export all user emails to CSV.
        """
        if not current_user.is_admin:
            return redirect(url_for("index"))

        # Query all users
        users = User.query.all()

        # Generate CSV
        si = StringIO()
        cw = csv.writer(si)
        cw.writerow(["ID", "Username", "Email", "Role"]) # Header

        for user in users:
            role = "Admin" if user.is_admin else "Customer"
            cw.writerow([user.id, user.username, user.email, role])

        output = Response(si.getvalue(), mimetype="text/csv")
        output.headers["Content-Disposition"] = "attachment; filename=zing_users.csv"
        return output

    @app.route("/dashboard/manage-settings", methods=["POST"])
    @login_required
    def manage_settings():
        """
        Update site settings (e.g. Google Analytics).
        """
        if not current_user.is_admin:
            return redirect(url_for("index"))
            
        ga_id = request.form.get("ga_measurement_id")
        sale_page_enabled = "true" if request.form.get("sale_page_enabled") == "on" else "false"
        sale_page_title = request.form.get("sale_page_title", "").strip() or "People's Choice"
        support_phone = request.form.get("support_phone", "").strip()

        def upsert_setting(key, value):
            s = SiteSetting.query.filter_by(key=key).first()
            if s:
                s.value = value
            else:
                db.session.add(SiteSetting(key=key, value=value))

        upsert_setting("ga_measurement_id", ga_id)
        upsert_setting("sale_page_enabled", sale_page_enabled)
        upsert_setting("sale_page_title", sale_page_title)
        upsert_setting("support_phone", support_phone)

        db.session.commit()
        flash("Settings updated.", "success")
        return redirect(url_for("dashboard"))

    @app.cli.command("init-database")
    def init_db():
        """
        Create database tables.
        """

        with app.app_context():
            db.create_all()
            print("Database initialized.")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
