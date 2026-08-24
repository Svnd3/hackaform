# Hackaform Phase 2 — Full-Stack Project Pitch

**Product:** Hackaform  
**Phase 2 goal:** Extend the existing React event-discovery prototype into a secure, database-backed event planning and booking platform using Flask, SQLAlchemy, PostgreSQL, and JWT authentication.

## Step 1: Business Problem Scenario

### The problem

Students, early-career professionals, and community members often find useful Kenyan workshops, meetups, and hackathons through scattered websites, social posts, and group chats. Phase 1 made those opportunities easier to discover, but it still depended on third-party feeds. Users could save a link, but they could not reserve a place, update a reservation, or keep a dependable personal event plan. Organizers also lacked one workflow for publishing an event, arranging its programme, monitoring capacity, and seeing who planned to attend.

This fragmentation creates a productivity problem on both sides. Attendees repeat searches, lose event details, and struggle to coordinate their learning calendar. Organizers duplicate information across channels and manually track schedules and attendance. Hackaform Phase 2 reduces that administrative work by turning the Phase 1 discovery interface into one owned, reliable system.

### Target users and value

- **Attendees** — students, developers, creatives, and curious people who want to discover opportunities, reserve places, and manage a personal event plan.
- **Organizers** — community leads and event hosts who need to publish events, structure agendas, control capacity, and review reservations.

Hackaform adds value by keeping discovery, planning, and booking in one clear workflow. Unlike Phase 1, the React client will fetch its core data from Hackaform's own REST API. PostgreSQL will provide persistent records, while server-side validation will protect capacity and data quality. JWT authentication and ownership checks will ensure that only an event's organizer can change that event or agenda, and only the attendee who made a booking can change it.

### Primary goals

1. Replace the Phase 1 public event feeds with a custom Flask REST API and PostgreSQL database.
2. Support complete CRUD for the related `Event`, `AgendaItem`, and `Booking` resources.
3. Give organizers a practical publishing and schedule-management workflow.
4. Give attendees a persistent booking list they can update or cancel.
5. Handle loading, empty, validation, authorization, capacity, and network-error states clearly.

### Core user stories

- As a visitor, I can search and filter published events so I can quickly find a relevant opportunity.
- As a user, I can register or sign in so my activity persists securely.
- As an organizer, I can create, review, edit, publish, cancel, and delete my own events.
- As an organizer, I can add, reorder, edit, and remove agenda items within my event schedule.
- As an attendee, I can reserve one or more places, add a note, change the quantity or status, and delete my booking.
- As an organizer, I can view my event's attendee list without accessing another organizer's data.
- As a user, I receive useful feedback when input is invalid, an event is full, or a request fails.

## Step 2: Problem-Solving Process

### Product and data design

The existing React routes, visual system, search experience, and reusable event components will be retained and extended rather than rebuilt. Phase 1's saved-event concept becomes a real booking workflow backed by the database. The backend has four connected models, documented in [ERD.md](./ERD.md):

- **User** owns events and makes bookings.
- **Event** stores the organizer's listing, dates, venue, format, status, and capacity.
- **AgendaItem** belongs to one event and stores an ordered programme entry.
- **Booking** joins a user to an event and stores quantity, status, and notes.

`Event` and `AgendaItem` are the primary related resources for organizer CRUD; `Booking` supplies a second complete, user-facing CRUD flow. Foreign keys and cascade rules preserve relational integrity. A unique `(user_id, event_id)` constraint prevents duplicate bookings, and capacity is checked by the API before a reservation is confirmed.

### Technical approach

- **Frontend:** React, React Router, controlled forms, Context/state, a shared API client, and accessible loading/error/empty feedback.
- **Backend:** Flask application factory, modular blueprints, Flask-SQLAlchemy, Flask-Migrate, PostgreSQL, Flask-JWT-Extended, and Flask-CORS.
- **Security:** hashed passwords; bearer JWTs; event-owner and booking-owner checks on protected mutations; strict JSON field validation.
- **Quality:** model and route tests, authorization and edge-case tests, linting, production builds, seed data, environment-based configuration, and documented setup.

