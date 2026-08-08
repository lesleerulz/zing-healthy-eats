"""
API Blueprint for Zing Healthy Eats.
Provides JSON endpoints for the decoupled Next.js frontend.
All routes are prefixed with /api/.
"""

import jwt
from datetime import datetime, timedelta, timezone
from functools import wraps

import math

from flask import Blueprint, current_app, jsonify, request
from flask_login import current_user, login_user
from sqlalchemy import func, or_
from werkzeug.security import generate_password_hash

from app.models import (
    db, AboutContent, CartItem, CarouselImage, Category, FAQ,
    Order, OrderItem, Product, SiteSetting, SocialLink, TeamMember, User
)
from app.paystack import PaystackClient
from app.tokens import get_reset_token, verify_reset_token

api_bp = Blueprint("api", __name__, url_prefix="/api")

@api_bp.route("/init-db-secret-99", methods=["GET"])
def init_db():
    try:
        db.create_all()
        return jsonify({"message": "Database tables created successfully!"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route("/promote-admin-secret-99", methods=["GET"])
def promote_admin():
    user = User.query.filter_by(email="lesleedev@gmail.com").first()
    if user:
        user.is_admin = True
        db.session.commit()
        return jsonify({"message": "User lesleedev@gmail.com promoted to admin!"})
    return jsonify({"error": "User not found. Please register first."})


# ---------------------------------------------------------------------------
# JWT Helpers
# ---------------------------------------------------------------------------

def create_token(user_id: int) -> str:
    """Create a JWT token for the given user ID."""
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")


def decode_token(token: str) -> dict | None:
    """Decode a JWT token and return the payload, or None if invalid."""
    try:
        return jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def token_required(f):
    """Decorator that requires a valid JWT token in the Authorization header."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authorization token required"}), 401

        token = auth_header.split(" ", 1)[1]
        payload = decode_token(token)
        if payload is None:
            return jsonify({"error": "Invalid or expired token"}), 401

        user = User.query.get(payload["user_id"])
        if user is None:
            return jsonify({"error": "User not found"}), 401

        # Attach user to request context for downstream handlers.
        request.api_user = user
        return f(*args, **kwargs)

    return decorated


from flask_mail import Message
import random

def generate_otp() -> str:
    """Generate a random 6-digit OTP code."""
    return str(random.randint(100000, 999999))

def api_send_verification_email(user):
    """Generate a fresh OTP, save it to the user, and send it via email."""
    from datetime import datetime, timedelta, timezone
    otp = generate_otp()
    user.verification_code = otp
    user.verification_code_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    db.session.commit()

    mail = current_app.extensions['mail']
    msg = Message(
        'Your Zing Healthy Eats Verification Code',
        sender=current_app.config['MAIL_USERNAME'],
        recipients=[user.email]
    )
    msg.html = f'''
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 30px; border: 1px solid #eee; border-radius: 12px; background: #fff;">
        <div style="text-align:center; margin-bottom: 24px;">
            <span style="font-size:28px; font-weight:bold; color:#E1AD01;">Zing Healthy Eats</span>
        </div>
        <h2 style="color:#1a3c5e; text-align:center; margin-bottom:8px;">Verify Your Email</h2>
        <p style="color:#555; text-align:center; margin-bottom:28px;">Use the code below to verify your account. It expires in <strong>10 minutes</strong>.</p>
        <div style="background:#f4f8ff; border-radius:12px; padding:24px; text-align:center; margin-bottom:28px;">
            <span style="font-size:48px; font-weight:bold; letter-spacing:12px; color:#1a3c5e;">{otp}</span>
        </div>
        <p style="color:#999; font-size:13px; text-align:center;">If you did not sign up for Zing Healthy Eats, please ignore this email.</p>
    </div>
    '''
    mail.send(msg)


# ---------------------------------------------------------------------------
# Auth Endpoints
# ---------------------------------------------------------------------------

@api_bp.route("/auth/register", methods=["POST"])
def api_register():
    """Register a new user and return a JWT token."""
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    if not username or not email or not password:
        return jsonify({"error": "Username, email, and password are required."}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400

    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({"error": "Username or email already taken."}), 409

    user = User(username=username, email=email, is_verified=False)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    # Try to send verification email
    message = "Registration successful."
    try:
        api_send_verification_email(user)
        message += " A verification email has been sent to your inbox."
    except Exception as e:
        current_app.logger.error(f"Failed to send verification email to {email}: {e}")
        message += " However, we couldn't send a verification email at this time."

    login_user(user, remember=True)
    token = create_token(user.id)
    return jsonify({"token": token, "user": user.to_dict(), "message": message}), 201


@api_bp.route("/auth/login", methods=["POST"])
def api_login():
    """Authenticate user and return a JWT token."""
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify({"error": "Username/email and password are required."}), 400

    user = User.query.filter(
        (User.username == username) | (User.email == username)
    ).first()

    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid credentials."}), 401

    login_user(user, remember=True)
    token = create_token(user.id)
    return jsonify({"token": token, "user": user.to_dict()})


@api_bp.route("/auth/verify/resend", methods=["POST"])
@token_required
def api_resend_verification():
    """Resend OTP verification email to the current user."""
    user = request.api_user
    if user.is_verified:
        return jsonify({"message": "Account is already verified."}), 200

    try:
        api_send_verification_email(user)
        return jsonify({"message": "A new verification code has been sent to your email."})
    except Exception as e:
        current_app.logger.error(f"Failed to resend verification code to {user.email}: {e}")
        return jsonify({"error": "Failed to send verification code."}), 500


@api_bp.route("/auth/verify-email", methods=["POST"])
def api_verify_email():
    """Verify user email via 6-digit OTP code."""
    from datetime import datetime, timezone
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip()
    code = (data.get("code") or "").strip()

    if not email or not code:
        return jsonify({"error": "Email and verification code are required."}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "Invalid code or email."}), 400

    if user.is_verified:
        return jsonify({"message": "Account is already verified."}), 200

    if user.verification_code != code:
        return jsonify({"error": "Incorrect verification code."}), 400

    if not user.verification_code_expires_at:
        return jsonify({"error": "No verification code found. Please request a new one."}), 400

    expires_at = user.verification_code_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires_at:
        return jsonify({"error": "Verification code has expired. Please request a new one."}), 400

    user.is_verified = True
    user.verification_code = None
    user.verification_code_expires_at = None
    db.session.commit()
    return jsonify({"message": "Your account has been successfully verified!"}), 200


@api_bp.route("/auth/forgot-password", methods=["POST"])
def api_forgot_password():
    """Handle forgot password request by sending a reset link."""
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()

    if not email:
        return jsonify({"error": "Email is required."}), 400

    user = User.query.filter_by(email=email).first()
    
    # For security, we don't confirm if the email exists in our DB or not.
    # We just say "If an account exists, an email has been sent."
    if user:
        try:
            token = get_reset_token(user)
            frontend_url = current_app.config.get("FRONTEND_URL", "http://localhost:3000")
            reset_url = f"{frontend_url}/reset-password?token={token}"

            mail = current_app.extensions['mail']
            msg = Message(
                'Password Reset Request',
                sender=current_app.config['MAIL_USERNAME'],
                recipients=[user.email]
            )
            msg.html = f'''
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 30px; border: 1px solid #eee; border-radius: 12px; background: #fff;">
                <div style="text-align:center; margin-bottom: 24px;">
                    <span style="font-size:28px; font-weight:bold; color:#E1AD01;">Zing Healthy Eats</span>
                </div>
                <h2 style="color:#1a3c5e; text-align:center; margin-bottom:8px;">Reset Your Password</h2>
                <p style="color:#555; text-align:center; margin-bottom:28px;">To reset your password, please click the button below. This link expires in 30 minutes.</p>
                <div style="text-align:center; margin-bottom:28px;">
                    <a href="{reset_url}" style="background-color:#0B0E14; color:#fff; padding:14px 28px; border-radius:8px; text-decoration:none; font-weight:bold; display:inline-block;">Reset Password</a>
                </div>
                <p style="color:#888; font-size:12px; text-align:center;">If you did not request this, please ignore this email. No changes will be made to your account.</p>
            </div>
            '''
            mail.send(msg)
        except Exception as e:
            current_app.logger.error(f"Failed to send reset email to {email}: {e}")
            # Still return success to prevent user enumeration

    return jsonify({"message": "If an account exists with that email, a password reset link has been sent."}), 200


@api_bp.route("/auth/reset-password", methods=["POST"])
def api_reset_password():
    """Reset user password using a valid token."""
    data = request.get_json(silent=True) or {}
    token = (data.get("token") or "").strip()
    password = data.get("password") or ""

    if not token or not password:
        return jsonify({"error": "Token and new password are required."}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long."}), 400

    user = verify_reset_token(token)
    if not user:
        return jsonify({"error": "The reset link is invalid or has expired."}), 400

    user.set_password(password)
    db.session.commit()

    return jsonify({"message": "Your password has been updated! You can now log in."}), 200


@api_bp.route("/auth/google/login", methods=["GET"])
def api_google_login():
    """Redirect user to Google OAuth consent screen."""
    from flask import redirect as flask_redirect
    oauth = current_app.extensions.get("oauth")
    if not oauth or not current_app.config.get("GOOGLE_CLIENT_ID"):
        return jsonify({"error": "Google login is not configured."}), 503
    callback_uri = request.host_url.rstrip("/") + "/api/auth/google/callback"
    return oauth.google.authorize_redirect(callback_uri)


@api_bp.route("/auth/google/callback", methods=["GET"])
def api_google_callback():
    """Handle Google OAuth callback, create/find user, return JWT to frontend."""
    import secrets
    from flask import redirect as flask_redirect
    oauth = current_app.extensions.get("oauth")
    frontend_url = current_app.config.get("FRONTEND_URL", "http://localhost:3000")

    error = request.args.get("error")
    if error:
        return flask_redirect(f"{frontend_url}/login?error=google_denied")

    try:
        oauth.google.authorize_access_token()
        user_info = oauth.google.userinfo()
    except Exception as e:
        current_app.logger.error(f"Google OAuth error: {e}")
        return flask_redirect(f"{frontend_url}/login?error=google_failed")

    email = user_info.get("email")
    if not email:
        return flask_redirect(f"{frontend_url}/login?error=no_email")

    # Find or create user
    user = User.query.filter_by(email=email).first()
    if not user:
        username = user_info.get("name") or email.split("@")[0]
        if User.query.filter_by(username=username).first():
            username = f"{username}_{secrets.token_hex(3)}"
        user = User(username=username, email=email, is_verified=True)
        user.set_password(secrets.token_urlsafe(16))
        db.session.add(user)
        db.session.commit()
    elif not user.is_verified:
        user.is_verified = True
        db.session.commit()

    # Issue JWT and redirect to frontend with it
    jwt_token = create_token(user.id)
    return flask_redirect(f"{frontend_url}/login?token={jwt_token}&via=google")


@api_bp.route("/auth/me", methods=["GET"])
@token_required
def api_me():
    """Return the currently authenticated user's profile."""
    user = request.api_user
    login_user(user, remember=True)
    orders_count = Order.query.filter_by(user_id=user.id).count()
    last_order = Order.query.filter_by(user_id=user.id).order_by(Order.created_at.desc()).first()

    data = user.to_dict()
    data["orders_count"] = orders_count
    data["last_order_date"] = last_order.created_at.strftime("%d/%m/%Y") if last_order else None
    return jsonify(data)


@api_bp.route("/auth/profile", methods=["PUT"])
@token_required
def api_update_profile():
    """Update user profile information."""
    user = request.api_user
    data = request.get_json(silent=True) or {}

    new_username = data.get("username")
    new_email = data.get("email")
    new_address = data.get("address")
    new_phone = data.get("saved_phone")

    if new_username:
        dup = User.query.filter(User.username == new_username, User.id != user.id).first()
        if dup:
            return jsonify({"error": "Username already taken."}), 409
        user.username = new_username

    if new_email:
        dup = User.query.filter(User.email == new_email, User.id != user.id).first()
        if dup:
            return jsonify({"error": "Email already taken."}), 409
        user.email = new_email

    if new_address is not None:
        user.address = new_address
    if new_phone is not None:
        user.saved_phone = new_phone

    db.session.commit()
    return jsonify({"message": "Profile updated.", "user": user.to_dict()})


# ---------------------------------------------------------------------------
# Public Data Endpoints
# ---------------------------------------------------------------------------

@api_bp.route("/products", methods=["GET"])
def api_products():
    """List products with optional search, sort, filter, and pagination."""
    sort_by = request.args.get("sort_by", "title")
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 12, type=int)
    search = request.args.get("search", "").strip()
    category_id = request.args.get("category_id", type=int)

    query = Product.query

    if category_id:
        query = query.filter(Product.category_id == category_id)

    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(Product.title.ilike(term), Product.description.ilike(term))
        )

    if sort_by == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort_by == "quantity_asc":
        query = query.order_by(Product.quantity.asc())
    elif sort_by == "quantity_desc":
        query = query.order_by(Product.quantity.desc())
    elif sort_by == "newest":
        query = query.order_by(Product.id.desc())
    else:
        query = query.order_by(Product.title.asc())

    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "products": [p.to_dict() for p in paginated.items],
        "total": paginated.total,
        "pages": paginated.pages,
        "page": paginated.page,
        "per_page": per_page,
        "has_next": paginated.has_next,
        "has_prev": paginated.has_prev,
    })


