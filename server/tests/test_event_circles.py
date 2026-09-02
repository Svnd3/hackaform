def create_circle(client, organizer, event_id, **overrides):
    payload = {
        "inviteUrl": "https://chat.whatsapp.com/AbCdEfGhIjKlMnOpQrStUv",
        "welcomeMessage": "Introduce yourself and share what you hope to build.",
        **overrides,
    }
    return client.post(
        f"/api/events/{event_id}/circle",
        json=payload,
        headers=organizer["headers"],
    )


def test_owner_can_create_read_update_and_delete_circle(client, organizer, create_event):
    event = create_event()
    created = create_circle(client, organizer, event["id"])

    assert created.status_code == 201
    assert created.get_json()["data"]["platform"] == "whatsapp"
    assert created.get_json()["data"]["eventId"] == event["id"]

    public_event = client.get(f"/api/events/{event['id']}").get_json()["data"]
    assert public_event["hasCircle"] is True
    assert "inviteUrl" not in public_event

    read = client.get(
        f"/api/events/{event['id']}/circle",
        headers=organizer["headers"],
    )
    updated = client.patch(
        f"/api/events/{event['id']}/circle",
        json={"welcomeMessage": "Say hello before event day."},
        headers=organizer["headers"],
    )
    deleted = client.delete(
        f"/api/events/{event['id']}/circle",
        headers=organizer["headers"],
    )

    assert read.status_code == 200
    assert read.get_json()["data"]["inviteUrl"].startswith("https://chat.whatsapp.com/")
    assert updated.status_code == 200
    assert updated.get_json()["data"]["welcomeMessage"] == "Say hello before event day."
    assert deleted.status_code == 204
    assert (
        client.get(
            f"/api/events/{event['id']}/circle",
            headers=organizer["headers"],
        ).status_code
        == 404
    )


def test_confirmed_attendee_can_read_but_cannot_manage_circle(
    client, organizer, attendee, create_event
):
    event = create_event()
    create_circle(client, organizer, event["id"])
    booked = client.post(
        "/api/bookings",
        json={"eventId": event["id"]},
        headers=attendee["headers"],
    )
    assert booked.status_code == 201

    read = client.get(
        f"/api/events/{event['id']}/circle",
        headers=attendee["headers"],
    )
    update = client.patch(
        f"/api/events/{event['id']}/circle",
        json={"welcomeMessage": "Changed"},
        headers=attendee["headers"],
    )
    delete = client.delete(
        f"/api/events/{event['id']}/circle",
        headers=attendee["headers"],
    )

    assert read.status_code == 200
    assert update.status_code == 403
    assert delete.status_code == 403
    assert update.get_json()["error"]["code"] == "forbidden"
    assert delete.get_json()["error"]["code"] == "forbidden"


def test_circle_is_private_from_strangers_and_cancelled_attendees(
    client, organizer, attendee, register, create_event
):
    event = create_event()
    create_circle(client, organizer, event["id"])

    stranger = register(name="Wanjiku Kariuki", email="wanjiku@example.com").get_json()["data"]
    stranger_headers = {"Authorization": f"Bearer {stranger['accessToken']}"}
    stranger_read = client.get(
        f"/api/events/{event['id']}/circle",
        headers=stranger_headers,
    )

    booking = client.post(
        "/api/bookings",
        json={"eventId": event["id"]},
        headers=attendee["headers"],
    ).get_json()["data"]
    client.patch(
        f"/api/bookings/{booking['id']}",
        json={"status": "cancelled"},
        headers=attendee["headers"],
    )
    cancelled_read = client.get(
        f"/api/events/{event['id']}/circle",
        headers=attendee["headers"],
    )

    assert stranger_read.status_code == 403
    assert cancelled_read.status_code == 403
    assert stranger_read.get_json()["error"]["code"] == "forbidden"
    assert cancelled_read.get_json()["error"]["code"] == "forbidden"


def test_circle_endpoints_return_structured_auth_and_not_found_errors(
    client, organizer, create_event
):
    event = create_event()
    unauthenticated = client.get(f"/api/events/{event['id']}/circle")
    no_circle = client.get(
        f"/api/events/{event['id']}/circle",
        headers=organizer["headers"],
    )
    missing_event = client.get("/api/events/999999/circle", headers=organizer["headers"])

    assert unauthenticated.status_code == 401
    assert unauthenticated.get_json()["error"]["code"] == "authentication_required"
    assert no_circle.status_code == 404
    assert no_circle.get_json()["error"]["code"] == "not_found"
    assert missing_event.status_code == 404
    assert missing_event.get_json()["error"]["code"] == "not_found"


def test_circle_rejects_unsafe_invite_links_and_duplicate_creation(
    client, organizer, create_event
):
    event = create_event()
    invalid_links = [
        "http://chat.whatsapp.com/InviteCode",
        "https://evil.example/chat.whatsapp.com/InviteCode",
        "https://chat.whatsapp.com.evil.example/InviteCode",
        "https://user@chat.whatsapp.com/InviteCode",
        "https://chat.whatsapp.com/",
    ]
    for invite_url in invalid_links:
        response = create_circle(
            client,
            organizer,
            event["id"],
            inviteUrl=invite_url,
        )
        assert response.status_code == 400
        assert "inviteUrl" in response.get_json()["error"]["fields"]

    first = create_circle(client, organizer, event["id"])
    duplicate = create_circle(client, organizer, event["id"])
    assert first.status_code == 201
    assert duplicate.status_code == 409
    assert duplicate.get_json()["error"]["code"] == "circle_exists"


def test_circle_patch_rejects_empty_or_unknown_updates(client, organizer, create_event):
    event = create_event()
    create_circle(client, organizer, event["id"])

    empty = client.patch(
        f"/api/events/{event['id']}/circle",
        json={},
        headers=organizer["headers"],
    )
    unknown = client.patch(
        f"/api/events/{event['id']}/circle",
        json={"platform": "telegram"},
        headers=organizer["headers"],
    )

    assert empty.status_code == 400
    assert empty.get_json()["error"]["fields"]["body"] == "Empty update."
    assert unknown.status_code == 400
    assert unknown.get_json()["error"]["fields"]["unknownFields"] == ["platform"]
