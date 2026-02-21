from itsdangerous import URLSafeTimedSerializer
from flask import current_app
from .models import User

def get_reset_token(user, expires_sec=1800):
    """
    Generate a password reset token for the user.
    """
    s = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    return s.dumps({'user_id': user.id}, salt='password-reset-salt')

def verify_reset_token(token, expires_sec=1800):
    """
    Verify the password reset token and return the user.
    """
    s = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        user_id = s.loads(token, salt='password-reset-salt', max_age=expires_sec)['user_id']
    except Exception:
        return None
    return User.query.get(user_id)
