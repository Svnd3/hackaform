# Hackaform — Kenya-first Event Discovery

[![CI](https://github.com/Svnd3/hackaform/actions/workflows/ci.yml/badge.svg)](https://github.com/Svnd3/hackaform/actions/workflows/ci.yml)

Hackaform is a polished React application that helps students, developers, and curious people discover worthwhile opportunities in Kenya without checking several disconnected websites. It combines live Kenyan tech events with selected regional, online, and global listings in one searchable catalogue, lets visitors save a shortlist in their browser, and sends them to the official organizer when they are ready to register.

This is Phase 1 of a three-phase capstone. It is intentionally structured to grow into a Flask-backed booking platform with accounts and organizer-managed events.

## The problem

Useful Kenyan hackathons, workshops, meetups, programming contests, and community events are scattered across many sites and community channels. The people most likely to benefit from them often discover them too late—or not at all. Hackaform gives them a clear, responsive place to search, compare, save, and follow through while keeping relevant online and international opportunities within reach.

## Features

- Live Kenyan GDG events plus regional, online, and global listings aggregated from four keyless public sources
- Keyword, location, category, date, and online/in-person filters
- Shareable filter state stored in the URL
- Responsive home, explore, event-details, saved, about, and 404 views
- Browser-based saved events using `localStorage`
- Official registration links with clear external-site behavior
- Loading skeletons, retryable error states, and useful empty states
- API normalization, HTML sanitization, duplicate removal, request cancellation, and timeouts
- Keyboard navigation, visible focus styles, semantic landmarks, reduced-motion support, and live result announcements
- Automated tests, linting, production build checks, and GitHub Actions CI

## Data sources

Hackaform uses public data sources that allow direct browser requests and do not require a secret key.

| Source | Endpoint used | What it contributes | Important limitation |
| --- | --- | --- | --- |
| [Google Developer Groups Community](https://gdg.community.dev/events/) | `GET https://gdg.community.dev/api/search/?result_types=upcoming_event&country_code=KE&latitude=-1.286389&longitude=36.817223&order_by_proximity=true&proximity=800`; `GET /api/event/:id/` | Current Kenyan developer meetups, workshops, and DevFests with organizer links and detailed event data | These public JSON endpoints power the official GDG website but are not a documented, versioned developer API and may change. Hackaform filters results to `chapter.country === "KE"` because nearby-country results can also be returned. |
| [Eventyay Open Event API](https://api.eventyay.com/#events-events-collection-get) | `GET https://api.eventyay.com/v1/events`, `GET /events/:id`, `GET /events/:id/tickets` | Public events, descriptions, media, venues, and ticket metadata | Organizer-submitted catalogue data can be sparse or repeated. |
| [WordPress.org Events API](https://github.com/WordPress/wordpress.org/blob/trunk/api.wordpress.org/public_html/events/1.0/index.php) | `GET https://api.wordpress.org/events/1.0/?location={city}&number=20` | Current community meetups and WordCamps around selected city hubs, including Nairobi | It is a WordPress-community feed rather than a general event directory. |
| [Codeforces API](https://codeforces.com/apiHelp/methods#contest.list) | `GET https://codeforces.com/api/contest.list?gym=false` | Upcoming online competitive-programming events | It does not provide event images, prices, or long descriptions. |

The data layer maps all four response formats into one stable event model and prioritizes Kenyan listings before the wider catalogue. If one source is temporarily unavailable, successful results from the other sources still render. No API key or `.env` file is required. Hackaform makes anonymous, read-only requests and is not affiliated with or endorsed by Google, GDG, Eventyay, WordPress.org, Codeforces, or the listed organizers; event content remains the property of its respective source.

## Tech stack

- React 19 and React Router
- Vite
- JavaScript / JSX
- Custom responsive CSS
- Lucide React icons
- Vitest, Testing Library, and jsdom
- Oxlint

## Run locally

Requirements: Node.js 22.12+ and npm.

```bash
git clone git@github.com:Svnd3/hackaform.git
cd hackaform
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Available commands

```bash
npm run dev        # start the development server
npm run test       # run the test suite once
npm run test:watch # run tests in watch mode
npm run lint       # run Oxlint
npm run build      # create a production build in dist/
npm run preview    # preview the production build
npm run check      # lint, test, then build
```

## Project structure

```text
src/
├── components/   reusable UI building blocks
├── context/      saved-event state and notifications
├── data/         display categories
├── hooks/        catalogue and saved-event hooks
├── layout/       shared application shell
├── pages/        route-level views
├── services/     API aggregation and normalization
├── test/         shared test setup
└── utils/        filtering, formatting, and sanitization
```

## Design decisions

Hackaform uses a warm editorial visual style instead of a generic dashboard. Bold type, playful color, generous spacing, and custom event artwork make sparse third-party data feel intentional while keeping the information hierarchy clear. The interface is mobile-first and every interactive control has a keyboard-visible focus state.

“Save” means saving an event to the current browser. “Register” always opens the organizer’s official page; Hackaform does not claim to take payments or create a reservation during Phase 1.

## Challenges and solutions

- **No dependable public Kenya-wide hackathon API:** prominent hackathon and local ticketing sites either lack a documented discovery API, require protected credentials, or block browser requests. Hackaform uses the live GDG feed for Kenyan tech opportunities and supplements it with browser-safe public sources.
- **Four incompatible response shapes:** a dedicated service layer normalizes dates, locations, pricing, categories, links, and identifiers before data reaches the UI.
- **Uneven third-party content:** client-side sanitization, generated visual fallbacks, deduplication, and sensible copy fallbacks keep the interface consistent.
- **External outages:** requests have timeouts and source-level failure tolerance, while the UI provides retry and error states.

## Known limitations

- Event availability and accuracy depend on the upstream providers.
- GDG's public website endpoints are not a versioned developer API, so their response shape may change. Other sources remain available if that feed fails.
- WordPress discovery currently samples Nairobi, Kampala, Dar es Salaam, London, and Berlin to keep requests bounded.
- Saved events live only in the current browser and do not sync between devices.
- Saving is not a booking. Registration, reservations, payments, and ticket purchasing happen on the organizer’s website.
- Some public events do not expose an image or price; Hackaform shows an accessible visual or text fallback.

No known application-breaking bugs remain at submission time.

## Capstone roadmap

1. **Phase 1 — Discover:** React UI, public API integration, routing, filters, and local saving.
2. **Phase 2 — Book:** Flask REST API, PostgreSQL database, organizer-created events, and real reservation records.
3. **Phase 3 — Belong:** authentication, user-owned bookings, cancellations, profiles, and an organizer dashboard.

## Deployment

The repository includes SPA routing configuration for both Netlify and Vercel. Build with `npm run build` and publish the `dist` directory. No environment variables are needed.

## Documentation

- [Presentation outline and speaker notes](docs/PRESENTATION.md)
- [Written project reflection](docs/REFLECTION.md)

## Author

Built by [Svnd3](https://github.com/Svnd3) for the Moringa School Phase 1 React capstone.

## License

Released under the [MIT License](LICENSE).