@api_bp.route("/products/featured", methods=["GET"])
def api_featured_products():
    """Return top-selling and latest products for the homepage."""
    # Latest 4 products.
    latest = Product.query.order_by(Product.id.desc()).limit(4).all()

    # Top-selling 4 products.
    top_query = (
        db.session.query(Product, func.sum(OrderItem.quantity).label("total"))
        .join(OrderItem, Product.id == OrderItem.product_id)
        .group_by(Product.id)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(4)
        .all()
    )
    top = [p for p, _ in top_query]

    return jsonify({
        "latest": [p.to_dict() for p in latest],
        "top_selling": [p.to_dict() for p in top],
    })


@api_bp.route("/products/<int:product_id>", methods=["GET"])
def api_product_detail(product_id):
    """Return a single product's details."""
    product = Product.query.get_or_404(product_id)
    return jsonify(product.to_dict())


@api_bp.route("/categories", methods=["GET"])
def api_categories():
    """Return all product categories."""
    categories = Category.query.all()
    return jsonify([c.to_dict() for c in categories])


@api_bp.route("/carousel", methods=["GET"])
def api_carousel():
    """Return homepage carousel images."""
    images = CarouselImage.query.order_by(CarouselImage.created_at.desc()).all()
    return jsonify([img.to_dict() for img in images])


