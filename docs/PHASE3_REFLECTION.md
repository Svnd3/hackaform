# Hackaform Phase 3 — Written Reflection

## Problem, value, and final outcome

Hackaform addresses the coordination work surrounding community events. Students and early-career professionals often find opportunities through scattered sites and chats, then track registrations in messages or memory. Organizers repeat event information and manage programmes, capacity, and attendance in separate tools. The final product brings those tasks together: visitors can discover published events; authenticated attendees can manage their own bookings in one schedule; and organizers can manage their own events, agendas, and attendee lists.

The strongest evidence is a complete deployed workflow. A new user can register, book an event, read the booking in My schedule, update it, and delete it. Each action travels from React on Vercel to Flask on Render and persists in PostgreSQL. The Network panel exposes the REST methods and status codes, while the interface gives the user loading, success, empty, validation, and failure feedback.

## Extending the existing codebase

I did not start a new project for Phase 3. The Phase 1 visual system, routes, event cards, filters, saved-event context, and accessibility patterns remain. Phase 2 replaced public feeds with an owned API and relational database. Authentication had already been introduced as part of that full-stack work, so Phase 3 focused on auditing and hardening it: verifying token errors, protecting private React routes, resolving token identities to current users, adding cross-user ownership coverage, documenting the permission model, and testing the deployed boundary.

That approach taught me that “auth exists” and “authorization is dependable” are different claims. A login screen proves identity only. The important part is checking ownership inside every sensitive API handler, regardless of which controls the UI shows.

## Architecture and security decisions

The data model follows the product workflow. `User` owns `Event` and `Booking`; `Event` owns ordered `AgendaItem` records and receives bookings. Booking is an explicit join model because the relationship contains quantity, status, notes, and business rules. Agenda items are records rather than an embedded array because each session has its own ordering, validation, and editing lifecycle.

I chose JWT bearer authentication because React and Flask are separately deployed and the API can verify each request without server-side session storage. Registration normalizes the email and stores only a password hash. The shared client attaches the access token to protected calls, `/api/auth/me` restores the user after refresh, and sign-out removes the local token. Flask then checks event ownership for event/agenda mutations and attendee-roster reads, and booking ownership for private booking reads and mutations. Database constraints, server-side validation, and transactional capacity checks add integrity beyond authentication.

For this classroom MVP the 12-hour JWT is stored in local storage. I documented that trade-off instead of describing it as perfect production security. A higher-risk public version should add short-lived access tokens, secure `HttpOnly` refresh cookies, token rotation and revocation, email verification, and login rate limiting.

## Challenges and debugging

The first major challenge was changing the source of truth without losing the polished Phase 1 interface. The old client normalized several external event schemas; the new Flask contract adds ownership, capacity, agendas, and bookings. Keeping the translation boundary in `src/services/eventsApi.js` let established cards and filters consume one stable event shape instead of spreading transport rules through components.

Authorization was the more important Phase 3 challenge. A hidden Edit button does not stop someone from calling an endpoint directly. I treated ownership as a backend rule and tested it with two users, including forbidden booking, event, agenda, and roster actions. I also verified missing, malformed, expired, and unknown-user tokens so an outdated browser token cannot become an accidental access path.

Deployment added another real-world boundary. The browser uses same-origin `/api` requests on Vercel, which proxies to Flask on Render; Flask connects to PostgreSQL with environment-provided credentials. This avoids shipping database secrets to the client and reduces browser CORS friction. The trade-off is that a free Render service may need time to wake before a demo, so the health check and pre-demo warm-up are part of the runbook.

## Testing, scope, and learning

The automated client suite covers routing, auth state, controlled forms, service normalization, booking and agenda interactions, and request states. The backend suite covers authentication, models, CRUD, ownership, capacity, validation, error envelopes, and health behaviour. Oxlint, Ruff, a Vite production build, database migrations, repeatable seed data, and GitHub Actions make the handoff reproducible. The most valuable tests are cross-user failures: they protect users even when someone bypasses React and guesses a numeric record ID.

I intentionally kept payments, chat, email reminders, waitlists, uploads, calendar sync, and AI recommendations outside the final MVP. That boundary left time for authentication, ownership, error states, responsiveness, documentation, and deployment—the criteria that make the existing workflow trustworthy. If I continued, I would first improve the token lifecycle and add email verification, then build a waitlist and reminders on top of the existing Booking relationship.

The central lesson is that production readiness is not one feature. It is the combination of a clear access model, defensive server rules, database integrity, predictable errors, automated evidence, usable feedback, secrets kept out of the client, and a deployed system that can be demonstrated end to end.
