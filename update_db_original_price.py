from app.app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("Checking if 'original_price' column exists in 'product' table...")
    try:
        with db.engine.connect() as conn:
            # Check if column exists first
            result = conn.execute(text("PRAGMA table_info(product)"))
            columns = [row[1] for row in result.fetchall()]
            
            if "original_price" not in columns:
                print("Adding 'original_price' column...")
                conn.execute(text("ALTER TABLE product ADD COLUMN original_price FLOAT"))
                conn.commit()
                print("Column added successfully.")
            else:
                print("Column already exists.")
                
    except Exception as e:
        print(f"Error: {e}")
