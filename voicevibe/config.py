# voicevibe/config.py
import os
from dotenv import load_dotenv
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
env_path = BASE_DIR / ".env"
load_dotenv(env_path)

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
    TOKEN_EXPIRE_SECONDS = int(os.getenv("TOKEN_EXPIRE_SECONDS", "86400"))
    # Database URL: default sqlite file in project root
    DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'voicevibe.db'}")
    # LLM / ASR keys (optional)
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    WHISPER_API_URL = os.getenv("WHISPER_API_URL", "")
    
    # Session configuration for Flask sessions
    SESSION_COOKIE_SECURE = False  # Set to True in production with HTTPS
    SESSION_COOKIE_HTTPONLY = True  # Prevents JS from accessing session cookie
    SESSION_COOKIE_SAMESITE = "Lax"  # CSRF protection
    SESSION_COOKIE_NAME = "voicevibe_session"
    SESSION_COOKIE_PATH = "/"
    SESSION_COOKIE_DOMAIN = None
    PERMANENT_SESSION_LIFETIME = 86400  # 24 hours in seconds
