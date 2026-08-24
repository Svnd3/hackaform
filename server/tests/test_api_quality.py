from datetime import timedelta

from flask_jwt_extended import create_access_token

from app.config import database_url


def test_database_url_normalizes_common_postgres_schemes(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgres://user:pass@db.example/hackaform")
    assert database_url() == "postgresql+psycopg://user:pass@db.example/hackaform"

    monkeypatch.setenv("DATABASE_URL", "postgresql://user:pass@db.example/hackaform")
    assert database_url() == "postgresql+psycopg://user:pass@db.example/hackaform"


def test_http_and_validation_errors_have_the_standard_envelope(client):
    missing = client.get("/api/not-a-route")
    wrong_content_type = client.post("/api/auth/login", data="not json")
    non_object = client.post("/api/auth/login", data="[]", content_type="application/json")

    assert missing.status_code == 404
    assert missing.get_json()["error"]["code"] == "not_found"
    assert wrong_content_type.status_code == 415
    assert wrong_content_type.get_json()["error"]["code"] == "unsupported_media_type"
    assert non_object.status_code == 400
    assert non_object.get_json()["error"]["fields"]["body"] == "Invalid JSON object."


def test_invalid_and_expired_tokens_are_rejected(app, client):
    invalid = client.get("/api/auth/me", headers={"Authorization": "Bearer definitely-not-a-jwt"})
    with app.app_context():
        expired_token = create_access_token(identity="1", expires_delta=timedelta(seconds=-1))
    expired = client.get("/api/auth/me", headers={"Authorization": f"Bearer {expired_token}"})

    assert invalid.status_code == 401
    assert invalid.get_json()["error"]["code"] == "invalid_token"
    assert expired.status_code == 401
    assert expired.get_json()["error"]["code"] == "token_expired"


def test_verified_token_with_invalid_identity_is_rejected(app, client):
    with app.app_context():
        token = create_access_token(identity="not-a-user-id")

    response = client.get(
        "/api/events?mine=true",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 401
    assert response.get_json()["error"]["code"] == "invalid_token"


def test_seed_command_is_repeatable_and_resettable(app):
    runner = app.test_cli_runner()

    first = runner.invoke(args=["seed"])
    second = runner.invoke(args=["seed"])
    reset = runner.invoke(args=["seed", "--reset"])

    assert first.exit_code == 0
    assert "Seeded 2 users" in first.output
    assert "Seed skipped" in second.output
    assert reset.exit_code == 0
    assert "Demo password for both accounts" in reset.output