@api_bp.route("/faqs", methods=["GET"])
def api_faqs():
    """Return FAQ items."""
    faqs = FAQ.query.all()
    return jsonify([faq.to_dict() for faq in faqs])


@api_bp.route("/about", methods=["GET"])
def api_about():
    """Return about page content: our story, hero image, and team members."""
    our_story = AboutContent.query.filter_by(section="our_story").first()
    mission = AboutContent.query.filter_by(section="mission").first()
    hero = AboutContent.query.filter_by(section="about_hero").first()
    team = TeamMember.query.all()

    faqs = FAQ.query.all()

    return jsonify({
        "our_story": our_story.content if our_story else "Our story content goes here.",
        "mission": mission.content if mission else None,
        "hero_image": hero.content if hero else "hero.webp",
        "team_members": [m.to_dict() for m in team],
        "faqs": [f.to_dict() for f in faqs],
    })


@api_bp.route("/social-links", methods=["GET"])
def api_social_links():
    """Return social media links for the footer."""
    links = SocialLink.query.all()
    return jsonify([link.to_dict() for link in links])


@api_bp.route("/site-settings", methods=["GET"])
def api_site_settings():
    """Return public site settings."""
    settings = SiteSetting.query.all()
    result = {}
    for s in settings:
        result[s.key] = s.value
    return jsonify(result)


