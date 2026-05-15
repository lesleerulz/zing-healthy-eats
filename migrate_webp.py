from app.app import create_app
from app.models import db, Product, ProductImage, CarouselImage

app = create_app()

def migrate_to_webp():
    with app.app_context():
        print("Migrating database entries to .webp...")
        
        products = Product.query.all()
        for p in products:
            if p.image and p.image.endswith('.jpg'):
                p.image = p.image.replace('.jpg', '.webp')
        
        product_images = ProductImage.query.all()
        for pi in product_images:
            if pi.image_filename and pi.image_filename.endswith('.jpg'):
                pi.image_filename = pi.image_filename.replace('.jpg', '.webp')
        
        carousel_images = CarouselImage.query.all()
        for ci in carousel_images:
            if ci.image_filename and ci.image_filename.endswith('.jpg'):
                ci.image_filename = ci.image_filename.replace('.jpg', '.webp')
        
        db.session.commit()
        print("Migration complete!")

if __name__ == "__main__":
    migrate_to_webp()
