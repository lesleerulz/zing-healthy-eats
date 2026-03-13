from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class User(UserMixin, db.Model):
    """
    User model for authentication and authorization.
    """

    # Primary key for the user record.
    id = db.Column(db.Integer, primary_key=True)
    # Unique username for login.
    username = db.Column(db.String(64), unique=True, nullable=False)
    # Unique email address for contact.
    email = db.Column(db.String(120), unique=True, nullable=False)
    # Full mailing address, stored as a single formatted string.
    address = db.Column(db.String(255))
    # Filename for user profile picture.
    profile_picture = db.Column(db.String(128), default="default_profile.webp")
    # Hashed password for security.
    password_hash = db.Column(db.String(256), nullable=False)
    # Flag indicating if user has admin rights.
    is_admin = db.Column(db.Boolean, default=False, nullable=False)
    # Saved M-Pesa phone number for quick checkout.
    saved_phone = db.Column(db.String(15), nullable=True)
    # Flag indicating if the user's email address has been verified.
    is_verified = db.Column(db.Boolean, default=False, nullable=False)

    def set_password(self, password: str) -> None:
        """
        Hash and store the user password.
        """

        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """
        Check if provided password matches stored hash.
        """

        return check_password_hash(self.password_hash, password)


class Category(db.Model):
    """
    Category model for grouping products.
    """

    # Primary key for the category.
    id = db.Column(db.Integer, primary_key=True)
    # Name of the category.
    name = db.Column(db.String(50), nullable=False, unique=True)
    # Relationship to products in this category.
    products = db.relationship("Product", backref="category", lazy=True)


class Product(db.Model):
    """
    Product model for catalog items.
    """

    # Primary key for the product record.
    id = db.Column(db.Integer, primary_key=True)
    # Date and time when the product was added to the database.
    date_added = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    # Title of the product.
    title = db.Column(db.String(100), nullable=False)
    # Detailed description of the product.
    description = db.Column(db.Text, nullable=False)
    # Filename for product image.
    image = db.Column(db.String(128), nullable=False, default="default_product.webp")
    # Price of the product.
    price = db.Column(db.Float, nullable=False)
    # Available stock quantity.
    quantity = db.Column(db.Integer, nullable=False, default=0)
    # Foreign key referencing the category (nullable for existing products).
    category_id = db.Column(db.Integer, db.ForeignKey("category.id"), nullable=True)
    # Flag for "People's Choice" awards.
    is_peoples_choice = db.Column(db.Boolean, default=False)
    # Relationship to product images.
    images = db.relationship("ProductImage", backref="product", lazy=True, cascade="all, delete-orphan")


class ProductImage(db.Model):
    """
    Model for storing multiple product images.
    """

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=False)
    image_filename = db.Column(db.String(128), nullable=False)
    is_primary = db.Column(db.Boolean, default=False)


class Order(db.Model):
    """
    Order model for user purchases.
    """

    # Primary key for the order record.
    id = db.Column(db.Integer, primary_key=True)
    # Foreign key referencing the user who placed the order.
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    # Timestamp when the order was created.
    # Timestamp when the order was created.
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    # M-Pesa Payment Details
    phone_number = db.Column(db.String(15), nullable=True)
    mpesa_receipt_number = db.Column(db.String(20), nullable=True)
    checkout_request_id = db.Column(db.String(50), nullable=True)
    status = db.Column(db.String(20), default="Pending")  # Pending, Paid, Failed
    # Relationship to associated order items.
    items = db.relationship("OrderItem", backref="order", lazy=True)


class OrderItem(db.Model):
    """
    Order item model for products in an order.
    """

    # Primary key for the order item record.
    id = db.Column(db.Integer, primary_key=True)
    # Foreign key referencing the parent order.
    order_id = db.Column(db.Integer, db.ForeignKey("order.id"), nullable=False)
    # Foreign key referencing the product (nullable if removed).
    product_id = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=True)
    # Quantity of this product in the order.
    quantity = db.Column(db.Integer, nullable=False)
    # Local copy of the product title.
    product_title = db.Column(db.String(100), nullable=False)
    # Local copy of the product price.
    product_price = db.Column(db.Float, nullable=False)
    # Relationship to the Product model.
    product = db.relationship("Product", foreign_keys=[product_id])

    @property
    def subtotal(self) -> float:
        """
        Calculate the subtotal price for this order item.
        """
        
        return self.quantity * self.product_price


class CartItem(db.Model):
    """
    Items model for temporary cart (before checkout).
    """

    # Primary key for the cart item record.
    id = db.Column(db.Integer, primary_key=True)
    # Foreign key referencing the owning user.
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    # Foreign key referencing the added product.
    product_id = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=False)
    # Quantity of this product in the cart.
    quantity = db.Column(db.Integer, nullable=False, default=1)
    # Relationship to the User model.
    user = db.relationship("User", backref="cart_items")
    # Relationship to the Product model.
    product = db.relationship("Product")


class CarouselImage(db.Model):
    """
    Model for homepage carousel images.
    """
    id = db.Column(db.Integer, primary_key=True)
    image_filename = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class FAQ(db.Model):
    """
    Model for Frequently Asked Questions.
    """
    id = db.Column(db.Integer, primary_key=True)
    question = db.Column(db.String(255), nullable=False)
    answer = db.Column(db.Text, nullable=False)


class AboutContent(db.Model):
    """
    Model for editable sections of the About page.
    """
    id = db.Column(db.Integer, primary_key=True)
    section = db.Column(db.String(50), nullable=False, unique=True)  # e.g., 'our_story'
    content = db.Column(db.Text, nullable=False)


class SocialLink(db.Model):
    """
    Model for dynamic social media links in the footer.
    """
    id = db.Column(db.Integer, primary_key=True)
    platform = db.Column(db.String(50), nullable=False)  # e.g., 'Facebook', 'Instagram'
    url = db.Column(db.String(255), nullable=False)
    icon_class = db.Column(db.String(50), nullable=False) # e.g., 'bi bi-facebook'


class TeamMember(db.Model):
    """
    Model for About Us page team members (e.g. CEO).
    """
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(100), nullable=False)
    image_filename = db.Column(db.String(128), nullable=False) # stored in static/images/about/team/


class SiteSetting(db.Model):
    """
    Key-Value store for site configuration (e.g. Google Analytics ID).
    """
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(50), unique=True, nullable=False)
    value = db.Column(db.String(255), nullable=True)


