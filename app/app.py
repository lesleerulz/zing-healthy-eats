import os

import csv
from datetime import datetime
from io import StringIO
from flask import Flask, Response, current_app, flash, jsonify, redirect, render_template, request, url_for, session
from flask_login import current_user, LoginManager, login_required
from sqlalchemy import func, or_
from urllib.parse import urlparse
from werkzeug.utils import secure_filename

from flask_compress import Compress
from flask_cors import CORS
from flask_socketio import SocketIO, join_room, emit

from app.auth import auth_bp
from app.api import api_bp

socketio = SocketIO(async_mode='threading')

from app.models import db, AboutContent, CartItem, CarouselImage, Category, FAQ, Order, OrderItem, Product, ProductImage, SocialLink, TeamMember, User, SiteSetting
from app.paystack import PaystackClient
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

    # Enable CORS for API routes (Next.js frontend on different port).
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Initialize SocketIO
    socketio.init_app(app, cors_allowed_origins="*")

    @socketio.on('join_tracking_room')
    def handle_join_tracking_room(data):
        order_id = data.get('order_id')
        if order_id:
            room = f"order_{order_id}"
            join_room(room)

    @socketio.on('driver_location_update')
    def handle_driver_location_update(data):
        order_id = data.get('order_id')
        lat = data.get('lat')
        lng = data.get('lng')
        if order_id and lat and lng:
            room = f"order_{order_id}"
            emit('location_update', {'lat': lat, 'lng': lng}, to=room)


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

    # -----------------------------------------------------------------------
    # Missing Routes (Decoupled fallback)
    # -----------------------------------------------------------------------

    @app.route("/")
    def index():
        return redirect(app.config["FRONTEND_URL"])

    @app.route("/about")
    def about():
        return redirect(f"{app.config['FRONTEND_URL']}/about")

    @app.route("/catalog")
    def catalog():
        return redirect(f"{app.config['FRONTEND_URL']}/catalog")

    @app.route("/peoples-choice")
    def peoples_choice():
        return redirect(f"{app.config['FRONTEND_URL']}/catalog") # Frontend might have it under catalog

    @app.route("/cart")
    def cart():
        return redirect(f"{app.config['FRONTEND_URL']}/cart")

    @app.route("/orders/history")
    @login_required
    def order_history():
        if current_user.is_driver:
            return redirect(url_for("driver_dashboard"))
        return redirect(f"{app.config['FRONTEND_URL']}/orders")

    @app.route("/terms")
    def terms_of_use():
        return redirect(f"{app.config['FRONTEND_URL']}/terms") # Assuming these exist on frontend

    @app.route("/legals")
    def legals():
        return redirect(f"{app.config['FRONTEND_URL']}/legals")

    # Load user by ID.
    @login_manager.user_loader
    def load_user(user_id: str):
        """
        Return a user instance by ID.
        """

        return User.query.get(int(user_id))

    # Register authentication blueprint.
    app.register_blueprint(auth_bp)
    app.register_blueprint(api_bp)

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
            "current_year": datetime.utcnow().year,
            "social_links": SocialLink.query.all(),
            "ga_measurement_id": ga_setting.value if ga_setting else None,
            "sale_page_enabled": (sale_enabled_setting.value == "true") if sale_enabled_setting else True,
            "sale_page_title": sale_title_setting.value if sale_title_setting else "People's Choice",
            "support_phone": support_phone_setting.value if support_phone_setting else None,
            "frontend_url": app.config["FRONTEND_URL"],
        }

    




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

        recent_orders = Order.query.order_by(Order.created_at.desc()).limit(10).all()

        # Fetch About content.
        our_story = AboutContent.query.filter_by(section="our_story").first()
        about_hero = AboutContent.query.filter_by(section="about_hero").first()
        team_members = TeamMember.query.all()

        # Render the dashboard template with all metrics.
        drivers = User.query.filter_by(is_driver=True).all()
        all_users = User.query.all()

        return render_template(
            "admin/dashboard.html",
            title="Dashboard",
            products=products,
            categories=categories,
            total_orders=total_orders,
            total_orders_month=total_orders_month,
            carousel_images=carousel_images,
            faqs=faqs,
            recent_orders=recent_orders,
            our_story=our_story,
            about_hero=about_hero,
            team_members=team_members,
            drivers=drivers,
            all_users=all_users
        )

    @app.route("/admin/delivery/<int:order_id>")
    @login_required
    def admin_delivery(order_id):
        """
        Admin/Driver interface for broadcasting live location to client.
        """
        order = Order.query.get_or_404(order_id)

        # Allow admins or the assigned driver
        if not current_user.is_admin and (not current_user.is_driver or order.driver_id != current_user.id):
            return render_template("error/403.html"), 403

        if order.status != "Out for Delivery":
            order.status = "Out for Delivery"
            db.session.commit()
            
        return render_template("admin/delivery_tracking.html", title="Delivery Tracking", order=order)

    @app.route("/order/<int:order_id>/track")
    @login_required
    def track_order(order_id):
        """
        Client interface for viewing live delivery location.
        """
        order = Order.query.get_or_404(order_id)
        # Ensure only the owner OR an admin can track it
        if order.user_id != current_user.id and not current_user.is_admin:
            return render_template("error/403.html"), 403
            
        return render_template("shop/track_order.html", title="Track Order", order=order)

    @app.route("/dashboard/toggle-driver/<int:user_id>", methods=["POST"])
    @login_required
    def toggle_driver(user_id):
        """
        Promote or demote a user to/from driver role.
        """
        if not current_user.is_admin:
            return render_template("error/403.html"), 403

        user = User.query.get_or_404(user_id)
        user.is_driver = not user.is_driver
        db.session.commit()

        action = "promoted to" if user.is_driver else "removed from"
        flash(f"{user.username} {action} driver role.", "success")
        return redirect(url_for("dashboard"))

    @app.route("/dashboard/assign-driver/<int:order_id>", methods=["POST"])
    @login_required
    def assign_driver(order_id):
        """
        Assign a driver to an order.
        """
        if not current_user.is_admin:
            return render_template("error/403.html"), 403

        order = Order.query.get_or_404(order_id)
        driver_id = request.form.get("driver_id")

        if driver_id:
            driver = User.query.get(int(driver_id))
            if driver and driver.is_driver:
                order.driver_id = driver.id
                db.session.commit()
                flash(f"Driver {driver.username} assigned to Order #{order.id}.", "success")
            else:
                flash("Invalid driver.", "danger")
        else:
            order.driver_id = None
            db.session.commit()
            flash(f"Driver unassigned from Order #{order.id}.", "info")

        return redirect(url_for("dashboard"))

    @app.route("/driver/dashboard")
    @login_required
    def driver_dashboard():
        """
        Driver's limited dashboard showing only their assigned orders.
        """
        if not current_user.is_driver:
            return render_template("error/403.html"), 403

        assigned_orders = Order.query.filter_by(driver_id=current_user.id).order_by(Order.created_at.desc()).all()
        return render_template("driver/driver_dashboard.html", title="My Deliveries", orders=assigned_orders)


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

    @app.route("/payment/paystack/webhook", methods=["POST"])
    def paystack_webhook():
        """
        Handle Paystack webhook events.
        """
        # In a real app, you should verify the signature!
        # signature = request.headers.get('x-paystack-signature')
        
        data = request.get_json()
        if not data:
            return {"status": "error", "message": "No data received"}, 400

        event = data.get("event")
        payload = data.get("data", {})
        reference = payload.get("reference")

        if not reference:
            return {"status": "error", "message": "No reference found"}, 400

        order = Order.query.filter_by(paystack_reference=reference).first()
        if not order:
            return {"status": "error", "message": "Order not found"}, 404

        if event == "charge.success":
            if order.status != "Paid":
                order.status = "Paid"
                db.session.commit()
                send_order_invoice_email(order)
                print(f"[Paystack Webhook] Order #{order.id} marked as Paid")
        elif event in ["charge.failed", "transfer.failed"]:
            order.status = "Failed"
            db.session.commit()
            print(f"[Paystack Webhook] Order #{order.id} marked as Failed")

        return {"status": "success"}, 200

    @app.route("/payment/status/<int:order_id>")
    @login_required
    def check_payment_status(order_id):
        """
        Check and update payment status for an order using Paystack.
        """
        order = Order.query.get_or_404(order_id)
        
        if order.user_id != current_user.id and not current_user.is_admin:
            return {"status": "error", "message": "Access denied"}, 403
            
        if order.status in ["Paid", "Failed", "Cancelled"]:
            return {"status": order.status}
            
        if order.status == "Pending" and order.paystack_reference:
            try:
                paystack = PaystackClient(secret_key=app.config["PAYSTACK_SECRET_KEY"])
                response = paystack.verify_transaction(order.paystack_reference)
                
                if response.get("status") and response["data"]["status"] == "success":
                    order.status = "Paid"
                    db.session.commit()
                    send_order_invoice_email(order)
                elif response.get("status") and response["data"]["status"] in ["failed", "reversed"]:
                    order.status = "Failed"
                    db.session.commit()
            except Exception as e:
                print(f"[Order Status Query] Error for Order #{order.id}: {e}")
                
        return {"status": order.status}

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
