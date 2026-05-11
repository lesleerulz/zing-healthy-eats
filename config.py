import os
from dotenv import load_dotenv

load_dotenv()

basedir = os.path.abspath(os.path.dirname(__file__))


class Config:
    """
    Base config for Flask application.
    """

    SECRET_KEY = os.environ.get("SECRET_KEY") or "change-this-in-production"
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL") or f"sqlite:///{os.path.join(basedir, 'database.db')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Images upload configuration.
    IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB

    # Profile pictures.
    PROFILE_PICTURE_FOLDER = os.path.join(basedir, "static", "images", "profile_pictures")
    DEFAULT_PROFILE_PICTURE = "default_profile.webp"

    # Product pictures.
    PRODUCT_PICTURE_FOLDER = os.path.join(basedir, "static", "images", "product_pictures")
    DEFAULT_PRODUCT_PICTURE = "default_product.webp"

    # Carousel pictures.
    CAROUSEL_PICTURE_FOLDER = os.path.join(basedir, "static", "images", "carousel")

    # About pictures.
    ABOUT_PICTURE_FOLDER = os.path.join(basedir, "static", "images", "about")
    TEAM_PICTURE_FOLDER = os.path.join(basedir, "static", "images", "about", "team")

    # Paystack Configuration
    PAYSTACK_SECRET_KEY = os.environ.get("PAYSTACK_SECRET_KEY")
    PAYSTACK_CALLBACK_URL = os.environ.get("PAYSTACK_CALLBACK_URL") or "http://localhost:3000/orders"

    # Google OAuth Configuration
    GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")

    # Flask-Mail Configuration
    MAIL_SERVER = os.environ.get("MAIL_SERVER") or "smtp.gmail.com"
    MAIL_PORT = int(os.environ.get("MAIL_PORT") or 587)
    MAIL_USE_TLS = os.environ.get("MAIL_USE_TLS", "True").lower() == "true"
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD")

    # Frontend Configuration
    FRONTEND_URL = os.environ.get("FRONTEND_URL") or "http://localhost:3000"

    # Store Location (Default: Nairobi CBD for distance calculation)
    STORE_LAT = float(os.environ.get("STORE_LAT", -1.2921))
    STORE_LNG = float(os.environ.get("STORE_LNG", 36.8219))
