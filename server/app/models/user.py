from werkzeug.security import check_password_hash, generate_password_hash

from ..extensions import db
from .base import TimestampMixin, isoformat


class User(TimestampMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(254), nullable=False, unique=True, index=True)
    password_hash = db.Column(db.String(256), nullable=False)

    events = db.relationship(
        "Event", back_populates="owner", cascade="all, delete-orphan", passive_deletes=True
    )
    bookings = db.relationship(
        "Booking", back_populates="user", cascade="all, delete-orphan", passive_deletes=True
    )

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "createdAt": isoformat(self.created_at),
        }
