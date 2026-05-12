import sys
import os
from app.app import create_app
from app.models import db, User
from app.api import api_send_verification_email

def test_verification():
    app = create_app()
    with app.app_context():
        # Find the latest user to test with
        user = User.query.order_by(User.id.desc()).first()
        
        if not user:
            print("No users found in database. Please register a user first.")
            return

        print(f"Testing email verification for user: {user.username} ({user.email})")
        print(f"SMTP Server: {app.config.get('MAIL_SERVER')}")
        print(f"SMTP User: {app.config.get('MAIL_USERNAME')}")
        
        try:
            api_send_verification_email(user)
            print("\nSUCCESS: Verification email sent successfully!")
            print("Please check the inbox (and spam folder) of the recipient email.")
        except Exception as e:
            print(f"\nFAILED: Could not send verification email.")
            print(f"Error Details: {str(e)}")

if __name__ == "__main__":
    test_verification()
