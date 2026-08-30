from app.extensions import db
from app.models import User


def test_event_creation_requires_authentication(client, event_payload):
    response = client.post("/api/events", json=event_payload)

    assert response.status_code == 401


def test_create_list_and_get_event(client, organizer, create_event):
    event = create_event()

    listing = client.get("/api/events")
    detail = client.get(f"/api/events/{event['id']}")

    assert listing.status_code == 200
    assert listing.get_json()["meta"]["total"] == 1
    assert listing.get_json()["data"][0]["organizer"] == "Amina Njeri"
    assert detail.get_json()["data"]["agendaItems"] == []
    assert detail.get_json()["data"]["availableSpots"] == 3


def test_event_search_filters_and_pagination(client, create_event):
    create_event(title="Nairobi Build Weekend", category="Hackathon", city="Nairobi")
    create_event(title="Mombasa Design Meetup", category="Design", city="Mombasa")

    searched = client.get("/api/events?search=design&city=Mombasa&perPage=1")

    assert searched.status_code == 200
    assert searched.get_json()["meta"] == {"page": 1, "pages": 1, "perPage": 1, "total": 1}
    assert searched.get_json()["data"][0]["title"] == "Mombasa Design Meetup"


def test_event_date_and_timezone_validation(client, organizer, event_payload):
    invalid_dates = {
        **event_payload,
        "endAt": event_payload["startAt"],
    }
    dates_response = client.post("/api/events", json=invalid_dates, headers=organizer["headers"])
    timezone_response = client.post(
        "/api/events",
        json={**event_payload, "timezone": "Mars/Olympus"},
        headers=organizer["headers"],
    )

    assert dates_response.status_code == 400
    assert "endAt" in dates_response.get_json()["error"]["fields"]
    assert timezone_response.status_code == 400
    assert "timezone" in timezone_response.get_json()["error"]["fields"]


def test_owner_can_update_event(client, organizer, create_event):
    event = create_event()
    response = client.patch(
        f"/api/events/{event['id']}",
        json={"title": "Updated Nairobi Build Weekend", "capacity": 20},
        headers=organizer["headers"],
    )

    assert response.status_code == 200
    assert response.get_json()["data"]["title"] == "Updated Nairobi Build Weekend"
    assert response.get_json()["data"]["capacity"] == 20


def test_non_owner_cannot_change_event(client, attendee, create_event):
    event = create_event()
    update = client.patch(
        f"/api/events/{event['id']}",
        json={"title": "Stolen event title"},
        headers=attendee["headers"],
    )
    delete = client.delete(f"/api/events/{event['id']}", headers=attendee["headers"])

    assert update.status_code == 403
    assert delete.status_code == 403
    assert update.get_json()["error"]["code"] == "forbidden"


def test_drafts_are_private_but_visible_in_owner_dashboard(client, organizer, create_event):
    event = create_event(status="draft")

    public_list = client.get("/api/events")
    public_detail = client.get(f"/api/events/{event['id']}")
    mine = client.get("/api/events?mine=true", headers=organizer["headers"])

    assert public_list.get_json()["meta"]["total"] == 0
    assert public_detail.status_code == 404
    assert mine.get_json()["data"][0]["status"] == "draft"


def test_mine_rejects_token_for_deleted_account(client, app, organizer):
    with app.app_context():
        user = db.session.get(User, organizer["user"]["id"])
        db.session.delete(user)
        db.session.commit()

    response = client.get("/api/events?mine=true", headers=organizer["headers"])

    assert response.status_code == 401
    assert response.get_json()["error"]["code"] == "invalid_token"


def test_owner_can_delete_event(client, organizer, create_event):
    event = create_event()

    deleted = client.delete(f"/api/events/{event['id']}", headers=organizer["headers"])
    missing = client.get(f"/api/events/{event['id']}")

    assert deleted.status_code == 204
    assert missing.status_code == 404
