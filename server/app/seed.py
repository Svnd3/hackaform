from datetime import UTC, datetime

import click
from flask.cli import with_appcontext
from sqlalchemy import delete, select

from .extensions import db
from .models import AgendaItem, Booking, Event, User


@click.command("seed")
@click.option("--reset", is_flag=True, help="Delete existing application data before seeding.")
@with_appcontext
def seed_command(reset):
    """Load deterministic demo accounts, events, agendas, and a booking."""
    if reset:
        for model in (Booking, AgendaItem, Event, User):
            db.session.execute(delete(model))
        db.session.commit()
    if db.session.scalar(select(User).limit(1)):
        click.echo("Seed skipped: the database already contains users. Use --reset to replace it.")
        return

    organizer = User(name="Amina Njeri", email="organizer@hackaform.test")
    organizer.set_password("DemoPass123")
    attendee = User(name="Brian Otieno", email="attendee@hackaform.test")
    attendee.set_password("DemoPass123")
    db.session.add_all([organizer, attendee])
    db.session.flush()

    event = Event(
        owner_id=organizer.id,
        title="Nairobi Build Weekend",
        description="A practical two-day hackathon for people building useful local technology.",
        category="Hackathon",
        city="Nairobi",
        venue="iHub, Senteu Plaza",
        format="in_person",
        timezone="Africa/Nairobi",
        start_at=datetime(2027, 3, 13, 6, 0, tzinfo=UTC),
        end_at=datetime(2027, 3, 14, 15, 0, tzinfo=UTC),
        capacity=120,
        status="published",
    )
    db.session.add(event)
    db.session.flush()
    db.session.add_all(
        [
            AgendaItem(
                event_id=event.id,
                title="Welcome and challenge briefing",
                speaker="Amina Njeri",
                starts_at=datetime(2027, 3, 13, 6, 30, tzinfo=UTC),
                ends_at=datetime(2027, 3, 13, 7, 30, tzinfo=UTC),
                position=1,
            ),
            AgendaItem(
                event_id=event.id,
                title="Team demos and awards",
                starts_at=datetime(2027, 3, 14, 12, 0, tzinfo=UTC),
                ends_at=datetime(2027, 3, 14, 14, 0, tzinfo=UTC),
                position=2,
            ),
            Booking(
                user_id=attendee.id,
                event_id=event.id,
                quantity=1,
                status="confirmed",
                notes="Vegetarian lunch, please.",
            ),
        ]
    )
    db.session.commit()
    click.echo("Seeded 2 users, 1 event, 2 agenda items, and 1 booking.")
    click.echo("Demo password for both accounts: DemoPass123")
