from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..errors import APIError
from ..extensions import db
from ..models import AgendaItem, Event
from ..models.base import as_utc
from ..validation import integer_value, iso_datetime, json_body, optional_text, required_text
from .helpers import (
    agenda_item_or_404,
    current_user,
    current_user_id,
    event_or_404,
    require_event_owner,
)

agenda_bp = Blueprint("agenda", __name__, url_prefix="/api")
AGENDA_FIELDS = {"title", "description", "speaker", "startsAt", "endsAt", "position"}


def validate_agenda(payload: dict, event: Event, *, existing: AgendaItem | None = None):
    creating = existing is None
    values = {}
    if creating or "title" in payload:
        values["title"] = required_text(payload, "title", maximum=140, minimum=2)
    for field, maximum in {"description": 2_000, "speaker": 120}.items():
        if field in payload:
            values[field] = optional_text(payload, field, maximum=maximum)
    if creating or "startsAt" in payload:
        values["starts_at"] = iso_datetime(payload, "startsAt", required=creating)
    if creating or "endsAt" in payload:
        values["ends_at"] = iso_datetime(payload, "endsAt", required=creating)
    if creating or "position" in payload:
        values["position"] = integer_value(
            payload, "position", minimum=0, maximum=10_000, default=0
        )
    starts_at = as_utc(values.get("starts_at", existing.starts_at if existing else None))
    ends_at = as_utc(values.get("ends_at", existing.ends_at if existing else None))
    if starts_at and ends_at and ends_at <= starts_at:
        raise APIError(
            "Please correct the agenda times.",
            fields={"endsAt": "The agenda item must end after it starts."},
        )
    if starts_at and (starts_at < as_utc(event.start_at) or ends_at > as_utc(event.end_at)):
        raise APIError(
            "Agenda items must fit within the event schedule.",
            fields={"startsAt": "Use a time within the event dates."},
        )
    return values


def require_visible_event(event: Event):
    identity = get_jwt_identity()
    is_owner = identity is not None and event.owner_id == current_user_id()
    if event.status != "published" and not is_owner:
        raise APIError("Event not found.", 404, "not_found")


@agenda_bp.get("/events/<int:event_id>/agenda-items")
@jwt_required(optional=True)
def list_agenda(event_id):
    event = event_or_404(event_id)
    require_visible_event(event)
    return jsonify({"data": [item.to_dict() for item in event.agenda_items]})


@agenda_bp.post("/events/<int:event_id>/agenda-items")
@jwt_required()
def create_agenda_item(event_id):
    event = event_or_404(event_id)
    require_event_owner(event, current_user())
    payload = json_body(allowed_fields=AGENDA_FIELDS)
    item = AgendaItem(event_id=event.id, **validate_agenda(payload, event))
    db.session.add(item)
    db.session.commit()
    return jsonify({"data": item.to_dict()}), 201


@agenda_bp.get("/agenda-items/<int:item_id>")
@jwt_required(optional=True)
def get_agenda_item(item_id):
    item = agenda_item_or_404(item_id)
    require_visible_event(item.event)
    return jsonify({"data": item.to_dict()})


@agenda_bp.patch("/agenda-items/<int:item_id>")
@jwt_required()
def update_agenda_item(item_id):
    item = agenda_item_or_404(item_id)
    require_event_owner(item.event, current_user())
    payload = json_body(allowed_fields=AGENDA_FIELDS)
    if not payload:
        raise APIError(
            "Provide at least one agenda field to update.", fields={"body": "Empty update."}
        )
    for field, value in validate_agenda(payload, item.event, existing=item).items():
        setattr(item, field, value)
    db.session.commit()
    return jsonify({"data": item.to_dict()})


@agenda_bp.delete("/agenda-items/<int:item_id>")
@jwt_required()
def delete_agenda_item(item_id):
    item = agenda_item_or_404(item_id)
    require_event_owner(item.event, current_user())
    db.session.delete(item)
    db.session.commit()
    return "", 204
