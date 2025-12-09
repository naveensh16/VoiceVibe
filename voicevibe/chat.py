# voicevibe/chat.py
import os
import logging
from flask import Blueprint, request, jsonify, render_template, session
from werkzeug.utils import secure_filename
from .models import SessionLocal, Conversation, Message
from .llm import run_llm
from .auth import require_auth
from datetime import datetime

logger = logging.getLogger(__name__)
chat_bp = Blueprint("chat", __name__)

UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# serve chat UI (GET)
@chat_bp.route("/chat-ui", methods=["GET"])
def chat_ui():
    return render_template("chat.html")

# Session-based chat history endpoints
@chat_bp.route("/session-history", methods=["GET"])
@require_auth
def get_session_history():
    """Get chat history from current session"""
    history = session.get('chat_history', [])
    return jsonify({"history": history})

@chat_bp.route("/session-history", methods=["POST"])
@require_auth
def add_to_session_history():
    """Add message to session history"""
    data = request.get_json() or {}
    message = data.get("message")
    role = data.get("role", "user")
    
    if not message:
        return jsonify({"error": "No message provided"}), 400
    
    if 'chat_history' not in session:
        session['chat_history'] = []
    
    session['chat_history'].append({
        "text": message,
        "role": role,
        "timestamp": datetime.utcnow().isoformat()
    })
    session.modified = True
    
    return jsonify({"status": "ok"})

@chat_bp.route("/session-history", methods=["DELETE"])
@require_auth
def clear_session_history():
    """Clear session chat history"""
    session.pop('chat_history', None)
    session.modified = True
    return jsonify({"status": "cleared"})

# text chat API (POST) - requires auth
@chat_bp.route("/chat", methods=["POST"])
@require_auth
def chat_api():
    logger.info("[CHAT] Processing message...")
    data = request.get_json() or {}
    text = (data.get("message") or "").strip()
    if not text:
        logger.warning("[CHAT] Empty message received")
        return jsonify({"error": "empty message"}), 400

    db = SessionLocal()
    # create conversation for user or use last one
    user_id = getattr(request, "user", {}).get("id")
    logger.info(f"[CHAT] User ID from request.user: {user_id}")
    conv = None
    if user_id:
        conv = db.query(Conversation).filter(Conversation.user_id == user_id).order_by(Conversation.created_at.desc()).first()
    if not conv:
        logger.info(f"[CHAT] Creating new conversation for user {user_id}")
        conv = Conversation(user_id=user_id, created_at=datetime.utcnow())
        db.add(conv); db.commit(); db.refresh(conv)

    # save user message
    um = Message(conversation_id=conv.id, role="user", content=text)
    db.add(um); db.commit()
    logger.info(f"[CHAT] Saved user message: {text[:50]}...")

    # call LLM
    reply = run_llm(text)
    logger.info(f"[CHAT] LLM replied: {reply[:50]}...")

    bm = Message(conversation_id=conv.id, role="assistant", content=reply)
    db.add(bm); db.commit()
    
    db.close()
    logger.info("[CHAT] Message processed successfully")
    return jsonify({"reply": reply})

# voice upload (multipart)
@chat_bp.route("/voice", methods=["POST"])
@require_auth
def voice_api():
    if 'audio' not in request.files:
        return jsonify({"error": "no audio file"}), 400
    f = request.files['audio']
    filename = secure_filename(f.filename or "voice.webm")
    path = os.path.join(UPLOAD_DIR, filename)
    f.save(path)

    # TODO: integrate Whisper ASR here. For now use fallback transcription.
    transcription = f"(transcribed) placeholder for {filename}"

    db = SessionLocal()
    user_id = getattr(request, "user", {}).get("id")
    conv = None
    if user_id:
        conv = db.query(Conversation).filter(Conversation.user_id == user_id).order_by(Conversation.created_at.desc()).first()
    if not conv:
        conv = Conversation(user_id=user_id, created_at=datetime.utcnow())
        db.add(conv); db.commit(); db.refresh(conv)

    db.add(Message(conversation_id=conv.id, role="user", content=transcription)); db.commit()
    reply = run_llm(transcription)
    db.add(Message(conversation_id=conv.id, role="assistant", content=reply)); db.commit()

    try:
        os.remove(path)
    except Exception:
        pass

    db.close()
    return jsonify({"transcription": transcription, "response": reply})

# history endpoint - list recent convos for user (requires auth)
@chat_bp.route("/history", methods=["GET"])
@require_auth
def history():
    db = SessionLocal()
    user_id = getattr(request, "user", {}).get("id")
    convs = db.query(Conversation).filter(Conversation.user_id == user_id).order_by(Conversation.created_at.desc()).limit(50).all()
    out = []
    for c in convs:
        snippet = c.messages[-1].content[:160] if c.messages else ""
        out.append({"id": c.id, "title": c.title, "created_at": c.created_at.isoformat(), "snippet": snippet})
    return jsonify({"conversations": out})

# conversation view
@chat_bp.route("/conversation/<int:conv_id>", methods=["GET"])
@require_auth
def conversation(conv_id):
    db = SessionLocal()
    conv = db.query(Conversation).get(conv_id)
    if not conv:
        return jsonify({"error": "not found"}), 404
    msgs = [{"role": m.role, "content": m.content, "created_at": m.created_at.isoformat()} for m in conv.messages]
    return jsonify({"id": conv.id, "title": conv.title, "messages": msgs})

# settings (save ephemeral for now)
@chat_bp.route("/settings", methods=["POST"])
@require_auth
def settings():
    data = request.get_json() or {}
    # TODO: persist user settings
    return jsonify({"status": "ok", "saved": data})
