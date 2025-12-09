# voicevibe/__init__.py
from flask import Flask, session
from flask_session import Session
from dotenv import load_dotenv
import os
from datetime import timedelta

# load .env from project root
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

from .config import Config
from .auth import auth_bp
from .chat import chat_bp
from .routes import ui_bp
from .models import init_db

def create_app():
    app = Flask(__name__, static_folder="../static", template_folder="../templates")
    app.config.from_object(Config)

    # Ensure SECRET_KEY is set (critical for sessions)
    if not app.config.get('SECRET_KEY') or app.config['SECRET_KEY'] == 'dev-secret':
        app.config['SECRET_KEY'] = os.urandom(24).hex()
        print("WARNING: Using random SECRET_KEY. Set SECRET_KEY in .env for production!")
    
    # Create flask_session directory if it doesn't exist
    session_dir = os.path.join(BASE_DIR, "flask_session")
    os.makedirs(session_dir, exist_ok=True)
    
    # Initialize Flask-Session for server-side sessions
    Session(app)
    
    # After request handler to ensure session is persisted
    @app.after_request
    def set_session_cookie(response):
        if 'user_id' in session:
            session.permanent = True
            session.modified = True
        return response

    # register blueprints (order: ui -> auth -> chat)
    app.register_blueprint(ui_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(chat_bp)

    # create DB tables if needed
    with app.app_context():
        init_db(app)

    return app
