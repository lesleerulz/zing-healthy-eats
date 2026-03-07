import os
import re
from flask import Blueprint, current_app, flash, redirect, render_template, request, url_for, session
from flask_login import current_user, login_user, login_required, logout_user
from werkzeug.utils import secure_filename
from flask_mail import Message
from .tokens import get_reset_token, verify_reset_token

from app.models import db, CartItem, Order, OrderItem, User

# Create blueprint.
auth_bp = Blueprint("auth", __name__, template_folder="../templates/auth")

# Require at least six characters.
PASSWORD_PATTERN = re.compile(r"^.{6,}$")


def allowed_file(filename: str) -> bool:
    """
    Check if filename extension is allowed.
    """
    return ("." in filename and filename.rsplit(".", 1)[1].lower() in current_app.config["IMAGE_EXTENSIONS"])


# REGISTER
@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    """
    Handle user registration.
    """

    # Redirect if user already signed in.
    if current_user.is_authenticated:
        return redirect(url_for("dashboard" if current_user.is_admin else "index"))

    if request.method == "POST":
        # Get form data.
        username = request.form.get("username")
        email = request.form.get("email")
        password = request.form.get("password")
        confirm_password = request.form.get("confirm_password")

        # Require all fields.
        if not username or not email or not password or not confirm_password:
            flash("All fields are required.", "danger")
            return redirect(url_for("auth.register"))

        # Check if passwords match.
        if password != confirm_password:
            flash("Passwords do not match.", "danger")
            return redirect(url_for("auth.register"))

        # Check password format.
        if not PASSWORD_PATTERN.match(password):
            flash("Password must be at least 6 characters long.", "danger")
            return redirect(url_for("auth.register"))

        # Check duplicates.
        existing = User.query.filter((User.username == username) | (User.email == email)).first()
        if existing:
            flash("User already exists.", "danger")
            return redirect(url_for("auth.register"))

        # Create user.
        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        flash("Registration successful.", "success")
        return redirect(url_for("auth.login"))

    # Render register page.
    return render_template("auth/register.html", title="Register")


# LOGIN
@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    """
    Handle user login.
    """

    # Redirect if user already signed in.
    if current_user.is_authenticated:
        return redirect(url_for("dashboard" if current_user.is_admin else "index"))

    if request.method == "POST":
        # Get form data.
        username = request.form.get("username")
        password = request.form.get("password")

        # Find user by username or email.
        user = User.query.filter((User.username == username) | (User.email == username)).first()
        if user and user.check_password(password):
            login_user(user)
            flash("Logged in successfully.", "success")
            
            # Use 'session' directly (imported from flask)
            from flask import session
            if "pending_cart" in session:
                pending_item = session.pop("pending_cart")
                product_id = pending_item["product_id"]
                quantity = pending_item["quantity"]
                
                # Logic to add to cart (duplicate of add_to_cart logic, but simplified)
                # Check for existing item
                item = CartItem.query.filter_by(user_id=user.id, product_id=product_id).first()
                if item:
                    item.quantity += quantity
                else:
                    new_item = CartItem(user_id=user.id, product_id=product_id, quantity=quantity)
                    db.session.add(new_item)
                
                db.session.commit()
                flash("Pending item added to your cart!", "info")
                return redirect(url_for("cart")) # Redirect to cart to show the added item

            return redirect(url_for("dashboard" if user.is_admin else "index"))

        flash("Invalid credentials.", "danger")
        return redirect(url_for("auth.login"))

    # Render login page.
    return render_template("auth/login.html", title="Login")


def send_reset_email(user):
    token = get_reset_token(user)
    mail = current_app.extensions['mail']
    msg = Message('Password Reset Request',
                  sender=current_app.config['MAIL_USERNAME'],
                  recipients=[user.email])
    msg.body = f'''To reset your password, visit the following link:
{url_for('auth.reset_token', token=token, _external=True)}

If you did not make this request then simply ignore this email and no changes will be made.
'''
    mail.send(msg)


@auth_bp.route("/reset_password", methods=['GET', 'POST'])
def reset_request():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    if request.method == 'POST':
        email = request.form.get('email')
        user = User.query.filter_by(email=email).first()
        if user:
            send_reset_email(user)
        flash('An email has been sent with instructions to reset your password.', 'info')
        return redirect(url_for('auth.login'))
    return render_template('auth/reset_request.html', title='Reset Password')


