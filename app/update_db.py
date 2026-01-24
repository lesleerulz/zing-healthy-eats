from app.app import create_app, db
from app.models import ProductImage

app = create_app()

with app.app_context():
    # This will create the new table if it doesn't exist
    db.create_all()
    print("Database updated: ProductImage table created.")
