import os

# Allow OAuth over HTTP for local testing
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

from app.app import create_app, socketio

app = create_app()

if __name__ == "__main__":
    # Use 'threading' async_mode for local dev to avoid eventlet slowness
    socketio.run(app, debug=True, host='0.0.0.0', allow_unsafe_werkzeug=True)