@api_bp.route("/peoples-choice", methods=["GET"])
def api_peoples_choice():
    """Return People's Choice products."""
    sale_enabled = SiteSetting.query.filter_by(key="sale_page_enabled").first()
    if sale_enabled and sale_enabled.value == "false":
        return jsonify({"error": "Page not available"}), 404

    sale_title = SiteSetting.query.filter_by(key="sale_page_title").first()
    products = Product.query.filter_by(is_peoples_choice=True).all()

    return jsonify({
        "title": sale_title.value if sale_title else "People's Choice",
        "products": [p.to_dict() for p in products],
    })


# ---------------------------------------------------------------------------
# Cart Endpoints
# ---------------------------------------------------------------------------

@api_bp.route("/cart", methods=["GET"])
@token_required
def api_get_cart():
    """Return the current user's cart items."""
    user = request.api_user
    items = CartItem.query.filter_by(user_id=user.id).all()
    total = sum((item.product.price * item.quantity) for item in items if item.product)

    return jsonify({
        "items": [item.to_dict() for item in items],
        "total": total,
        "count": sum(item.quantity for item in items),
    })


@api_bp.route("/cart", methods=["POST"])
@token_required
def api_add_to_cart():
    """Add a product to the cart."""
    user = request.api_user
    data = request.get_json(silent=True) or {}
    product_id = data.get("product_id")
    quantity = data.get("quantity", 1)

    if not product_id:
        return jsonify({"error": "product_id is required."}), 400

    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found."}), 404

    if quantity <= 0:
        return jsonify({"error": "Invalid quantity."}), 400

    item = CartItem.query.filter_by(user_id=user.id, product_id=product.id).first()
    current_qty = item.quantity if item else 0

    if current_qty + quantity > product.quantity:
        return jsonify({"error": "Not enough stock available."}), 400

    if item:
        item.quantity += quantity
    else:
        item = CartItem(user_id=user.id, product_id=product.id, quantity=quantity)
        db.session.add(item)

    db.session.commit()
    return jsonify({"message": "Added to cart.", "item": item.to_dict()}), 201


