from datetime import UTC, datetime

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func, select

from ..errors import APIError
from ..extensions import db
from ..models import Booking
from ..models.base import as_utc
from ..validation import choice, integer_value, json_body, optional_text
from .helpers import (
    booking_or_404,
    current_user,
    event_or_404,
    require_booking_owner,
    require_event_owner,
)

bookings_bp = Blueprint("bookings", __name__, url_prefix="/api")
BOOKING_FIELDS = {"eventId", "quantity", "status", "notes"}
BOOKING_STATUSES = {"confirmed", "cancelled"}


def event_accepts_bookings(event) -> bool:
    return event.status == "published" and as_utc(event.end_at) > datetime.now(UTC)


def confirmed_total(event_id: int, *, exclude_booking_id: int | None = None) -> int:
    statement = select(func.coalesce(func.sum(Booking.quantity), 0)).where(
        Booking.event_id == event_id, Booking.status == "confirmed"
    )
    if exclude_booking_id is not None:
        statement = statement.where(Booking.id != exclude_booking_id)
    return int(db.session.execute(statement).scalar_one())


def ensure_capacity(event, quantity: int, status: str, *, exclude_booking_id=None):
    if status != "confirmed":
        return
    remaining = event.capacity - confirmed_total(event.id, exclude_booking_id=exclude_booking_id)
    if quantity > remaining:
        raise APIError(
            "This event does not have enough places available.",
            409,
            "event_full",
            {"quantity": f"Only {max(remaining, 0)} places remain."},
        )


@bookings_bp.get("/bookings")
@jwt_required()
def list_bookings():
    user = current_user()
    bookings = db.session.scalars(
        select(Booking).where(Booking.user_id == user.id).order_by(Booking.created_at.desc())
    ).all()
    return jsonify({"data": [booking.to_dict() for booking in bookings]})


@bookings_bp.post("/bookings")
@jwt_required()
def create_booking():
    user = current_user()
    payload = json_body(allowed_fields=BOOKING_FIELDS)
    event_id = integer_value(payload, "eventId", minimum=1, maximum=2_147_483_647)
    if event_id is None:
        raise APIError("Please choose an event.", fields={"eventId": "This field is required."})
    event = event_or_404(event_id, for_update=True)
    if not event_accepts_bookings(event):
        raise APIError("This event is not accepting bookings.", 409, "booking_closed")
    if event.owner_id == user.id:
        raise APIError("Organizers cannot book their own events.", 409, "owner_booking")
    existing = db.session.scalar(
        select(Booking).where(Booking.user_id == user.id, Booking.event_id == event.id)
    )
    if existing:
        raise APIError("You already have a booking for this event.", 409, "duplicate_booking")
    quantity = integer_value(payload, "quantity", minimum=1, maximum=10, default=1)
    status = choice(payload, "status", BOOKING_STATUSES, default="confirmed")
    notes = optional_text(payload, "notes", maximum=500)
    ensure_capacity(event, quantity, status)
    booking = Booking(
        user_id=user.id,
        event_id=event.id,
        quantity=quantity,
        status=status,
        notes=notes,
    )
    db.session.add(booking)
    db.session.commit()
    return jsonify({"data": booking.to_dict()}), 201


@bookings_bp.get("/bookings/<int:booking_id>")
@jwt_required()
def get_booking(booking_id):
    booking = booking_or_404(booking_id)
    require_booking_owner(booking, current_user())
    return jsonify({"data": booking.to_dict()})


@bookings_bp.patch("/bookings/<int:booking_id>")
@jwt_required()
def update_booking(booking_id):
    booking = booking_or_404(booking_id)
    require_booking_owner(booking, current_user())
    # Serialize capacity changes with competing PostgreSQL reservations.
    event = event_or_404(booking.event_id, for_update=True)
    payload = json_body(allowed_fields={"quantity", "status", "notes"})
    if not payload:
        raise APIError(
            "Provide at least one booking field to update.", fields={"body": "Empty update."}
        )
    quantity = integer_value(payload, "quantity", minimum=1, maximum=10, default=booking.quantity)
    status = choice(payload, "status", BOOKING_STATUSES, default=booking.status)
    notes = optional_text(payload, "notes", maximum=500, default=booking.notes)
    if (
        not event_accepts_bookings(event)
        and status == "confirmed"
        and (booking.status != "confirmed" or quantity > booking.quantity)
    ):
        raise APIError("This event is not accepting bookings.", 409, "booking_closed")
    ensure_capacity(booking.event, quantity, status, exclude_booking_id=booking.id)
    booking.quantity = quantity
    booking.status = status
    booking.notes = notes
    db.session.commit()
    return jsonify({"data": booking.to_dict()})


@bookings_bp.delete("/bookings/<int:booking_id>")
@jwt_required()
def delete_booking(booking_id):
    booking = booking_or_404(booking_id)
    require_booking_owner(booking, current_user())
    db.session.delete(booking)
    db.session.commit()
    return "", 204


@bookings_bp.get("/events/<int:event_id>/bookings")
@jwt_required()
def list_event_bookings(event_id):
    event = event_or_404(event_id)
    require_event_owner(event, current_user())
    bookings = db.session.scalars(
        select(Booking).where(Booking.event_id == event.id).order_by(Booking.created_at)
    ).all()
    return jsonify(
        {
            "data": [
                booking.to_dict(include_event=False, include_attendee=True) for booking in bookings
            ]
        }
    )