The agreed REST contract uses `/api` endpoints and `Authorization: Bearer <access_token>` on protected requests:

| Area | Main endpoints | Behaviour |
|---|---|---|
| Authentication | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` | Create an account, receive a JWT, and restore the current user |
| Events | `GET/POST /api/events`, `GET/PATCH/DELETE /api/events/:id` | Public catalogue plus owner-controlled event CRUD |
| Agendas | `GET/POST /api/events/:id/agenda-items`, `GET/PATCH/DELETE /api/agenda-items/:id` | Nested schedule CRUD restricted to the event owner |
| Bookings | `GET/POST /api/bookings`, `GET/PATCH/DELETE /api/bookings/:id` | Attendee-owned reservation CRUD |
| Organizer view | `GET /api/events/:id/bookings` | Event owner can review the attendee roster |

Responses use a consistent `data` envelope; paginated event lists also include `meta`. Errors use an `error` object containing a stable code, readable message, and field-level details. Public event queries support search, category, city, format, page, and `perPage`; authenticated organizers can request their own draft or cancelled listings with `mine=true`.

### Build and refinement workflow

I will work vertically: implement a model and endpoint, test it, connect the React flow, and then refine the interface. The app will be checked against the rubric after each slice—functionality and ownership first, then component reuse, error handling, documentation, responsive polish, and demo readiness. Seeded organizer and attendee accounts will make every core flow repeatable during marking.

## Step 3: Timeline and Scope

| Timebox | Deliverable | Review point |
|---|---|---|
| **Day 1 — Plan** | Finalize user stories, ERD, routes, validation rules, and environment setup | Confirm scope supports related resources and demonstrable CRUD |
| **Day 2 — Foundation** | Create Flask app, SQLAlchemy models, migrations, PostgreSQL configuration, seeds, and health/auth routes | Verify database persistence and JWT login |
| **Day 3 — Organizer flow** | Build Event and AgendaItem CRUD with ownership rules and tests | Create, edit, and delete an event and agenda item end to end |
| **Day 4 — Attendee flow** | Build Booking CRUD, capacity rules, duplicate protection, and tests | Book, update, cancel, and remove a reservation |
| **Day 5 — React integration** | Replace public-feed calls, add authentication, organizer forms, booking views, and request-state feedback | Confirm frontend communicates only with the owned API for core data |
| **Day 6 — Refine** | Responsive/accessibility pass, error-state testing, linting, production build, README and API documentation | Run the complete automated and manual checklist |
| **Day 7 — Present** | Seed demo data, rehearse the under-10-minute walkthrough, record, and write the reflection | Confirm the repo is public, reproducible, and presentation-ready |

### MVP boundary and risks

The Phase 2 MVP includes authentication, event management, agenda management, booking management, search/filtering, capacity enforcement, ownership authorization, PostgreSQL persistence, tests, and documentation. Payments, email reminders, waitlists, social messaging, recommendation AI, and third-party calendar sync are intentionally deferred so the core full-stack workflow remains polished and achievable.

The main risks are database setup differences, schedule/time-zone errors, and conflicting bookings. Environment templates and migrations reduce setup risk; all client dates use ISO 8601 offsets and the API stores UTC; validation, database constraints, and server-side capacity checks protect booking integrity. High-volume transactional locking is a later production enhancement, not part of this classroom MVP.

### Definition of done

The project is complete when a fresh setup can migrate and seed PostgreSQL; a visitor can browse events; authenticated organizers can perform CRUD on their own events and agendas; authenticated attendees can perform CRUD on their own bookings; unauthorized actions are rejected; errors are understandable; automated tests and the frontend production build pass; and the README documents setup, architecture, endpoints, credentials, limitations, and the Phase 1-to-Phase 2 evolution.
