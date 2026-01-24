from app.app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("Checking if column exists...")
    try:
        # SQLite syntax to add column
        with db.engine.connect() as conn:
            conn.execute(text("ALTER TABLE product ADD COLUMN is_peoples_choice BOOLEAN DEFAULT 0"))
            conn.commit()
        print("Column added successfully.")
    except Exception as e:
        print(f"Column might already exist or error: {e}")
