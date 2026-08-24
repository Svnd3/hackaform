from flask import Blueprint, jsonify
from sqlalchemy import text

from ..extensions import db

health_bp = Blueprint("health", __name__, url_prefix="/api")


@health_bp.get("/health")
def health():
    db.session.execute(text("SELECT 1"))
    return jsonify({"data": {"service": "hackaform-api", "status": "ok"}})
