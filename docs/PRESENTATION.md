# Tukio presentation outline

This outline is designed for a 5–10 minute showcase. Use one section per slide and demonstrate the live application after slide 4.

## Slide 1 — Tukio: find something worth showing up for

**On the slide**

- Event discovery for students, builders, and curious people
- React Phase 1 capstone
- Your name and repository URL

**Speaker notes (about 45 seconds)**

Tukio is a Swahili word for an event or occurrence. I built it because useful workshops, meetups, hackathons, and community events are spread across many websites. The product gives users one calm, engaging place to discover what is happening and decide what is worth their time.

## Slide 2 — The user problem

**On the slide**

- Opportunities are fragmented
- Important details are inconsistent
- People discover events too late
- Existing listings often feel cluttered

**Speaker notes (about 60 seconds)**

The primary user is a student or early-career professional who wants to learn, build a network, or join a community. They expect fast search, useful filters, clear date and location information, and an obvious next action. Tukio reduces the work between “I want to do something useful” and “I found an event I can attend.”

## Slide 3 — Product and design

**On the slide**

- Home, Explore, Details, Saved, and About views
- Search by topic and location
- Filter by category, date, and format
- Save locally; register on the official site
- Responsive and keyboard-friendly

**Speaker notes (about 75 seconds)**

I chose a warm editorial style instead of a traditional dashboard so the app feels like a curated culture guide. The large typography and colors give it personality, while repeated cards, labels, and spacing keep it easy to scan. Missing third-party images receive branded generated artwork, so inconsistent API data does not make the UI feel broken.

## Slide 4 — Live data and React architecture

**On the slide**

- Eventyay + WordPress Events + Codeforces
- No API key required
- One normalized event model
- Loading, success, empty, and error states
- Context + `localStorage` for saved events

**Speaker notes (about 90 seconds)**

There was no reliable browser-ready hackathon-only API, so I widened the product to useful public events and combined three CORS-enabled sources. The service layer fetches them in parallel, sanitizes descriptions, normalizes different fields, removes duplicates, and tolerates a single-source outage. Components only consume one consistent event shape. React Router handles the views and query-string filters, while context manages saved events and toast feedback.

## Slide 5 — Demonstration

**Demo flow (about 2–3 minutes)**

1. Open the home page and describe the live featured event.
2. Search for a topic or location.
3. Apply a category or online filter on Explore.
4. Open an event and point out date, venue, organizer, and external registration.
5. Save the event, visit Saved, then remove it.
6. Resize or show the mobile layout.
7. Briefly trigger an empty search to show edge-case handling.

## Slide 6 — Quality, lessons, and roadmap

**On the slide**

- Automated tests, linting, and production build
- API sanitization, timeout, cancellation, and fallbacks
- Phase 2: Flask + database + real bookings
- Phase 3: accounts + user-owned data + organizer tools

**Speaker notes (about 75 seconds)**

The biggest lesson was that API selection is a product and engineering decision, not just a coding detail. I had to verify freshness, documentation, browser access, and whether “booking” was genuinely possible. In Phase 2 I will move aggregation to Flask, add a database and organizer-submitted events, and replace local saving with reservation records. In Phase 3 users will authenticate, manage their own bookings, and organizers will manage listings.

## Suggested closing

Tukio already solves the discovery problem as a complete front-end product, but its structure leaves a clear path from public information to a genuine two-sided event and booking platform.
