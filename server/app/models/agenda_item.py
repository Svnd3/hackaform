from sqlalchemy import CheckConstraint

from ..extensions import db
from .base import TimestampMixin, isoformat


class AgendaItem(TimestampMixin, db.Model):
    __tablename__ = "agenda_items"
    __table_args__ = (
        CheckConstraint("position >= 0", name="ck_agenda_items_position"),
        CheckConstraint("ends_at > starts_at", name="ck_agenda_items_valid_dates"),
    )

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(
        db.Integer, db.ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title = db.Column(db.String(140), nullable=False)
    description = db.Column(db.Text)
    speaker = db.Column(db.String(120))
    starts_at = db.Column(db.DateTime(timezone=True), nullable=False)
    ends_at = db.Column(db.DateTime(timezone=True), nullable=False)
    position = db.Column(db.Integer, nullable=False, default=0)

    event = db.relationship("Event", back_populates="agenda_items")

    def to_dict(self):
        return {
            "id": self.id,
            "eventId": self.event_id,
            "title": self.title,
            "description": self.description,
            "speaker": self.speaker,
            "startsAt": isoformat(self.starts_at),
            "endsAt": isoformat(self.ends_at),
            "position": self.position,
            "createdAt": isoformat(self.created_at),
            "updatedAt": isoformat(self.updated_at),
        }
