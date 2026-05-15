from app.app import create_app
from app.models import db, Product, Category, CarouselImage

app = create_app()

def seed():
    with app.app_context():
        # Clear old products if any (optional, but good for clean start)
        # db.session.query(Product).delete()
        
        # Ensure categories exist
        categories = ["Granola", "Trail Mix", "Roasted Nuts", "Gift Hampers"]
        cat_map = {}
        for name in categories:
            cat = Category.query.filter_by(name=name).first()
            if not cat:
                cat = Category(name=name)
                db.session.add(cat)
                db.session.commit()
            cat_map[name] = cat.id

        # New Products
        products = [
            {
                "title": "Zing Trail Mix",
                "description": "Our signature blend of premium nuts, seeds, and dried fruits. High in protein, fiber, and Omega-3. The perfect on-the-go snack.",
                "price": 850,
                "original_price": 1000,
                "quantity": 50,
                "image": "trail_mix.jpg",
                "category_id": cat_map["Trail Mix"],
                "is_peoples_choice": True
            },
            {
                "title": "Nutty Blend Granola",
                "description": "Oven-baked granola with a rich blend of almonds, cashews, and seeds. Naturally sweetened and incredibly crunchy.",
                "price": 950,
                "original_price": 1200,
                "quantity": 30,
                "image": "nutty_blend_granola.jpg",
                "category_id": cat_map["Granola"],
                "is_peoples_choice": True
            },
            {
                "title": "Seedful Delight Granola",
                "description": "A seed-heavy granola for those who love extra crunch. Packed with pumpkin seeds, sunflower seeds, and flax seeds.",
                "price": 950,
                "quantity": 25,
                "image": "seedful_delight_granola.jpg",
                "category_id": cat_map["Granola"],
                "is_peoples_choice": False
            },
            {
                "title": "Chilli & Lime Roasted Cashews",
                "description": "Zesty lime meets a hint of chilli in these perfectly roasted cashews. A savory treat with a kick.",
                "price": 650,
                "quantity": 40,
                "image": "chilli_lime_cashews.jpg",
                "category_id": cat_map["Roasted Nuts"],
                "is_peoples_choice": True
            },
            {
                "title": "Roasted Almonds",
                "description": "Simple, crunchy, and perfectly roasted almonds. A classic healthy snack for any time of day.",
                "price": 650,
                "quantity": 45,
                "image": "roasted_almonds.jpg",
                "category_id": cat_map["Roasted Nuts"],
                "is_peoples_choice": False
            },
            {
                "title": "Garlic & Parmesan Cashews",
                "description": "Indulge in the savory flavor of garlic and parmesan cheese on our premium roasted cashews.",
                "price": 700,
                "quantity": 20,
                "image": "cashew_variety.jpg",
                "category_id": cat_map["Roasted Nuts"],
                "is_peoples_choice": False
            },
            {
                "title": "Zing Signature Gift Hamper",
                "description": "The ultimate healthy gift. Includes a variety of our best-selling granolas, nuts, and trail mixes beautifully packaged.",
                "price": 3500,
                "original_price": 4500,
                "quantity": 10,
                "image": "gift_hamper.jpg",
                "category_id": cat_map["Gift Hampers"],
                "is_peoples_choice": True
            }
        ]

        for p_data in products:
            existing = Product.query.filter_by(title=p_data["title"]).first()
            if existing:
                existing.description = p_data["description"]
                existing.price = p_data["price"]
                existing.original_price = p_data.get("original_price")
                existing.image = p_data["image"]
                existing.category_id = p_data["category_id"]
                existing.is_peoples_choice = p_data["is_peoples_choice"]
                print(f"Updated product: {p_data['title']}")
            else:
                p = Product(**p_data)
                db.session.add(p)
                print(f"Added product: {p_data['title']}")

        # Seed Carousel
        if not CarouselImage.query.filter_by(image_filename="hero_hamper.jpg").first():
            ci = CarouselImage(image_filename="hero_hamper.jpg")
            db.session.add(ci)
            print("Added hero hamper to carousel.")

        db.session.commit()
        print("Seeding complete!")

if __name__ == "__main__":
    seed()
