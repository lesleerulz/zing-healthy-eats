"""
Migration: Add verification_code and verification_code_expires_at columns to the user table.
Run once: python migrate_otp.py
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'instance', 'database.db')

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    for col, definition in [
        ("verification_code", "VARCHAR(6)"),
        ("verification_code_expires_at", "DATETIME"),
    ]:
        try:
            cursor.execute(f"ALTER TABLE user ADD COLUMN {col} {definition}")
            print(f"Added column: {col}")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print(f"Column already exists: {col}")
            else:
                raise

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
