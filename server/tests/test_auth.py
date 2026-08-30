def test_api_index_and_health_are_public(client):
    index = client.get("/api")
    health = client.get("/api/health")

    assert index.status_code == 200
    assert index.get_json()["data"]["version"] == "3.0.0"
    assert health.get_json()["data"] == {"service": "hackaform-api", "status": "ok"}


def test_register_returns_token_and_current_user(client, register):
    response = register(email="  AMINA@example.com  ")

    assert response.status_code == 201
    body = response.get_json()["data"]
    assert body["user"]["email"] == "amina@example.com"
    me = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {body['accessToken']}"},
    )
    assert me.status_code == 200
    assert me.get_json()["data"]["name"] == "Amina Njeri"


def test_register_rejects_duplicate_email(register):
    assert register().status_code == 201
    response = register(name="Another Person")

    assert response.status_code == 409
    assert response.get_json()["error"]["code"] == "email_taken"


def test_register_validates_password_and_unknown_fields(client):
    weak = client.post(
        "/api/auth/register",
        json={"name": "Amina", "email": "amina@example.com", "password": "short"},
    )
    unknown = client.post(
        "/api/auth/register",
        json={
            "name": "Amina",
            "email": "amina@example.com",
            "password": "StrongPass123",
            "is_admin": True,
        },
    )
    oversized = client.post(
        "/api/auth/register",
        json={"name": "Amina", "email": "amina@example.com", "password": "x" * 129},
    )

    assert weak.status_code == 400
    assert "password" in weak.get_json()["error"]["fields"]
    assert oversized.status_code == 400
    assert "password" in oversized.get_json()["error"]["fields"]
    assert unknown.status_code == 400
    assert unknown.get_json()["error"]["fields"]["unknownFields"] == ["is_admin"]


def test_login_accepts_valid_credentials_and_rejects_invalid(client, register):
    register(password="StrongPass123")

    valid = client.post(
        "/api/auth/login",
        json={"email": "amina@example.com", "password": "StrongPass123"},
    )
    invalid = client.post(
        "/api/auth/login",
        json={"email": "amina@example.com", "password": "WrongPassword"},
    )

    assert valid.status_code == 200
    assert valid.get_json()["data"]["accessToken"]
    assert invalid.status_code == 401
    assert invalid.get_json()["error"]["code"] == "invalid_credentials"


def test_protected_route_returns_consistent_unauthorized_error(client):
    response = client.get("/api/auth/me")

    assert response.status_code == 401
    assert response.get_json()["error"] == {
        "code": "authentication_required",
        "message": "Authentication is required.",
    }
