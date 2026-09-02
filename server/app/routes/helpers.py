from flask_jwt_extended import get_jwt_identity
from sqlalchemy import select

from ..errors import APIError
from ..extensions import db
from ..models import AgendaItem, Booking, Event, EventCircle, User


def current_user_id() -> int:
    """Return the integer subject from a verified JWT or a consistent 401."""
    identity = get_jwt_identity()
    try:
        return int(identity)
    except (TypeError, ValueError) as exc:
        raise APIError("The access token is invalid.", 401, "invalid_token") from exc


def current_user() -> User:
    user_id = current_user_id()
    user = db.session.get(User, user_id)
    if user is None:
        raise APIError("The account for this token no longer exists.", 401, "invalid_token")
    return user


def event_or_404(event_id: int, *, for_update: bool = False) -> Event:
    if for_update:
        event = db.session.scalar(select(Event).where(Event.id == event_id).with_for_update())
    else:
        event = db.session.get(Event, event_id)
    if event is None:
        raise APIError("Event not found.", 404, "not_found")
    return event


def agenda_item_or_404(item_id: int) -> AgendaItem:
    item = db.session.get(AgendaItem, item_id)
    if item is None:
        raise APIError("Agenda item not found.", 404, "not_found")
    return item


def booking_or_404(booking_id: int) -> Booking:
    booking = db.session.get(Booking, booking_id)
    if booking is None:
        raise APIError("Booking not found.", 404, "not_found")
    return booking


def event_circle_or_404(event: Event) -> EventCircle:
    if event.circle is None:
        raise APIError("Event circle not found.", 404, "not_found")
    return event.circle


def require_event_owner(event: Event, user: User):
    if event.owner_id != user.id:
        raise APIError(
            "Only the event organizer can perform this action.",
            403,
            "forbidden",
        )


def require_booking_owner(booking: Booking, user: User):
    if booking.user_id != user.id:
        raise APIError("You can only manage your own bookings.", 403, "forbidden")
