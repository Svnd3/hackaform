# Hackaform Phase 2 — Showcase Guide

**Target length:** 8–9 minutes (maximum 10 minutes)  
**Format:** Short slides for context, followed by a focused live demo and closing reflection.

## Before recording

- Run the Flask API and React client, then confirm the health endpoint and database connection.
- Seed the provided organizer, attendee, published event, agenda, and booking; create a disposable draft during the demo.
- Keep organizer and attendee sessions open in separate browser profiles.
- Use a disposable event called **Demo Design Sprint** so create, update, and delete actions are safe to show.
- Increase browser zoom slightly, close unrelated tabs, silence notifications, and keep the terminal font readable.
- Rehearse once with a timer. Explain decisions while the UI loads; do not narrate every click.

## Walkthrough outline

### 0:00–0:40 — Hook and product evolution

**Show:** Title slide, then the Hackaform home page.

**Say:** “Hackaform helps students, builders, and community members turn scattered event information into an organized plan. Phase 1 proved the discovery experience with public feeds. Phase 2 keeps that React foundation but replaces the feeds with my Flask REST API and PostgreSQL database, adding real organizer workflows, agendas, and bookings.”

### 0:40–1:20 — Users, problem, and MVP

**Show:** Problem-and-solution slide.

Cover three points:

- attendees need one dependable place to discover and manage opportunities;
- organizers need less manual work when publishing schedules and tracking capacity;
- the MVP joins discovery, event planning, and reservation management without adding payments or messaging.

### 1:20–2:05 — Architecture and relationships

**Show:** The ERD and a compact architecture diagram: `React → Flask REST API → SQLAlchemy → PostgreSQL`.

Explain that `User` owns `Event`; `Event` contains `AgendaItem`; `Booking` relates an attendee to an event. Mention JWT bearer authentication, hashed passwords, ownership checks, validation, and the consistent `data` / `error` response envelopes.

### 2:05–3:05 — Public discovery and request states

**Show:** Browse the catalogue as a signed-out visitor.

1. Search for a topic or city and apply one format filter.
2. Open an event and point out its organizer, schedule, remaining capacity, and agenda.
3. Briefly show an empty result or explain the visible loading/error feedback.

**Evidence:** The React frontend is fetching Hackaform's `/api/events` endpoint, not the Phase 1 public feeds.

### 3:05–4:45 — Organizer CRUD: Event

**Show:** Sign in as the seeded organizer and open the organizer workspace.

1. **Create** Demo Design Sprint with dates, venue, capacity, and draft status.
2. **Read** it in the organizer's `mine=true` listing.
3. **Update** the title or capacity and publish it.
4. Save deletion for the end so the event remains available for related-resource demos.

Point out controlled form validation and explain that another user cannot mutate this event because the server checks `owner_id`, not just the interface.

### 4:45–5:45 — Organizer CRUD: AgendaItem

**Show:** Manage the programme inside Demo Design Sprint.

1. **Create** a session with title, speaker, position, start, and end time.
2. **Read** it in the ordered event agenda.
3. **Update** its speaker or position.
4. **Delete** the session and show the refreshed agenda.

Mention that agenda times must fit inside the parent event. This demonstrates full CRUD on a second related resource.

### 5:45–7:05 — Attendee CRUD: Booking

**Show:** Switch to the attendee session.

1. Open the published demo event and **create** a booking.
2. **Read** it in “My bookings.”
3. **Update** its quantity or note.
4. **Delete** the disposable booking with the cancellation action.

Explain duplicate protection, quantity limits, server-side capacity checks, and booking ownership. If time permits, switch back to the organizer for one glance at the attendee roster.

### 7:05–7:45 — Authorization and API evidence

**Show:** Browser network tools, API client, or one focused automated test.

- Identify a request carrying `Authorization: Bearer <token>`.
- Show a successful JSON `data` envelope.
- Show one denied cross-user update or a validation error with its code, message, and field details.

Avoid exposing the JWT secret, database password, or full production token on screen.

### 7:45–8:25 — Quality and maintainability

**Show:** Test result, project structure, and README—not a long code tour.

Highlight modular Flask blueprints, SQLAlchemy models, reusable React components, migrations, seed data, environment configuration, route and ownership tests, linting, and the production frontend build. Then delete Demo Design Sprint to complete Event CRUD and show the success state.

### 8:25–9:00 — Reflection and close

**Say:** “The important change is not simply adding a server. Hackaform now owns its data and enforces the rules that make an event platform trustworthy: persistence, relationships, capacity, and ownership. The MVP is intentionally focused, but it leaves a clear path to reminders, waitlists, calendars, payments, and richer organizer tools.”

End on the repository URL or final product screen.

## Written reflection prompts

Use the prompts below to write a concise reflection in your own voice. Include one concrete example in every answer.

1. **Problem and impact:** Which repeated task does Hackaform make easier for attendees or organizers, and what evidence from the final flow supports that claim?
2. **Phase 1 to Phase 2:** Which React concepts or components were retained, and what changed when the public feeds were replaced by the owned API?
3. **Key technical decision:** Why did you choose the `User → Event → AgendaItem` and `User ↔ Event through Booking` model? What alternative did you reject?
4. **Hardest challenge:** Describe one real bug or integration problem, how you isolated it, and the exact fix—not only the final result.
5. **Security and integrity:** How do JWT authentication, ownership checks, database constraints, and capacity validation work together?
6. **Testing:** Which edge case was most valuable to test, and what failure would that test prevent for a real user?
7. **Scope:** Which feature did you intentionally defer, and how did that decision help you deliver a more reliable MVP?
8. **Next iteration:** If you had one more week, which improvement would create the most user value, and how would it affect the data model or API?

## Final submission evidence

- Public GitHub repository with frontend and backend code
- Complete README with setup, environment variables, seed credentials, architecture, endpoints, and known limitations
- ERD and Phase 2 pitch
- PostgreSQL-backed Flask API and React integration
- Full CRUD demonstrated on at least two related resources
- Authentication and record-ownership enforcement
- Passing tests, lint checks, and production build
- Video under 10 minutes plus concise written reflection and visual aid
