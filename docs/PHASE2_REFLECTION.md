# Hackaform Phase 2 — Written Reflection

## Problem and impact

I built Hackaform to reduce the effort involved in organizing and attending community events. Event information is often spread across social posts, group chats, registration tools, and personal notes. In Phase 1, I proved that a clear React interface could make discovery easier. In Phase 2, I made the product useful after discovery: an attendee can now reserve a place and manage it from one schedule, while an organizer can publish an event, build its agenda, track capacity, and review attendance.

The strongest evidence is the complete two-sided workflow. An organizer can create a published event and related agenda item; a different user can book it; the organizer immediately sees the confirmed place in the dashboard and attendee roster. That removes several manual handoffs from the process.

## From Phase 1 to Phase 2

I extended the existing application rather than rebuilding it. I kept the React routes, event cards, search and filter utilities, saved-event context, responsive design system, accessibility patterns, and fallback event artwork. I replaced the external event providers with a shared client for my own `/api` endpoints and added authentication, protected routes, controlled organizer forms, agenda management, bookings, and a personal schedule.

This change taught me that a full-stack feature is a contract, not just a screen. The React app needs stable field names and useful request states, while Flask must validate the same rules and return predictable success and error shapes. A normalization function protects the established UI from transport details, and every API failure follows one `error.code/message/fields` structure.

## Data and architecture decisions

The relational design mirrors the real workflow. A `User` owns many `Events`; an `Event` contains ordered `AgendaItems`; and `Booking` connects a user to an event while storing quantity, status, and notes. I used AgendaItem as a separate resource instead of storing an agenda array inside Event because each session needs its own validation, order, editing lifecycle, and database identity. I used Booking as a join model instead of a plain many-to-many table because the relationship contains meaningful user data.

I chose a Flask application factory with small blueprints, SQLAlchemy models, Alembic migrations, and PostgreSQL configuration. This keeps concerns separated and makes the API easier to test. React talks to it through one request helper that attaches JWTs, parses the response envelope, and turns network or validation failures into useful UI errors.

## Hardest challenges and debugging

The hardest part was preserving the polished Phase 1 interface while changing its data source and responsibilities. The old catalogue accepted several public-provider schemas, but the new API uses one owned model with fields such as `ownerId`, `bookedSpots`, and `agendaItems`. I isolated that boundary in `eventsApi.js`, then verified it with service tests instead of rewriting every card and filter.

A useful final QA example came from the organizer dashboard. Automated tests passed, but a real browser screenshot showed that the labels on the overlapping statistics card were hidden behind the hero section. I inspected their computed positions and fixed the stacking context with a deliberate `z-index`. That reinforced why visual testing still matters after unit and API tests pass. I also hardened expired-token behavior so public catalogue requests do not fail simply because an old token exists in local storage.

## Security and data integrity

Authentication uses signed bearer JWTs and passwords are stored as hashes. Flask performs ownership checks for every protected mutation: only an event owner can modify that event or its agenda, and only a booking owner can read, change, or delete that booking. This is enforced on the server even if someone bypasses the React interface.

Database and service rules provide another layer. Email and user/event booking pairs are unique, booking quantities are bounded, event and agenda dates must be valid, and event capacity cannot be reduced below confirmed attendance. Booking operations lock the relevant event row in PostgreSQL before checking remaining capacity. Tests also cover malformed tokens, cross-user access, duplicate bookings, full events, and attempts to reopen bookings after an event closes.

## Testing and quality

The final project has 37 passing React tests across 13 files and 33 passing Flask tests with 93% statement coverage. The frontend suite covers routing, components, auth, API normalization, timezone-aware event forms, booking flows, agenda CRUD, and roster states. The backend suite covers authentication, all resource operations, validation, relationships, ownership, capacity, errors, and health behavior. Oxlint, Ruff, the Vite production build, Alembic upgrade, schema-drift check, seed, and downgrade all pass.

The most valuable edge-case test is the cross-user ownership check. Without it, a user who guessed an ID could change another organizer's event or another attendee's booking even if the UI hid those controls. The test proves that authorization belongs in the API.

## Scope, lessons, and next iteration

I deliberately deferred payments, messaging, email reminders, waitlists, image uploads, and AI recommendations. Those features are attractive, but they would have distracted from the reliability of the core event–agenda–booking workflow. Keeping a clear MVP boundary gave me time to refine loading, empty, validation, confirmation, and failure states and to document a repeatable setup.

With one more week, I would add a waitlist and reminder system. A waitlist would create immediate value when an event reaches capacity and would extend the existing booking model with a queued status and position. Reminders would add user notification preferences and a scheduled delivery job. I would also move production authentication toward short-lived access tokens with secure refresh-token cookies and token revocation.

The main lesson from this phase is that adding a backend is not simply “making the data persistent.” The real value comes from owning the rules: relationships, validation, capacity, authorization, and predictable failure behavior. Hackaform now has that foundation.
