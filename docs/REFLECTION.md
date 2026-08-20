# Hackaform — written reflection

## What I set out to solve

I wanted to help students, developers, and curious people in Kenya discover useful events without searching many unrelated websites and community channels. My first idea focused only on hackathons, but API research showed that the most popular hackathon platforms do not offer a dependable, documented API that a browser-only React application can safely use. I kept the original user need, made the product Kenya-first, and expanded the scope to technology, learning, and community events.

## What I built

Hackaform is a responsive React application with six routes: Home, Explore, Event Details, Saved Events, About, and a not-found page. It dynamically combines Kenyan developer events from the public feed used by the official GDG Community website with listings from Eventyay, the WordPress Events API, and Codeforces. Users can search and filter the catalogue, inspect a normalized detail view, save events in their browser, and continue to the organizer's official registration page.

## Important decisions

I separated API work from presentation components. The service layer owns requests, timeouts, cancellation, sanitization, normalization, deduplication, Kenya-only filtering for GDG results, and source-level failure handling. This means the interface does not need four versions of every card or filter. I also chose not to present local saving as a real booking. Honest labels are important: Phase 1 can remember interest, while genuine reservations belong in the database-backed second phase.

The visual direction was deliberately editorial and energetic. Event platforms often become dense tables or generic dashboards, but attending an event is an emotional choice as well as a practical one. Strong type, bright accents, custom fallbacks, and clear hierarchy make the catalogue inviting without hiding dates, locations, formats, and external actions.

## Challenges and learning

The largest challenge was finding broad, browser-safe Kenyan event data. The GDG website feed currently provides useful Kenyan technology events, but it is not a documented, versioned developer API, so I kept the integration isolated and failure tolerant. All four sources use different naming systems, date formats, levels of detail, and image availability. Building a stable internal event shape, filtering nearby-country results, removing duplicates, and designing good fallbacks produced a more reliable experience than passing raw responses directly into components.

I also learned to treat loading, error, empty, and partial-success states as core product states. A dynamic application is not complete if it only looks good when every network request succeeds. Automated tests now cover utilities, normalization and API errors, routing, and local saved-event behavior.

## What I would improve next

In Phase 2 I would place the aggregation logic behind a Flask API, cache upstream responses, and store organizer-created Kenyan events and genuine booking records in PostgreSQL. This would improve performance, expand locally relevant inventory beyond what public feeds expose, and make it possible to manage capacity. In Phase 3 I would add authentication, user-owned bookings, cancellation, profiles, and an organizer dashboard. I would also add end-to-end browser tests and production analytics that respect user privacy.

## Final assessment

Hackaform meets the Phase 1 goal as a complete client-side product: it uses real external data, React state and controlled inputs, routing, reusable components, meaningful styling, and graceful edge-case handling. More importantly, it establishes a practical foundation for the backend and account features required in the next two phases.
