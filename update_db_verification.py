import sqlite3
import os

def update_db():
    db_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'instance', 'database.db')
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute('ALTER TABLE user ADD COLUMN is_verified BOOLEAN DEFAULT 1 NOT NULL')
        
        conn.commit()
        print(f"Successfully updated the database scheme: added 'is_verified' column to 'user' table in {db_path}.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print(f"The 'is_verified' column already exists in the database. ({db_path})")
        else:
            print(f"An error occurred: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    update_db()