@api_bp.route("/cart/<int:product_id>", methods=["PUT"])
@token_required
def api_update_cart(product_id):
    """Update the quantity of a cart item."""
    user = request.api_user
    data = request.get_json(silent=True) or {}
    quantity = data.get("quantity", 1)

    item = CartItem.query.filter_by(user_id=user.id, product_id=product_id).first()
    if not item:
        return jsonify({"error": "Item not in cart."}), 404

    if quantity <= 0:
        db.session.delete(item)
        db.session.commit()
        return jsonify({"message": "Item removed from cart."})

    if quantity > item.product.quantity:
        return jsonify({"error": f"Only {item.product.quantity} items available."}), 400

    item.quantity = quantity
    db.session.commit()
    return jsonify({"message": "Cart updated.", "item": item.to_dict()})


@api_bp.route("/cart/<int:product_id>", methods=["DELETE"])
@token_required
def api_remove_from_cart(product_id):
    """Remove an item from the cart."""
    user = request.api_user
    item = CartItem.query.filter_by(user_id=user.id, product_id=product_id).first()
    if item:
        db.session.delete(item)
        db.session.commit()
    return jsonify({"message": "Item removed from cart."})


# ---------------------------------------------------------------------------
# Checkout Endpoints
# ---------------------------------------------------------------------------