@auth_bp.route("/reset_password/<token>", methods=['GET', 'POST'])
def reset_token(token):
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    user = verify_reset_token(token)
    if user is None:
        flash('That is an invalid or expired token', 'warning')
        return redirect(url_for('auth.reset_request'))
    if request.method == 'POST':
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        if password != confirm_password:
            flash("Passwords do not match.", "danger")
            return redirect(url_for('auth.reset_token', token=token))
        user.set_password(password)
        db.session.commit()
        flash('Your password has been updated! You are now able to log in', 'success')
        return redirect(url_for('auth.login'))
    return render_template('auth/reset_token.html', title='Reset Password')


@auth_bp.route("/login/google")
def google_login():
    """
    Redirect to Google for authentication.
    """
    oauth = current_app.extensions['oauth']
    if not oauth.create_client('google'):
        flash("Google login is not configured.", "warning")
        return redirect(url_for("auth.login"))
        
    redirect_uri = url_for('auth.google_authorise', _external=True)
    return oauth.google.authorize_redirect(redirect_uri)


@auth_bp.route("/login/google/callback")
def google_authorise():
    """
    Handle Google OAuth callback.
    """
    oauth = current_app.extensions['oauth']
    
    # Catch access-denied or other errors sent back from Google
    error = request.args.get('error')
    if error:
        flash(f"Google login incomplete: {error}", "warning")
        return redirect(url_for("auth.login"))
        
    try:
        token = oauth.google.authorize_access_token()
    except Exception as e:
        flash(f"Failed to log in with Google: {str(e)}", "danger")
        return redirect(url_for("auth.login"))
        
    try:
        user_info = oauth.google.userinfo()
    except Exception as e:
        flash(f"Failed to fetch user profile from Google: {str(e)}", "danger")
        return redirect(url_for("auth.login"))
    
    if not user_info:
         flash("Failed to get user info from Google.", "danger")
         return redirect(url_for("auth.login"))
         
    email = user_info.get('email')
    if not email:
        flash("Google login did not provide an email address, which is required.", "danger")
        return redirect(url_for("auth.login"))
        
    username = user_info.get('name') or email.split('@')[0]
    
    # Check if user exists
    user = User.query.filter_by(email=email).first()
    
    if not user:
        # Create new user
        # Generate a random password since they use Google
        import secrets
        random_password = secrets.token_urlsafe(16)
        
        user = User(username=username, email=email)
        # Handle potential username collision
        if User.query.filter_by(username=username).first():
             user.username = f"{username}_{secrets.token_hex(4)}"
             
        user.set_password(random_password)
        db.session.add(user)
        db.session.commit()
        
    login_user(user)
    flash("Logged in with Google successfully.", "success")
    return redirect(url_for("dashboard" if user.is_admin else "index"))


# LOGOUT
@auth_bp.route("/logout")
@login_required
def logout():
    """
    Log out current user.
    """

    logout_user()
    flash("Logged out.", "warning")
    return redirect(url_for("index"))


