from app.app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("Checking if paystack_reference column exists in order table...")
    try:
        # SQLite syntax to add column
        with db.engine.connect() as conn:
            # Note: SQLite table name for Order model is usually 'order' (but might be quoted if it's a reserved word, though Flask-SQLAlchemy usually handles it)
            # In models.py it's class Order(db.Model), usually table name is 'order'
            # Let's check the table name first if possible or just try 'order'
            conn.execute(text("ALTER TABLE \"order\" ADD COLUMN paystack_reference VARCHAR(100)"))
            conn.commit()
        print("Column 'paystack_reference' added successfully to 'order' table.")
    except Exception as e:
        print(f"Column might already exist or error: {e}")
