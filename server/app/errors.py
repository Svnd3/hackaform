from dataclasses import dataclass, field

from flask import current_app, jsonify
from sqlalchemy.exc import IntegrityError
from werkzeug.exceptions import HTTPException

from .extensions import db


@dataclass
class APIError(Exception):
    message: str
    status_code: int = 400
    code: str = "validation_error"
    fields: dict = field(default_factory=dict)


def error_payload(message: str, code: str, fields: dict | None = None):
    error = {"code": code, "message": message}
    if fields:
        error["fields"] = fields
    return {"error": error}


def register_error_handlers(app):
    @app.errorhandler(APIError)
    def handle_api_error(error):
        return jsonify(error_payload(error.message, error.code, error.fields)), error.status_code

    @app.errorhandler(HTTPException)
    def handle_http_error(error):
        code = error.name.lower().replace(" ", "_")
        return jsonify(error_payload(error.description, code)), error.code

    @app.errorhandler(IntegrityError)
    def handle_integrity_error(error):
        db.session.rollback()
        current_app.logger.info("Database constraint rejected a request: %s", error)
        return jsonify(error_payload("That record conflicts with existing data.", "conflict")), 409

    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        db.session.rollback()
        if app.testing:
            raise error
        current_app.logger.exception("Unhandled API error")
        return jsonify(error_payload("An unexpected server error occurred.", "server_error")), 500


def register_jwt_error_handlers(jwt):
    @jwt.unauthorized_loader
    def missing_token(reason):
        return jsonify(error_payload("Authentication is required.", "authentication_required")), 401

    @jwt.invalid_token_loader
    def invalid_token(reason):
        return jsonify(error_payload("The access token is invalid.", "invalid_token")), 401

    @jwt.expired_token_loader
    def expired_token(jwt_header, jwt_payload):
        return jsonify(error_payload("The access token has expired.", "token_expired")), 401

    @jwt.user_lookup_error_loader
    def missing_user(jwt_header, jwt_payload):
        return jsonify(
            error_payload("The account for this token no longer exists.", "invalid_token")
        ), 401