# PROFILE
@auth_bp.route("/profile", methods=["GET", "POST"])
@login_required
def profile():
    """
    Display and update user profile.
    """

    if request.method == "POST":
        # Determine which form was submitted.
        form_type = request.form.get("form_type")

        if form_type == "info":
            # Update username and email.
            new_username = request.form.get("username")
            new_email = request.form.get("email")

            # Require both fields.
            if not new_username or not new_email:
                flash("Both username and email are required.", "danger")
                return redirect(url_for("auth.profile"))

            # Check for duplicates.
            duplicate = User.query.filter(((User.username == new_username) | (User.email == new_email)) & (User.id != current_user.id)).first()
            if duplicate:
                flash("Username or email already taken.", "danger")
                return redirect(url_for("auth.profile"))

            # Update user fields and save changes.
            current_user.username = new_username
            current_user.email = new_email
            db.session.commit()
            flash("Profile info updated.", "success")
            return redirect(url_for("auth.profile"))

        if form_type == "address":
            # Update user address.
            street = request.form.get("street", "").strip()
            postal_code = request.form.get("postal_code", "").strip()
            city = request.form.get("city", "").strip()
            country = request.form.get("country", "").strip()

            # Ensure all address fields are provided.
            if not street or not postal_code or not city or not country:
                flash("All address fields are required.", "danger")
                return redirect(url_for("auth.profile"))

            # Format and update address.
            current_user.address = f"{street}|{postal_code}|{city}|{country}"
            db.session.commit()
            flash("Address updated.", "success")
            return redirect(url_for("auth.profile"))

        if form_type == "password":
            # Handle password change
            current_password = request.form.get("current_password")
            new_password = request.form.get("new_password")
            confirm_new_password = request.form.get("confirm_new_password")

            # Check current password matches
            if not current_user.check_password(current_password):
                flash("Current password is incorrect.", "danger")
                return render_template("auth/profile.html", title="Profile", active_tab="password")

            # Check new password and confirmation match
            if new_password != confirm_new_password:
                flash("New passwords do not match.", "danger")
                return render_template("auth/profile.html", title="Profile", active_tab="password")

            # Validate new password format
            if not PASSWORD_PATTERN.match(new_password):
                flash("Password must be at least 6 characters long.", "danger")
                return render_template("auth/profile.html", title="Profile", active_tab="password")

            # Save new password
            current_user.set_password(new_password)
            db.session.commit()
            flash("Password changed successfully.", "success")
            return redirect(url_for("auth.profile"))

        if form_type == "picture":
            # Handle profile picture upload.
            if "picture" not in request.files:
                flash("No file part.", "danger")
                return redirect(url_for("auth.profile"))

            file = request.files["picture"]

            # Flash if no file was selected.
            if file.filename == "":
                flash("No selected file.", "danger")
                return redirect(url_for("auth.profile"))

            # Flash if file extension is not allowed.
            if not allowed_file(file.filename):
                flash("File type not allowed.", "danger")
                return redirect(url_for("auth.profile"))

            profile_picture_folder = current_app.config["PROFILE_PICTURE_FOLDER"]
            if not os.path.exists(profile_picture_folder):
                os.makedirs(profile_picture_folder)

            # Remove old picture if it is not the default.
            old_filename = current_user.profile_picture
            default_pic = current_app.config["DEFAULT_PROFILE_PICTURE"]
            if old_filename != default_pic:
                old_path = os.path.join(profile_picture_folder, old_filename)
                if os.path.exists(old_path):
                    os.remove(old_path)

            # Save new picture file.
            ext = file.filename.rsplit(".", 1)[1].lower()
            filename = secure_filename(f"user_{current_user.id}.{ext}")
            upload_path = os.path.join(profile_picture_folder, filename)
            file.save(upload_path)

            # Update user record with new picture.
            current_user.profile_picture = filename
            db.session.commit()
            flash("Profile picture updated.", "success")
            return redirect(url_for("auth.profile"))
        
    orders_query = Order.query.filter_by(user_id=current_user.id)
    orders_count = orders_query.count()

    last_order = orders_query.order_by(Order.created_at.desc()).first()

    if last_order:
        last_order_date = last_order.created_at.strftime("%d/%m/%Y")
    else:
        last_order_date = None

    # Render profile page.
    return render_template("auth/profile.html", title="Profile", orders_count=orders_count, last_order_date=last_order_date)


@auth_bp.route("/delete-account", methods=["POST"])
@login_required
def delete_account():
    """
    Delete user account and related data (profile picture, cart, orders).
    """

    # Get profile picture folder and default picture filename.
    profile_picture_folder = current_app.config["PROFILE_PICTURE_FOLDER"]
    default_pic = current_app.config["DEFAULT_PROFILE_PICTURE"]
    
    # Delete user's profile picture if it is not the default one.
    if current_user.profile_picture != default_pic:
        pic_path = os.path.join(profile_picture_folder, current_user.profile_picture)
        
        if os.path.exists(pic_path):
            os.remove(pic_path)

    # Delete all items from user's cart.
    CartItem.query.filter_by(user_id=current_user.id).delete()

    # Delete all user's orders and their items.
    orders = Order.query.filter_by(user_id=current_user.id).all()
    for order in orders:
        OrderItem.query.filter_by(order_id=order.id).delete()
        db.session.delete(order)

    # Save user ID and log out user.
    user_id = current_user.id
    logout_user()

    # Delete user account from database.
    user = User.query.get(user_id)
    db.session.delete(user)

    # Commit all changes to the database.
    db.session.commit()

    # Show confirmation message and redirect to home page.
    flash("Your account and all associated data have been deleted.", "warning")
    return redirect(url_for("index"))
