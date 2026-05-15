from app.app import create_app, db
from app.models import Product

app = create_app()

def apply_discounts():
    with app.app_context():
        # Define the target discounts
        discounts = {
            "Zing Trail Mix": 1000,
            "Nutty Blend Granola": 1200,
            "Seedful Delight Granola": 1100,
            "Chilli & Lime Roasted Cashews": 800,
            "Roasted Almonds": 800,
            "Garlic & Parmesan Cashews": 900,
            "Zing Signature Gift Hamper": 4500
        }
        
        products = Product.query.all()
        for p in products:
            if p.title in discounts:
                p.original_price = discounts[p.title]
                print(f"Applied discount to: {p.title} (Original: {p.original_price}, Current: {p.price})")
        
        db.session.commit()
        print("\nAll discounts applied successfully!")

if __name__ == "__main__":
    apply_discounts()
