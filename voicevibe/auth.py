# voicevibe/auth.py
from flask import Blueprint, request, jsonify, render_template, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import logging

from .models import SessionLocal, User

logger = logging.getLogger(__name__)
auth_bp = Blueprint("auth", __name__)


def require_auth(f):
    """Decorator to require valid session"""
    @wraps(f)
    def wrapper(*args, **kwargs):
        user_id = session.get("user_id")
        logger.info(f"[AUTH] Checking session for {request.path}: user_id={user_id}, session keys={list(session.keys())}")
        
        if not user_id:
            logger.warning(f"[AUTH] No user_id in session for {request.path}")
            return jsonify({"error": "unauthorized"}), 401
        
        # Attach user info to request object
        request.user = {"id": user_id}
        logger.info(f"[AUTH] User {user_id} authenticated via session")
        
        # Mark session as modified AND permanent so Flask sends updated cookie
        session.permanent = True
        session.modified = True
        
        result = f(*args, **kwargs)
        return result
    
    return wrapper


# ============ Routes ============

@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "GET":
        return render_template("register.html")
    
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()
    
    if not username or not password:
        return jsonify({"error": "username_and_password_required"}), 400
    
    if len(username) < 3 or len(password) < 3:
        return jsonify({"error": "username_and_password_must_be_3_chars"}), 400
    
    db = SessionLocal()
    try:
        # Check if user exists
        existing = db.query(User).filter(User.username == username).first()
        if existing:
            db.close()
            return jsonify({"error": "user_already_exists"}), 409
        
        # Create new user
        hashed = generate_password_hash(password)
        user = User(username=username, password_hash=hashed)
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create session
        session.permanent = True  # Make session persist across browser close
        session["user_id"] = user.id
        session["username"] = user.username
        session.modified = True  # Force Flask to write session
        
        logger.info(f"User registered and logged in: {username} (id={user.id})")
        db.close()
        
        return jsonify({
            "success": True,
            "user": {
                "id": user.id,
                "username": user.username
            }
        }), 201
    
    except Exception as e:
        db.rollback()
        db.close()
        logger.error(f"Register error: {e}")
        return jsonify({"error": "registration_failed"}), 500


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        return render_template("login.html")
    
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()
    
    if not username or not password:
        return jsonify({"error": "username_and_password_required"}), 400
    
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        
        if not user:
            db.close()
            return jsonify({"error": "invalid_credentials"}), 401
        
        if not check_password_hash(user.password_hash, password):
            db.close()
            return jsonify({"error": "invalid_credentials"}), 401
        
        # Create session
        session.permanent = True  # Make session persist across browser close
        session["user_id"] = user.id
        session["username"] = user.username
        session.modified = True  # Force Flask to write session
        
        logger.info(f"User logged in: {username}")
        db.close()
        
        return jsonify({
            "success": True,
            "user": {
                "id": user.id,
                "username": user.username
            }
        }), 200
    
    except Exception as e:
        db.rollback()
        db.close()
        logger.error(f"Login error: {e}")
        return jsonify({"error": "login_failed"}), 500


@auth_bp.route("/logout", methods=["GET", "POST"])
def logout():
    """Clear session"""
    session.clear()
    logger.info("[AUTH] User logged out")
    if request.method == "GET":
        return redirect(url_for("ui.index"))
    return jsonify({"success": True}), 200


@auth_bp.route("/check-auth", methods=["GET"])
def check_auth():
    """Check if user is currently authenticated"""
    user_id = session.get("user_id")
    if user_id:
        return jsonify({"authenticated": True, "user_id": user_id}), 200
    else:
        return jsonify({"authenticated": False}), 200
