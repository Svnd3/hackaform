from sqlalchemy import CheckConstraint

from ..extensions import db
from .base import TimestampMixin, isoformat


class EventCircle(TimestampMixin, db.Model):
    __tablename__ = "event_circles"
    __table_args__ = (
        CheckConstraint("platform = 'whatsapp'", name="ck_event_circles_platform"),
    )

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(
        db.Integer,
        db.ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    platform = db.Column(db.String(20), nullable=False, default="whatsapp")
    invite_url = db.Column(db.String(500), nullable=False)
    welcome_message = db.Column(db.String(500))

    event = db.relationship("Event", back_populates="circle")

    def to_dict(self):
        return {
            "id": self.id,
            "eventId": self.event_id,
            "platform": self.platform,
            "inviteUrl": self.invite_url,
            "welcomeMessage": self.welcome_message,
            "createdAt": isoformat(self.created_at),
            "updatedAt": isoformat(self.updated_at),
        }
