from datetime import UTC, datetime


def agenda_payload(**overrides):
    return {
        "title": "Opening and challenge briefing",
        "description": "Meet the mentors and understand the challenge tracks.",
        "speaker": "Amina Njeri",
        "startsAt": datetime(2030, 3, 13, 7, 0, tzinfo=UTC).isoformat(),
        "endsAt": datetime(2030, 3, 13, 8, 0, tzinfo=UTC).isoformat(),
        "position": 1,
        **overrides,
    }


def test_owner_can_create_list_and_read_agenda_item(client, organizer, create_event):
    event = create_event()
    created = client.post(
        f"/api/events/{event['id']}/agenda-items",
        json=agenda_payload(),
        headers=organizer["headers"],
    )

    assert created.status_code == 201
    item_id = created.get_json()["data"]["id"]
    listing = client.get(f"/api/events/{event['id']}/agenda-items")
    detail = client.get(f"/api/agenda-items/{item_id}")
    assert listing.get_json()["data"][0]["title"].startswith("Opening")
    assert detail.get_json()["data"]["speaker"] == "Amina Njeri"


def test_owner_can_update_and_delete_agenda_item(client, organizer, create_event):
    event = create_event()
    created = client.post(
        f"/api/events/{event['id']}/agenda-items",
        json=agenda_payload(),
        headers=organizer["headers"],
    )
    item_id = created.get_json()["data"]["id"]

    updated = client.patch(
        f"/api/agenda-items/{item_id}",
        json={"title": "Doors open and team check-in", "position": 0},
        headers=organizer["headers"],
    )
    deleted = client.delete(f"/api/agenda-items/{item_id}", headers=organizer["headers"])

    assert updated.status_code == 200
    assert updated.get_json()["data"]["position"] == 0
    assert deleted.status_code == 204
    assert client.get(f"/api/agenda-items/{item_id}").status_code == 404


def test_non_owner_cannot_manage_agenda(client, organizer, attendee, create_event):
    event = create_event()
    create = client.post(
        f"/api/events/{event['id']}/agenda-items",
        json=agenda_payload(),
        headers=attendee["headers"],
    )
    owner_create = client.post(
        f"/api/events/{event['id']}/agenda-items",
        json=agenda_payload(),
        headers=organizer["headers"],
    )
    item_id = owner_create.get_json()["data"]["id"]
    update = client.patch(
        f"/api/agenda-items/{item_id}",
        json={"title": "Unauthorized update"},
        headers=attendee["headers"],
    )

    assert create.status_code == 403
    assert update.status_code == 403


def test_agenda_item_must_fit_inside_event(client, organizer, create_event):
    event = create_event()
    response = client.post(
        f"/api/events/{event['id']}/agenda-items",
        json=agenda_payload(
            startsAt=datetime(2030, 3, 12, 7, 0, tzinfo=UTC).isoformat(),
            endsAt=datetime(2030, 3, 12, 8, 0, tzinfo=UTC).isoformat(),
        ),
        headers=organizer["headers"],
    )

    assert response.status_code == 400
    assert response.get_json()["error"]["code"] == "validation_error"
