from flask import Blueprint, jsonify
from flask_jwt_extended import create_access_token, jwt_required
from sqlalchemy import select

from ..errors import APIError
from ..extensions import db
from ..models import User
from ..validation import email_address, json_body, required_text
from .helpers import current_user

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.post("/register")
def register():
    payload = json_body(allowed_fields={"name", "email", "password"})
    name = required_text(payload, "name", maximum=80, minimum=2)
    email = email_address(payload.get("email"))
    password = payload.get("password")
    if not isinstance(password, str) or not 8 <= len(password) <= 128:
        raise APIError(
            "Please choose a stronger password.",
            fields={"password": "Use between 8 and 128 characters."},
        )
    if db.session.scalar(select(User).where(User.email == email)):
        raise APIError(
            "An account with this email already exists.",
            409,
            "email_taken",
            {"email": "Try signing in instead."},
        )

    user = User(name=name, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    token = create_access_token(identity=str(user.id))
    return jsonify({"data": {"accessToken": token, "user": user.to_dict()}}), 201


@auth_bp.post("/login")
def login():
    payload = json_body(allowed_fields={"email", "password"})
    email = email_address(payload.get("email"))
    password = payload.get("password", "")
    user = db.session.scalar(select(User).where(User.email == email))
    if user is None or not isinstance(password, str) or not user.check_password(password):
        raise APIError("Email or password is incorrect.", 401, "invalid_credentials")
    token = create_access_token(identity=str(user.id))
    return jsonify({"data": {"accessToken": token, "user": user.to_dict()}})


@auth_bp.get("/me")
@jwt_required()
def me():
    return jsonify({"data": current_user().to_dict()})
