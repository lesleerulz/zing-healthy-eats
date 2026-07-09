import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Set OAuth over HTTP for local testing (but respect env override)
if os.environ.get('OAUTHLIB_INSECURE_TRANSPORT') is None:
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

from werkzeug.middleware.proxy_fix import ProxyFix
from app.app import create_app

# Create Flask app
app = create_app()

# Apply ProxyFix for Vercel's edge network
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

# For Vercel serverless functions
def handler(request, response):
    return app(request.environ, response.start_response)

# Also expose as WSGI app for compatibility
application = app
