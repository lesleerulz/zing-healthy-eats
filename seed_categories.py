from sqlalchemy import text, inspect
from app.app import create_app
from app.models import db, Category

app = create_app()

with app.app_context():
    print("Checking database schema...")
    
    # 1. Ensure Category table exists
    db.create_all()
    print("Verified tables exist.")

    # 2. Check for category_id column in product table
    inspector = inspect(db.engine)
    columns = [c['name'] for c in inspector.get_columns('product')]
    
    if 'category_id' not in columns:
        print("Adding category_id column to product table...")
        try:
            with db.engine.connect() as conn:
                # Attempt to add the column. 
                # Note: valid for SQLite/PostgreSQL/MySQL for simple add column
                conn.execute(text("ALTER TABLE product ADD COLUMN category_id INTEGER REFERENCES category(id)"))
                conn.commit()
            print("Column 'category_id' added successfully.")
        except Exception as e:
            print(f"Error adding column: {e}")
    else:
        print("Column 'category_id' already exists.")

    # 3. Seed Categories
    print("Seeding categories...")
    initial_categories = ["Granola", "Trail Mix", "Flavoured Nuts"]
    
    for name in initial_categories:
        if not Category.query.filter_by(name=name).first():
            category = Category(name=name)
            db.session.add(category)
            print(f" - Added: {name}")
        else:
            print(f" - Exists: {name}")
            
    db.session.commit()
    print("Seeding complete.")
