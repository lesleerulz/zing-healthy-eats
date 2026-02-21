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
    MAX_CONTENT_LENGTH = 2 * 1024 * 1024  # 2MB

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

    # M-Pesa Configuration
    MPESA_CONSUMER_KEY = os.environ.get("MPESA_CONSUMER_KEY") or "dJxzigLuRJoul7IJ2UuyI57O4mOhZg4fiHTN8rAlNUYjbEan"
    MPESA_CONSUMER_SECRET = os.environ.get("MPESA_CONSUMER_SECRET") or "C1ANGA4ABQawJqOqrvYCbJWT8F7qgPqiAB29vUTJfEJsc5J93s69m81U0xaIMJmn"
    MPESA_SHORTCODE = os.environ.get("MPESA_SHORTCODE") or "174379"
    MPESA_PASSKEY = os.environ.get("MPESA_PASSKEY") or "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"
    MPESA_CALLBACK_URL = os.environ.get("MPESA_CALLBACK_URL") or "https://your-domain.com/payment/callback"
    # "CustomerPayBillOnline" for Paybill, "CustomerBuyGoodsOnline" for Till Number
    MPESA_TRANSACTION_TYPE = os.environ.get("MPESA_TRANSACTION_TYPE") or "CustomerPayBillOnline"

    # Google OAuth Configuration
    GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")

