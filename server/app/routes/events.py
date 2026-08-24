from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import or_, select

from ..errors import APIError
from ..extensions import db
from ..models import Event
from ..models.base import as_utc
from ..validation import (
    choice,
    http_url,
    integer_value,
    iso_datetime,
    json_body,
    optional_text,
    required_text,
    timezone_name,
)
from .helpers import current_user, current_user_id, event_or_404, require_event_owner

events_bp = Blueprint("events", __name__, url_prefix="/api/events")
EVENT_FIELDS = {
    "title",
    "description",
    "category",
    "city",
    "venue",
    "format",
    "timezone",
    "startAt",
    "endAt",
    "capacity",
    "status",
    "imageUrl",
}
FORMATS = {"in_person", "online", "hybrid"}
STATUSES = {"draft", "published", "cancelled"}


def query_integer(name: str, default: int, minimum: int, maximum: int) -> int:
    try:
        value = int(request.args.get(name, default))
    except (TypeError, ValueError) as exc:
        raise APIError(
            "Invalid pagination parameters.", fields={name: "Must be a whole number."}
        ) from exc
    if value < minimum or value > maximum:
        raise APIError(
            "Invalid pagination parameters.",
            fields={name: f"Use a value from {minimum} to {maximum}."},
        )
    return value


def validated_event_values(payload: dict, *, existing: Event | None = None) -> dict:
    creating = existing is None
    values = {}
    text_specs = {
        "title": (140, 3),
        "description": (10_000, 20),
        "category": (80, 2),
        "city": (80, 2),
    }
    for field, (maximum, minimum) in text_specs.items():
        if creating or field in payload:
            values[field] = required_text(payload, field, maximum=maximum, minimum=minimum)
    for field, maximum in {"venue": 180}.items():
        if field in payload:
            values[field] = optional_text(payload, field, maximum=maximum)
    if creating or "format" in payload:
        values["format"] = choice(payload, "format", FORMATS, default="in_person")
    if creating or "status" in payload:
        values["status"] = choice(payload, "status", STATUSES, default="published")
    if creating or "timezone" in payload:
        values["timezone"] = timezone_name(payload)
    if creating or "startAt" in payload:
        values["start_at"] = iso_datetime(payload, "startAt", required=creating)
    if creating or "endAt" in payload:
        values["end_at"] = iso_datetime(payload, "endAt", required=creating)
    if creating or "capacity" in payload:
        values["capacity"] = integer_value(
            payload, "capacity", minimum=1, maximum=100_000, default=100
        )
    if "imageUrl" in payload:
        values["image_url"] = http_url(payload, "imageUrl")

    start_at = as_utc(values.get("start_at", existing.start_at if existing else None))
    end_at = as_utc(values.get("end_at", existing.end_at if existing else None))
    if start_at and end_at and end_at <= start_at:
        raise APIError(
            "Please correct the event dates.",
            fields={"endAt": "The event must end after it starts."},
        )
    if existing and any(
        as_utc(item.starts_at) < start_at or as_utc(item.ends_at) > end_at
        for item in existing.agenda_items
    ):
        raise APIError(
            "The updated event dates would exclude an agenda item.",
            409,
            "agenda_conflict",
            {"startAt": "Keep every agenda item within the event schedule."},
        )
    capacity = values.get("capacity", existing.capacity if existing else 100)
    if existing and capacity < existing.booked_spots:
        raise APIError(
            "Capacity cannot be lower than confirmed attendance.",
            409,
            "capacity_conflict",
            {"capacity": f"At least {existing.booked_spots} places are required."},
        )
    return values


@events_bp.get("")
@jwt_required(optional=True)
def list_events():
    page = query_integer("page", 1, 1, 1_000_000)
    per_page = query_integer("perPage", 12, 1, 100)
    statement = select(Event)

    mine = request.args.get("mine", "false").lower() == "true"
    identity = get_jwt_identity()
    if mine:
        if identity is None:
            raise APIError("Authentication is required.", 401, "authentication_required")
        statement = statement.where(Event.owner_id == current_user_id())
    else:
        statement = statement.where(Event.status == "published")

    search = request.args.get("search", "").strip()
    if search:
        pattern = f"%{search}%"
        statement = statement.where(
            or_(
                Event.title.ilike(pattern),
                Event.description.ilike(pattern),
                Event.category.ilike(pattern),
                Event.city.ilike(pattern),
            )
        )
    for parameter, column in {
        "category": Event.category,
        "city": Event.city,
        "format": Event.format,
        "status": Event.status,
    }.items():
        value = request.args.get(parameter)
        if value and (mine or parameter != "status"):
            statement = statement.where(column == value)

    statement = statement.order_by(Event.start_at.asc(), Event.id.asc())
    pagination = db.paginate(statement, page=page, per_page=per_page, error_out=False)
    return jsonify(
        {
            "data": [event.to_dict() for event in pagination.items],
            "meta": {
                "page": pagination.page,
                "perPage": pagination.per_page,
                "pages": pagination.pages,
                "total": pagination.total,
            },
        }
    )


@events_bp.post("")
@jwt_required()
def create_event():
    user = current_user()
    payload = json_body(allowed_fields=EVENT_FIELDS)
    values = validated_event_values(payload)
    event = Event(owner_id=user.id, **values)
    db.session.add(event)
    db.session.commit()
    return jsonify({"data": event.to_dict(include_agenda=True)}), 201


@events_bp.get("/<int:event_id>")
@jwt_required(optional=True)
def get_event(event_id):
    event = event_or_404(event_id)
    identity = get_jwt_identity()
    is_owner = identity is not None and event.owner_id == current_user_id()
    if event.status != "published" and not is_owner:
        raise APIError("Event not found.", 404, "not_found")
    return jsonify({"data": event.to_dict(include_agenda=True)})


@events_bp.patch("/<int:event_id>")
@jwt_required()
def update_event(event_id):
    event = event_or_404(event_id, for_update=True)
    require_event_owner(event, current_user())
    payload = json_body(allowed_fields=EVENT_FIELDS)
    if not payload:
        raise APIError(
            "Provide at least one event field to update.", fields={"body": "Empty update."}
        )
    for field, value in validated_event_values(payload, existing=event).items():
        setattr(event, field, value)
    db.session.commit()
    return jsonify({"data": event.to_dict(include_agenda=True)})


@events_bp.delete("/<int:event_id>")
@jwt_required()
def delete_event(event_id):
    event = event_or_404(event_id)
    require_event_owner(event, current_user())
    db.session.delete(event)
    db.session.commit()
    return "", 204
