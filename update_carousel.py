import os
from app.app import create_app
from app.models import db, CarouselImage

app = create_app()

def update_carousel():
    with app.app_context():
        print("Updating carousel images in database...")
        # Clear existing carousel images
        db.session.query(CarouselImage).delete()
        
        # Define the specific images we want (the ones just copied)
        new_images = [
            "elena-kloppenburg-erUC4fTtCuo-unsplash.jpg",
            "emma-simpson-mNGaaLeWEp0-unsplash.jpg",
            "louis-hansel-qdE7A8XqUgc-unsplash.jpg",
            "maksim-shutov-pUa1On18Jno-unsplash.jpg"
        ]
        
        for img in new_images:
            # Check if file exists just in case
            if os.path.exists(os.path.join("static/images/carousel", img)):
                db.session.add(CarouselImage(image_filename=img))
                print(f"Added {img} to carousel.")
            else:
                print(f"Warning: {img} not found in static/images/carousel.")
        
        db.session.commit()
        print("Carousel update complete!")

if __name__ == "__main__":
    update_carousel()
