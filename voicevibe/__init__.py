# voicevibe/__init__.py
from flask import Flask, session
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
    
    # Ensure session configuration is loaded
    app.config['SESSION_COOKIE_SECURE'] = False
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=1)
    
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
