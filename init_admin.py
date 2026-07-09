import os
from app.app import create_app
from app.models import db, User

def init_admin():
    app = create_app()
    with app.app_context():
        # Check if admin already exists
        admin_email = 'lesleedev@gmail.com'
        admin = User.query.filter_by(email=admin_email).first()
        
        if admin:
            if not admin.is_admin:
                admin.is_admin = True
                db.session.commit()
                print(f"User {admin_email} updated to admin.")
            else:
                print(f"User {admin_email} is already an admin.")
        else:
            # Create new admin
            new_admin = User(
                username="lesleerulz",
                email=admin_email,
                is_admin=True,
                is_verified=True
            )
            new_admin.set_password("lesleerulz")
            db.session.add(new_admin)
            db.session.commit()
            print(f"Admin user {admin_email} created successfully.")

if __name__ == '__main__':
    init_admin()
