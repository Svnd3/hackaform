from sqlalchemy import CheckConstraint, UniqueConstraint

from ..extensions import db
from .base import TimestampMixin, isoformat


class Booking(TimestampMixin, db.Model):
    __tablename__ = "bookings"
    __table_args__ = (
        UniqueConstraint("user_id", "event_id", name="uq_bookings_user_event"),
        CheckConstraint("quantity BETWEEN 1 AND 10", name="ck_bookings_quantity"),
        CheckConstraint("status IN ('confirmed', 'cancelled')", name="ck_bookings_status"),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    event_id = db.Column(
        db.Integer, db.ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True
    )
    quantity = db.Column(db.Integer, nullable=False, default=1)
    status = db.Column(db.String(20), nullable=False, default="confirmed", index=True)
    notes = db.Column(db.String(500))

    user = db.relationship("User", back_populates="bookings")
    event = db.relationship("Event", back_populates="bookings")

    def to_dict(self, *, include_event=True, include_attendee=False):
        data = {
            "id": self.id,
            "userId": self.user_id,
            "eventId": self.event_id,
            "quantity": self.quantity,
            "status": self.status,
            "notes": self.notes,
            "createdAt": isoformat(self.created_at),
            "updatedAt": isoformat(self.updated_at),
        }
        if include_event:
            data["event"] = self.event.to_dict() if self.event else None
        if include_attendee:
            data["attendee"] = self.user.to_dict() if self.user else None
        return data
