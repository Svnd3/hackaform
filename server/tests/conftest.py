from datetime import UTC, datetime

import pytest

from app import create_app
from app.extensions import db


@pytest.fixture()
def app(tmp_path):
    database_file = tmp_path / "test.db"
    app = create_app(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": f"sqlite:///{database_file}",
            "JWT_SECRET_KEY": "test-secret-that-is-not-used-in-production",
            "CORS_ORIGINS": ["http://localhost:5173"],
        }
    )
    with app.app_context():
        db.create_all()
    yield app
    with app.app_context():
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def register(client):
    def register_user(
        *,
        name="Amina Njeri",
        email="amina@example.com",
        password="StrongPass123",
    ):
        response = client.post(
            "/api/auth/register",
            json={"name": name, "email": email, "password": password},
        )
        return response

    return register_user


@pytest.fixture()
def organizer(register):
    response = register()
    assert response.status_code == 201
    body = response.get_json()["data"]
    return {
        "token": body["accessToken"],
        "user": body["user"],
        "headers": {"Authorization": f"Bearer {body['accessToken']}"},
    }


@pytest.fixture()
def attendee(register):
    response = register(name="Brian Otieno", email="brian@example.com")
    assert response.status_code == 201
    body = response.get_json()["data"]
    return {
        "token": body["accessToken"],
        "user": body["user"],
        "headers": {"Authorization": f"Bearer {body['accessToken']}"},
    }


@pytest.fixture()
def event_payload():
    return {
        "title": "Nairobi Build Weekend",
        "description": "A practical weekend for teams building useful technology together.",
        "category": "Hackathon",
        "city": "Nairobi",
        "venue": "iHub, Senteu Plaza",
        "format": "in_person",
        "timezone": "Africa/Nairobi",
        "startAt": datetime(2030, 3, 13, 6, 0, tzinfo=UTC).isoformat(),
        "endAt": datetime(2030, 3, 14, 15, 0, tzinfo=UTC).isoformat(),
        "capacity": 3,
        "status": "published",
    }


@pytest.fixture()
def create_event(client, organizer, event_payload):
    def create(**overrides):
        payload = {**event_payload, **overrides}
        response = client.post("/api/events", json=payload, headers=organizer["headers"])
        assert response.status_code == 201, response.get_json()
        return response.get_json()["data"]

    return create
