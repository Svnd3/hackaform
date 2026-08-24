from datetime import UTC, datetime, timedelta


def test_attendee_can_create_list_and_read_booking(client, attendee, create_event):
    event = create_event()
    created = client.post(
        "/api/bookings",
        json={"eventId": event["id"], "quantity": 2, "notes": "Window seat"},
        headers=attendee["headers"],
    )

    assert created.status_code == 201
    booking = created.get_json()["data"]
    listing = client.get("/api/bookings", headers=attendee["headers"])
    detail = client.get(f"/api/bookings/{booking['id']}", headers=attendee["headers"])
    assert listing.get_json()["data"][0]["event"]["title"] == event["title"]
    assert detail.get_json()["data"]["quantity"] == 2


def test_attendee_can_update_cancel_and_delete_booking(client, attendee, create_event):
    event = create_event()
    created = client.post(
        "/api/bookings",
        json={"eventId": event["id"]},
        headers=attendee["headers"],
    )
    booking_id = created.get_json()["data"]["id"]

    updated = client.patch(
        f"/api/bookings/{booking_id}",
        json={"status": "cancelled", "notes": "Plans changed"},
        headers=attendee["headers"],
    )
    deleted = client.delete(f"/api/bookings/{booking_id}", headers=attendee["headers"])

    assert updated.status_code == 200
    assert updated.get_json()["data"]["status"] == "cancelled"
    assert deleted.status_code == 204
    assert client.get(f"/api/bookings/{booking_id}", headers=attendee["headers"]).status_code == 404


def test_duplicate_booking_is_rejected(client, attendee, create_event):
    event = create_event()
    payload = {"eventId": event["id"]}
    first = client.post("/api/bookings", json=payload, headers=attendee["headers"])
    duplicate = client.post("/api/bookings", json=payload, headers=attendee["headers"])

    assert first.status_code == 201
    assert duplicate.status_code == 409
    assert duplicate.get_json()["error"]["code"] == "duplicate_booking"


def test_capacity_is_enforced_on_create_and_update(client, attendee, register, create_event):
    event = create_event(capacity=2)
    first = client.post(
        "/api/bookings",
        json={"eventId": event["id"], "quantity": 2},
        headers=attendee["headers"],
    )
    another_response = register(name="Wanjiku Kariuki", email="wanjiku@example.com")
    another_headers = {
        "Authorization": f"Bearer {another_response.get_json()['data']['accessToken']}"
    }
    full = client.post(
        "/api/bookings",
        json={"eventId": event["id"], "quantity": 1},
        headers=another_headers,
    )

    assert first.status_code == 201
    assert full.status_code == 409
    assert full.get_json()["error"]["code"] == "event_full"


def test_user_cannot_manage_someone_elses_booking(client, attendee, register, create_event):
    event = create_event()
    created = client.post(
        "/api/bookings",
        json={"eventId": event["id"]},
        headers=attendee["headers"],
    )
    booking_id = created.get_json()["data"]["id"]
    stranger = register(name="Wanjiku Kariuki", email="wanjiku@example.com").get_json()["data"]
    stranger_headers = {"Authorization": f"Bearer {stranger['accessToken']}"}

    response = client.patch(
        f"/api/bookings/{booking_id}",
        json={"status": "cancelled"},
        headers=stranger_headers,
    )

    assert response.status_code == 403
    assert response.get_json()["error"]["code"] == "forbidden"


def test_organizer_cannot_book_own_event(client, organizer, create_event):
    event = create_event()
    response = client.post(
        "/api/bookings",
        json={"eventId": event["id"]},
        headers=organizer["headers"],
    )

    assert response.status_code == 409
    assert response.get_json()["error"]["code"] == "owner_booking"


def test_past_event_rejects_new_booking(client, attendee, create_event):
    now = datetime.now(UTC)
    event = create_event(
        startAt=(now - timedelta(hours=2)).isoformat(),
        endAt=(now - timedelta(hours=1)).isoformat(),
    )

    response = client.post(
        "/api/bookings",
        json={"eventId": event["id"]},
        headers=attendee["headers"],
    )

    assert response.status_code == 409
    assert response.get_json()["error"]["code"] == "booking_closed"


def test_event_owner_can_view_attendee_roster(client, organizer, attendee, create_event):
    event = create_event()
    client.post(
        "/api/bookings",
        json={"eventId": event["id"]},
        headers=attendee["headers"],
    )

    roster = client.get(f"/api/events/{event['id']}/bookings", headers=organizer["headers"])
    forbidden = client.get(f"/api/events/{event['id']}/bookings", headers=attendee["headers"])

    assert roster.status_code == 200
    assert roster.get_json()["data"][0]["attendee"]["email"] == "brian@example.com"
    assert forbidden.status_code == 403


def test_reducing_event_capacity_below_bookings_is_rejected(
    client, organizer, attendee, create_event
):
    event = create_event(capacity=5)
    client.post(
        "/api/bookings",
        json={"eventId": event["id"], "quantity": 2},
        headers=attendee["headers"],
    )

    response = client.patch(
        f"/api/events/{event['id']}",
        json={"capacity": 1},
        headers=organizer["headers"],
    )

    assert response.status_code == 409
    assert response.get_json()["error"]["code"] == "capacity_conflict"


def test_cancelled_booking_cannot_be_reactivated_after_event_closes(
    client, organizer, attendee, create_event
):
    event = create_event()
    created = client.post(
        "/api/bookings",
        json={"eventId": event["id"]},
        headers=attendee["headers"],
    ).get_json()["data"]
    client.patch(
        f"/api/bookings/{created['id']}",
        json={"status": "cancelled"},
        headers=attendee["headers"],
    )
    client.patch(
        f"/api/events/{event['id']}",
        json={"status": "cancelled"},
        headers=organizer["headers"],
    )

    response = client.patch(
        f"/api/bookings/{created['id']}",
        json={"status": "confirmed"},
        headers=attendee["headers"],
    )

    assert response.status_code == 409
    assert response.get_json()["error"]["code"] == "booking_closed"