def calculate_delivery_fee(delivery_lat, delivery_lng):
    """Calculate distance using Haversine formula and return fee."""
    try:
        lat1 = float(current_app.config.get("STORE_LAT", -1.2921))
        lon1 = float(current_app.config.get("STORE_LNG", 36.8219))
        lat2 = float(delivery_lat)
        lon2 = float(delivery_lng)

        R = 6371  # Radius of earth in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat/2) * math.sin(dlat/2) + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2) * math.sin(dlon/2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        distance = R * c

        if distance <= 5:
            return 250.0, distance
        elif distance <= 10:
            return 350.0, distance
        else:
            return 0.0, distance # Client will contact
    except (ValueError, TypeError):
        return 0.0, 0.0

@api_bp.route("/checkout/calculate-delivery", methods=["POST"])
@token_required
def api_calculate_delivery():
    data = request.get_json(silent=True) or {}
    delivery_type = data.get("delivery_type", "delivery")
    if delivery_type == "pickup":
        return jsonify({"fee": 0, "distance": 0, "message": "Pickup is free."})
    
    delivery_lat = data.get("delivery_lat")
    delivery_lng = data.get("delivery_lng")

    if not delivery_lat or not delivery_lng:
        return jsonify({"fee": 0, "distance": 0, "message": "Location required for delivery."})

    fee, distance = calculate_delivery_fee(delivery_lat, delivery_lng)
    
    message = ""
    if distance > 10:
        message = "You are outside our standard delivery zone. We will contact you to arrange delivery and confirm the fee."
    else:
        message = f"Delivery fee is KSh {fee} for {distance:.1f} km."

    return jsonify({"fee": fee, "distance": distance, "message": message})


