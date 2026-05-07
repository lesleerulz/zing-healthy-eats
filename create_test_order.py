from app.app import create_app
from app.models import db, User, Order, Product, OrderItem
from datetime import datetime

app = create_app()

def create_test_data():
    with app.app_context():
        # 1. Create a test user if not exists
        user = User.query.filter_by(email="tester@example.com").first()
        if not user:
            user = User(username="tester", email="tester@example.com")
            user.set_password("password123")
            db.session.add(user)
            db.session.commit()
            print(f"User {user.email} created.")
        else:
            print(f"User {user.email} already exists.")

        # 2. Find a product
        product = Product.query.first()
        if not product:
            print("No products found. Please seed products first.")
            return

        # 3. Create a pending order with a paystack_reference
        reference = f"ZING-TEST-{int(datetime.now().timestamp())}"
        order = Order(
            user_id=user.id,
            status="Pending",
            paystack_reference=reference,
            phone_number="254712345678"
        )
        db.session.add(order)
        db.session.flush()

        # Add an item to the order
        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=1,
            product_title=product.title,
            product_price=product.price
        )
        db.session.add(order_item)
        db.session.commit()

        print(f"Created Pending Order #{order.id} with reference: {reference}")

if __name__ == "__main__":
    create_test_data()
