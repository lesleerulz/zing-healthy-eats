import sys
import os

# Insert the project directory into the path so imports work correctly
# Insert the project directory into the path so imports work correctly
project_home = os.path.dirname(os.path.abspath(__file__))
if project_home not in sys.path:
    sys.path = [project_home] + sys.path

# Import the application factory
from app.app import create_app

# Create the application instance
# Phusion Passenger looks for an object named 'application'
application = create_app()