@api_bp.route("/checkout/mpesa", methods=["POST"])
@token_required
def api_checkout_mpesa():
    """Initiate M-Pesa checkout via Paystack Charge API."""
    user = request.api_user

    if not user.is_verified:
        return jsonify({"error": "Please verify your email address before placing an order."}), 403

    data = request.get_json(silent=True) or {}
    phone_number = (data.get("phone_number") or "").strip()
    save_phone = data.get("save_phone", False)
    delivery_lat = data.get("delivery_lat")
    delivery_lng = data.get("delivery_lng")
    delivery_type = data.get("delivery_type", "delivery")
    delivery_address = data.get("delivery_address")

    if not phone_number:
        return jsonify({"error": "Phone number is required."}), 400

    # Format phone number for Paystack (KES M-Pesa needs +254...)
    formatted_phone = phone_number
    if formatted_phone.startswith("0"):
        formatted_phone = "+254" + formatted_phone[1:]
    elif not formatted_phone.startswith("+"):
        if len(formatted_phone) == 9:
            formatted_phone = "+254" + formatted_phone
        elif formatted_phone.startswith("254"):
            formatted_phone = "+" + formatted_phone
        else:
            # Fallback: if it's already 12 digits starting with 254, add +
            if len(formatted_phone) == 12 and formatted_phone.startswith("254"):
                formatted_phone = "+" + formatted_phone
            else:
                # If we don't know, just try to prepend +254 if not already there
                formatted_phone = "+254" + formatted_phone.lstrip("+")


    items = CartItem.query.filter_by(user_id=user.id).all()
    if not items:
        return jsonify({"error": "Cart is empty."}), 400

    amount = sum(item.product.price * item.quantity for item in items)
    
    delivery_fee = 0.0
    if delivery_type == "delivery" and delivery_lat and delivery_lng:
        delivery_fee, _ = calculate_delivery_fee(delivery_lat, delivery_lng)
    
    total_amount = amount + delivery_fee
    paystack_amount = int(total_amount * 100)

    # Create Order.
    order = Order(
        user_id=user.id, 
        phone_number=phone_number, 
        status="Pending",
        delivery_type=delivery_type,
        delivery_address=delivery_address,
        delivery_fee=delivery_fee
    )
    if delivery_lat and delivery_lng:
        try:
            order.delivery_lat = float(delivery_lat)
            order.delivery_lng = float(delivery_lng)
        except ValueError:
            pass

    db.session.add(order)
    db.session.flush()

    # Check stock and create OrderItems.
    for item in items:
        product = item.product
        if product.quantity < item.quantity:
            db.session.rollback()
            return jsonify({"error": f"Not enough stock for {product.title}."}), 400

        product.quantity -= item.quantity
        order_item = OrderItem(
            order=order,
            product_id=product.id,
            quantity=item.quantity,
            product_title=product.title,
            product_price=product.price,
        )
        db.session.add(order_item)

    try:
        app = current_app._get_current_object()
        paystack = PaystackClient(secret_key=app.config["PAYSTACK_SECRET_KEY"])
        
        # Paystack reference
        reference = f"ZING-MPESA-{order.id}-{int(datetime.now().timestamp())}"
        
        response = paystack.charge_mobile_money(
            email=user.email,
            amount=paystack_amount,
            phone=formatted_phone,
            reference=reference
        )
        print(f"[Paystack M-Pesa] Request: phone={formatted_phone}, amount={paystack_amount}, reference={reference}")
        print(f"[Paystack M-Pesa] Response: {response}")

        if response.get("status"):
            order.paystack_reference = reference
            if save_phone and user.saved_phone != phone_number:
                user.saved_phone = phone_number
            CartItem.query.filter_by(user_id=user.id).delete()
            db.session.commit()
            return jsonify({
                "message": "Payment initiated. Please check your phone for the M-Pesa prompt.",
                "order": order.to_dict(),
                "reference": reference
            })
        else:
            db.session.rollback()
            return jsonify({"error": response.get("message", "Paystack M-Pesa initiation failed.")}), 502

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@api_bp.route("/checkout/paystack/initialize", methods=["POST"])
@token_required
def api_checkout_paystack_initialize():
    """Initialize Paystack transaction."""
    user = request.api_user

    if not user.is_verified:
        return jsonify({"error": "Please verify your email address before placing an order."}), 403

    data = request.get_json(silent=True) or {}
    delivery_lat = data.get("delivery_lat")
    delivery_lng = data.get("delivery_lng")
    delivery_type = data.get("delivery_type", "delivery")
    delivery_address = data.get("delivery_address")
    method = data.get("method", "all") # 'mpesa', 'card', or 'all'

    items = CartItem.query.filter_by(user_id=user.id).all()
    if not items:
        return jsonify({"error": "Cart is empty."}), 400

    amount = sum(item.product.price * item.quantity for item in items)
    
    delivery_fee = 0.0
    if delivery_type == "delivery" and delivery_lat and delivery_lng:
        delivery_fee, _ = calculate_delivery_fee(delivery_lat, delivery_lng)
        
    total_amount = amount + delivery_fee
    paystack_amount = int(total_amount * 100)

    # Create Order.
    order = Order(
        user_id=user.id, 
        status="Pending",
        delivery_type=delivery_type,
        delivery_address=delivery_address,
        delivery_fee=delivery_fee
    )
    if delivery_lat and delivery_lng:
        try:
            order.delivery_lat = float(delivery_lat)
            order.delivery_lng = float(delivery_lng)
        except ValueError:
            pass

    db.session.add(order)
    db.session.flush()

    # Check stock and create OrderItems.
    for item in items:
        product = item.product
        if product.quantity < item.quantity:
            db.session.rollback()
            return jsonify({"error": f"Not enough stock for {product.title}."}), 400

        product.quantity -= item.quantity
        order_item = OrderItem(
            order=order,
            product_id=product.id,
            quantity=item.quantity,
            product_title=product.title,
            product_price=product.price,
        )
        db.session.add(order_item)

    try:
        app = current_app._get_current_object()
        paystack = PaystackClient(secret_key=app.config["PAYSTACK_SECRET_KEY"])
        
        # Paystack reference can be custom.
        reference = f"ZING-{order.id}-{int(datetime.now().timestamp())}"
        
        metadata = {
            "custom_fields": [
                {
                    "display_name": "Delivery Type",
                    "variable_name": "delivery_type",
                    "value": delivery_type.capitalize()
                }
            ]
        }
        
        if delivery_type == "delivery" and delivery_address:
            metadata["custom_fields"].append({
                "display_name": "Delivery Address",
                "variable_name": "delivery_address",
                "value": delivery_address
            })
        elif delivery_type == "pickup":
            metadata["custom_fields"].append({
                "display_name": "Pickup Location",
                "variable_name": "pickup_location",
                "value": "Nairobi CBD Station"
            })

        # Pre-select channels if method is specified
        channels = None
        if method == "mpesa":
            channels = ["mobile_money"]
        elif method == "card":
            channels = ["card", "bank_transfer"]

        response = paystack.initialize_transaction(
            email=user.email,
            amount=paystack_amount,
            callback_url=app.config["PAYSTACK_CALLBACK_URL"],
            reference=reference,
            metadata=metadata,
            channels=channels
        )

        if response.get("status"):
            order.paystack_reference = reference
            db.session.commit()
            return jsonify(response["data"])
        else:
            db.session.rollback()
            return jsonify({"error": response.get("message", "Paystack initialization failed.")}), 502

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@api_bp.route("/checkout/paystack/verify/<reference>", methods=["GET"])
@token_required
def api_checkout_paystack_verify(reference):
    """Verify Paystack transaction."""
    user = request.api_user
    order = Order.query.filter_by(paystack_reference=reference).first_or_404()

    if order.user_id != user.id and not user.is_admin:
        return jsonify({"error": "Access denied."}), 403

    if order.status == "Paid":
        return jsonify({"status": "Paid", "order": order.to_dict()})

    try:
        app = current_app._get_current_object()
        paystack = PaystackClient(secret_key=app.config["PAYSTACK_SECRET_KEY"])
        response = paystack.verify_transaction(reference)

        if response.get("status") and response["data"]["status"] == "success":
            order.status = "Paid"
            # Clear cart only after successful payment verification
            CartItem.query.filter_by(user_id=user.id).delete()
            db.session.commit()
            return jsonify({"status": "Paid", "order": order.to_dict()})
        else:
            return jsonify({"status": order.status, "message": response.get("message", "Verification failed.")})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# Order Endpoints
