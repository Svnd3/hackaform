# Hackaform Phase 3 — Final Presentation

This is the final combined Phase 3 pitch and product showcase announced by Beatrice Wambui on 1 September 2026.

## Required format

- **When:** Thursday, 3 September 2026, during the 8:00 a.m.–12:00 noon session.
- **Maximum:** six minutes total.
- **Slides:** three to four minutes, concise and visually consistent with Hackaform.
- **Demo:** a pre-recorded, voiced, 60–90 second walkthrough embedded in the deck.
- **Product:** the deployed application, not localhost. The lecturer may test it while the demo plays.
- **Access:** share the presentation through Google Slides with Anyone with the link (Viewer) or Moringa School viewers.
- **Marking link:** provide `https://github.com/Svnd3/hackaform`; the repository README links the deployed site.

## Eight-slide story

1. **Hackaform** — “Find the room. Meet the people.”
2. **The problem** — discovery is fragmented, planning is manual, and attendees often arrive as strangers.
3. **The solution** — one flow for discovery, booking, schedules, organizer operations, and a private pre-event circle.
4. **Minimum viable product** — Explore, Event detail, Authentication, My schedule, and Organizer Studio; highlight secure ownership.
5. **Demo** — play the 60–90 second recording from [PHASE3_DEMO.md](./PHASE3_DEMO.md).
6. **Technology and architecture** — React/Vercel → Flask/JWT/Render → PostgreSQL; tests and CI underneath.
7. **Three future plans** — waitlists and reminders; payments with QR check-in; smarter attendee matching.
8. **Thank you / questions** — live app and repository URLs.

## Main differentiator

Hackaform does more than publish an event directory. A confirmed booking becomes a trusted access gate for an event's attendee circle. This helps participants introduce themselves, form teams, and coordinate before they enter the room. The host creates the WhatsApp group and pastes its invite; Hackaform keeps the invite out of public JSON and releases it only to the owner or confirmed attendees.

Be precise: WhatsApp does not provide a supported public API for silently creating normal groups or setting their photos. Hackaform supplies a downloadable branded group cover, but the host applies it manually in WhatsApp.

## Evidence to mention

- Registration/login and JWT-backed session restoration.
- User-owned Booking CRUD: `POST 201`, `GET 200`, `PATCH 200`, `DELETE 204`.
- Event, AgendaItem, Booking, and EventCircle relationships in PostgreSQL.
- Server-side `403 Forbidden` for another user's record.
- Protected circle read for owner/confirmed attendee; cancelled or unbooked users receive `403`.
- Automated frontend/backend tests, linting, build, migration check, and GitHub Actions.

Earlier Phase 1 and Phase 2 files remain project-history evidence. Do not present those old decks on Thursday.
