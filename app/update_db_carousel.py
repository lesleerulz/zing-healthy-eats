from app.app import create_app, db
from app.models import CarouselImage

app = create_app()

with app.app_context():
    db.create_all()
    print("Database updated: CarouselImage table created.")
