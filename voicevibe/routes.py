# voicevibe/routes.py
from flask import Blueprint, render_template
import logging

logger = logging.getLogger(__name__)
ui_bp = Blueprint("ui", __name__)

@ui_bp.route("/", methods=["GET"])
def index():
    logger.info("=== INDEX ROUTE CALLED ===")
    logger.info("Serving index.html from templates/")
    return render_template("index.html")