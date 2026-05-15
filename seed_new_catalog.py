import os
from datetime import datetime
from app.app import create_app
from app.models import db, Product, Category, ProductImage, CarouselImage, SiteSetting

app = create_app()

def seed_new_catalog():
    with app.app_context():
        print("Clearing existing catalog data...")
        # Clear existing data to start fresh as requested
        db.session.query(ProductImage).delete()
        db.session.query(Product).delete()
        db.session.query(Category).delete()
        db.session.commit()

        print("Seeding new categories...")
        categories_data = [
            "Granola & Cereals",
            "Signature Trail Mixes",
            "Gourmet Roasted Nuts",
            "Exotic Dried Fruits",
            "Healthy Seeds & Kernels",
            "Luxury Gift Hampers",
            "Artisanal Nut Butters"
        ]
        
        cat_map = {}
        for name in categories_data:
            cat = Category(name=name)
            db.session.add(cat)
            db.session.commit()
            cat_map[name] = cat.id

        # Get list of new images
        image_dir = "static/images/product_pictures"
        all_images = [f for f in os.listdir(image_dir) if f.startswith("DSC") and f.endswith(".jpg")]
        all_images.sort()

        if not all_images:
            print("No DSC images found in static/images/product_pictures. Aborting.")
            return

        print(f"Found {len(all_images)} new images. Creating products...")

        # Define some specific high-quality products
        products_to_create = [
            {
                "title": "Zing Signature Granola",
                "description": "Our award-winning blend of rolled oats, honey-glazed almonds, and organic seeds. Perfect for a high-energy start to your day.",
                "price": 1250,
                "original_price": 1500,
                "category": "Granola & Cereals",
                "is_peoples_choice": True,
                "num_images": 3
            },
            {
                "title": "Mountain Berry Trail Mix",
                "description": "A vibrant mix of dried cranberries, blueberries, walnuts, and pumpkin seeds. Rich in antioxidants and natural energy.",
                "price": 850,
                "original_price": 1000,
                "category": "Signature Trail Mixes",
                "is_peoples_choice": True,
                "num_images": 2
            },
            {
                "title": "Smoked Paprika Almonds",
                "description": "Slow-roasted Californian almonds dusted with premium Spanish smoked paprika and a touch of sea salt.",
                "price": 750,
                "category": "Gourmet Roasted Nuts",
                "is_peoples_choice": True,
                "num_images": 2
            },
            {
                "title": "Honey-Glazed Cashews",
                "description": "Extra large cashew nuts lightly toasted and coated in pure organic honey. A sweet and salty perfection.",
                "price": 950,
                "original_price": 1200,
                "category": "Gourmet Roasted Nuts",
                "is_peoples_choice": False,
                "num_images": 2
            },
            {
                "title": "Tropical Dried Mango Strips",
                "description": "Sun-dried natural mango slices with no added sugar. A chewy, sweet, and healthy alternative to candy.",
                "price": 600,
                "category": "Exotic Dried Fruits",
                "is_peoples_choice": False,
                "num_images": 1
            },
            {
                "title": "Zing Wellness Gift Basket",
                "description": "The ultimate expression of care. Includes a selection of our finest granolas, nuts, and dried fruits in a hand-woven basket.",
                "price": 4500,
                "original_price": 5500,
                "category": "Luxury Gift Hampers",
                "is_peoples_choice": True,
                "num_images": 4
            },
            {
                "title": "Organic Pumpkin Seeds",
                "description": "Grade A pumpkin seeds, perfect for snacking or adding a crunch to your salads and soups.",
                "price": 450,
                "category": "Healthy Seeds & Kernels",
                "is_peoples_choice": False,
                "num_images": 1
            },
            {
                "title": "Creamy Almond Butter",
                "description": "100% pure almonds, stone-ground to perfection. No added oils, salt, or sugar. Just pure nutty goodness.",
                "price": 1100,
                "category": "Artisanal Nut Butters",
                "is_peoples_choice": True,
                "num_images": 2
            }
        ]

        # Add more generic products to use up more images
        generic_names = [
            ("Salted Pistachios", "Gourmet Roasted Nuts"),
            ("Walnut Halves", "Gourmet Roasted Nuts"),
            ("Dried Apricots", "Exotic Dried Fruits"),
            ("Chia Seeds", "Healthy Seeds & Kernels"),
            ("Sunflower Seeds", "Healthy Seeds & Kernels"),
            ("Dark Chocolate Nuts", "Signature Trail Mixes"),
            ("Breakfast Power Mix", "Granola & Cereals"),
            ("Festive Nut Platter", "Luxury Gift Hampers"),
            ("Pecan Halves", "Gourmet Roasted Nuts"),
            ("Macadamia Bliss", "Gourmet Roasted Nuts"),
            ("Dried Pineapple Rings", "Exotic Dried Fruits"),
            ("Goji Berries", "Exotic Dried Fruits"),
            ("Flax Seed Powder", "Healthy Seeds & Kernels"),
            ("Hemp Hearts", "Healthy Seeds & Kernels"),
            ("Cinnamon Spiced Granola", "Granola & Cereals"),
            ("Keto Friendly Mix", "Signature Trail Mixes")
        ]

        for name, cat in generic_names:
            products_to_create.append({
                "title": name,
                "description": f"Premium quality {name.lower()} sourced from the best growers. Fresh, healthy, and delicious.",
                "price": 500 + (len(products_to_create) * 50) % 1000,
                "category": cat,
                "is_peoples_choice": len(products_to_create) % 4 == 0,
                "num_images": 1
            })

        image_idx = 0
        for p_data in products_to_create:
            if image_idx >= len(all_images):
                break

            main_image = all_images[image_idx]
            p = Product(
                title=p_data["title"],
                description=p_data["description"],
                price=p_data["price"],
                original_price=p_data.get("original_price"),
                quantity=50,
                image=main_image,
                category_id=cat_map[p_data["category"]],
                is_peoples_choice=p_data["is_peoples_choice"]
            )
            db.session.add(p)
            db.session.flush() # Get product ID

            # Add multiple images if specified
            num_imgs = p_data.get("num_images", 1)
            for i in range(num_imgs):
                if image_idx < len(all_images):
                    img_filename = all_images[image_idx]
                    pi = ProductImage(
                        product_id=p.id,
                        image_filename=img_filename,
                        is_primary=(i == 0)
                    )
                    db.session.add(pi)
                    image_idx += 1
                else:
                    break

        db.session.commit()
        print(f"Successfully seeded {len(products_to_create)} products.")

        print("Updating site settings...")
        settings = {
            "sale_page_enabled": "true",
            "sale_page_title": "People's Choice Sale",
            "store_lat": "-1.2921",
            "store_lng": "36.8219"
        }
        for key, value in settings.items():
            s = SiteSetting.query.filter_by(key=key).first()
            if s:
                s.value = value
            else:
                db.session.add(SiteSetting(key=key, value=value))
        
        print("Updating carousel images...")
        db.session.query(CarouselImage).delete()
        # Use some of the new images for the carousel too
        carousel_images = all_images[:3] # First 3 images
        for img in carousel_images:
            db.session.add(CarouselImage(image_filename=img))
        
        db.session.commit()
        print("Catalog update complete!")

if __name__ == "__main__":
    seed_new_catalog()
