from sqlalchemy import CheckConstraint, func, select

from ..extensions import db
from .base import TimestampMixin, isoformat


class Event(TimestampMixin, db.Model):
    __tablename__ = "events"
    __table_args__ = (
        CheckConstraint("capacity > 0", name="ck_events_positive_capacity"),
        CheckConstraint("end_at > start_at", name="ck_events_valid_dates"),
        CheckConstraint("format IN ('in_person', 'online', 'hybrid')", name="ck_events_format"),
        CheckConstraint("status IN ('draft', 'published', 'cancelled')", name="ck_events_status"),
    )

    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title = db.Column(db.String(140), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(80), nullable=False, index=True)
    city = db.Column(db.String(80), nullable=False, index=True)
    venue = db.Column(db.String(180))
    format = db.Column(db.String(20), nullable=False, default="in_person", index=True)
    timezone = db.Column(db.String(64), nullable=False, default="Africa/Nairobi")
    start_at = db.Column(db.DateTime(timezone=True), nullable=False, index=True)
    end_at = db.Column(db.DateTime(timezone=True), nullable=False)
    capacity = db.Column(db.Integer, nullable=False, default=100)
    status = db.Column(db.String(20), nullable=False, default="published", index=True)
    image_url = db.Column(db.String(500))

    owner = db.relationship("User", back_populates="events")
    agenda_items = db.relationship(
        "AgendaItem",
        back_populates="event",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="AgendaItem.position, AgendaItem.starts_at",
    )
    bookings = db.relationship(
        "Booking", back_populates="event", cascade="all, delete-orphan", passive_deletes=True
    )

    @property
    def booked_spots(self) -> int:
        from .booking import Booking

        statement = select(func.coalesce(func.sum(Booking.quantity), 0)).where(
            Booking.event_id == self.id, Booking.status == "confirmed"
        )
        return int(db.session.execute(statement).scalar_one())

    def to_dict(self, *, include_agenda=False):
        booked_spots = self.booked_spots
        data = {
            "id": self.id,
            "ownerId": self.owner_id,
            "organizer": self.owner.name if self.owner else None,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "city": self.city,
            "venue": self.venue,
            "format": self.format,
            "timezone": self.timezone,
            "startAt": isoformat(self.start_at),
            "endAt": isoformat(self.end_at),
            "capacity": self.capacity,
            "bookedSpots": booked_spots,
            "availableSpots": max(self.capacity - booked_spots, 0),
            "status": self.status,
            "imageUrl": self.image_url,
            "createdAt": isoformat(self.created_at),
            "updatedAt": isoformat(self.updated_at),
        }
        if include_agenda:
            data["agendaItems"] = [item.to_dict() for item in self.agenda_items]
        return data