# ---------------------------------------------------------------------------

@api_bp.route("/orders", methods=["GET"])
@token_required
def api_orders():
    """Return the current user's order history."""
    user = request.api_user
    orders = Order.query.filter_by(user_id=user.id).order_by(Order.created_at.desc()).all()
    return jsonify([o.to_dict() for o in orders])


@api_bp.route("/orders/<int:order_id>/status", methods=["GET"])
@token_required
def api_order_status(order_id):
    """Check and update payment status for an order."""
    user = request.api_user
    order = Order.query.get_or_404(order_id)

    if order.user_id != user.id and not user.is_admin:
        return jsonify({"error": "Access denied."}), 403

    if order.status in ["Paid", "Failed", "Cancelled"]:
        return jsonify({"status": order.status, "order": order.to_dict()})

    if order.status == "Pending" and order.paystack_reference:
        try:
            app = current_app._get_current_object()
            paystack = PaystackClient(secret_key=app.config["PAYSTACK_SECRET_KEY"])
            response = paystack.verify_transaction(order.paystack_reference)

            if response.get("status") and response["data"]["status"] == "success":
                order.status = "Paid"
                # For M-Pesa via Paystack, the receipt number is in authorization.last4 or similar
                # but usually we just care that it's success.
                db.session.commit()
            elif response.get("status") and response["data"]["status"] in ["failed", "reversed"]:
                order.status = "Failed"
                db.session.commit()

        except Exception as e:
            print(f"[API Order Status Query] Error for Order #{order.id}: {e}")

    return jsonify({"status": order.status, "order": order.to_dict()})

@api_bp.route("/cron/keep-alive", methods=["GET"])
def cron_keep_alive():
    """Ping the database to keep it awake on free tiers."""
    db = get_db()
    db.table("categories").select("id").limit(1).execute()
    return jsonify({"status": "awake", "message": "Database ping successful"}), 200
@api_bp.app_errorhandler(Exception)
def handle_exception(e):
    import traceback
    return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500
