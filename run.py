import os

# Allow OAuth over HTTP for local testing
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

from app.app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0')
