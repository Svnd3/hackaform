from urllib.parse import urlparse

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import select

from ..errors import APIError
from ..extensions import db
from ..models import Booking, EventCircle
from ..validation import json_body, optional_text
from .helpers import current_user, event_circle_or_404, event_or_404, require_event_owner

event_circles_bp = Blueprint("event_circles", __name__, url_prefix="/api")
CIRCLE_FIELDS = {"inviteUrl", "welcomeMessage"}


def whatsapp_invite_url(payload: dict, *, default=None) -> str:
    value = optional_text(payload, "inviteUrl", maximum=500, default=default)
    if value is None:
        raise APIError(
            "Please correct the highlighted fields.",
            fields={"inviteUrl": "A WhatsApp group invite link is required."},
        )

    parsed = urlparse(value)
    invite_code = parsed.path.strip("/")
    try:
        port = parsed.port
    except ValueError:
        port = -1
    is_valid = (
        parsed.scheme == "https"
        and parsed.hostname == "chat.whatsapp.com"
        and port in {None, 443}
        and parsed.username is None
        and parsed.password is None
        and bool(invite_code)
        and "/" not in invite_code
        and not any(character.isspace() for character in value)
    )
    if not is_valid:
        raise APIError(
            "Please correct the highlighted fields.",
            fields={
                "inviteUrl": "Use a secure link beginning with https://chat.whatsapp.com/.",
            },
        )
    return value


def require_circle_access(event, user):
    if event.owner_id == user.id:
        return
    booking = db.session.scalar(
        select(Booking).where(
            Booking.event_id == event.id,
            Booking.user_id == user.id,
            Booking.status == "confirmed",
        )
    )
    if booking is None:
        raise APIError(
            "A confirmed booking is required to join this event circle.",
            403,
            "forbidden",
        )


@event_circles_bp.get("/events/<int:event_id>/circle")
@jwt_required()
def get_event_circle(event_id):
    event = event_or_404(event_id)
    require_circle_access(event, current_user())
    return jsonify({"data": event_circle_or_404(event).to_dict()})


@event_circles_bp.post("/events/<int:event_id>/circle")
@jwt_required()
def create_event_circle(event_id):
    event = event_or_404(event_id)
    require_event_owner(event, current_user())
    if event.circle is not None:
        raise APIError(
            "This event already has a circle.",
            409,
            "circle_exists",
        )
    payload = json_body(allowed_fields=CIRCLE_FIELDS)
    circle = EventCircle(
        event_id=event.id,
        invite_url=whatsapp_invite_url(payload),
        welcome_message=optional_text(payload, "welcomeMessage", maximum=500),
    )
    db.session.add(circle)
    db.session.commit()
    return jsonify({"data": circle.to_dict()}), 201


@event_circles_bp.patch("/events/<int:event_id>/circle")
@jwt_required()
def update_event_circle(event_id):
    event = event_or_404(event_id)
    require_event_owner(event, current_user())
    circle = event_circle_or_404(event)
    payload = json_body(allowed_fields=CIRCLE_FIELDS)
    if not payload:
        raise APIError(
            "Provide at least one circle field to update.",
            fields={"body": "Empty update."},
        )
    if "inviteUrl" in payload:
        circle.invite_url = whatsapp_invite_url(payload)
    if "welcomeMessage" in payload:
        circle.welcome_message = optional_text(payload, "welcomeMessage", maximum=500)
    db.session.commit()
    return jsonify({"data": circle.to_dict()})


@event_circles_bp.delete("/events/<int:event_id>/circle")
@jwt_required()
def delete_event_circle(event_id):
    event = event_or_404(event_id)
    require_event_owner(event, current_user())
    circle = event_circle_or_404(event)
    db.session.delete(circle)
    db.session.commit()
    return "", 204
