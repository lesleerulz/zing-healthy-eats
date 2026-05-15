from app.app import create_app
from app.models import db, CartItem

app = create_app()

def check_cart_images():
    with app.app_context():
        items = CartItem.query.all()
        if not items:
            print("No items in cart.")
            return
        for item in items:
            print(f"CartItem {item.id}: Product ID {item.product_id}, Image: {item.product.image if item.product else 'N/A'}")

if __name__ == "__main__":
    check_cart_images()
