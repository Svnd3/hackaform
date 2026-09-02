# Hackaform Phase 3 — Submission Checklist

Canvas separates the Phase 3 pitch, final code assignment, and showcase. Complete the item that is currently open; the pages supplied for this project show **No Due Date**, so confirm any spoken deadline with the lecturer rather than inventing one.

## Part 1 — Project pitch (file upload)

- [ ] Upload the final `Hackaform_Phase_3_Project_Pitch.pdf` to **Project 3 Assignment: Full-Stack Application with Auth Pitch**.
- [ ] Confirm the document is 1–2 pages and contains the business problem, users/value, goals and user stories, 3–7 process stages, auth approach, tools/rationale, challenges, two-week timeline, estimates, iteration/feedback, scope, and research topics.
- [ ] If Canvas accepts supporting files, optionally attach the short slide deck; the pitch document is the required submission.
- [ ] Open the uploaded file from Canvas once before submitting to verify its layout.

## Part 2 — MVP discussion

- [ ] Demonstrate registration/login and at least one protected request from the React frontend.
- [ ] Show the deployed React client fetching from Hackaform's Flask API, not a public event API.
- [ ] Show persistence in PostgreSQL and explain the relationship between User, Event, AgendaItem, and Booking.
- [ ] Post only the screenshot, recording, or written response requested in the discussion prompt.

## Part 3 — Final application (website URL field)

The Canvas field says **website URL**, but the written instruction specifically says to share the public GitHub repository containing frontend and backend. Submit:

- [ ] Primary URL: `https://github.com/Svnd3/hackaform`
- [ ] If Canvas provides a comment box, also add: `Live app: https://hackaform-ten.vercel.app`
- [ ] Open both links in an incognito window first; confirm the repo is public and the app loads.
- [ ] Confirm the README contains description, setup/run instructions, features, stack, API endpoints, deployment links, limitations, and auth/ownership decisions.
- [ ] Confirm no `.env`, JWT secret, database password, private token, or personal password is committed.

## Part 4 — Showcase / discussion

- [ ] Present the final Hackaform slide deck for 3–4 minutes; keep the whole presentation under six minutes.
- [ ] Embed a voiced, pre-recorded 60–90 second walkthrough on the Demo slide using [PHASE3_DEMO.md](./PHASE3_DEMO.md).
- [ ] Use the deployed app and show auth, Booking CRUD, the private attendee circle, and the organizer workspace.
- [ ] Keep **Inspect → Network → Fetch/XHR** visible enough to show `POST 201`, `GET 200`, `PATCH 200`, and `DELETE 204`.
- [ ] Explain that a different authenticated user receives `403`; show the negative test or response if asked.
- [ ] Upload the PPTX to Google Slides and set it to Anyone with the link (Viewer) or Moringa School viewers.
- [ ] Provide the public slide link and `https://github.com/Svnd3/hackaform` during Thursday's session.
- [ ] Upload/share the recording, visual aid, and written reflection only where the showcase prompt requests them.
- [ ] Give one peer specific, evidence-based feedback if peer response is required.

## Final technical gate

- [ ] `npm run check` passes from the repository root.
- [ ] `ruff check .` passes inside `server/`.
- [ ] `pytest --cov=app --cov-report=term-missing` passes inside `server/`.
- [ ] `flask --app run.py db check` reports no schema drift.
- [ ] Latest GitHub Actions run on `main` is green.
- [ ] `https://hackaform-api-svnd3.onrender.com/api/health` is healthy.
- [ ] A fresh account can register, book, edit, and delete through the live Vercel app.
- [ ] An organizer can save a real `chat.whatsapp.com` invite; a confirmed attendee can open it; an unbooked/cancelled user cannot.
- [ ] Protected pages redirect signed-out users, expired tokens fail safely, and ownership is enforced in Flask.
- [ ] Free services are awake before the presentation, notifications are silenced, and a backup PDF/screenshot is ready.

## Rubric cross-check

| Criterion | Evidence |
| --- | --- |
| Alignment with brief | Phase 3 pitch, focused MVP, and deployed end-to-end workflow |
| Functionality and auth | Register/login/me, protected routes, user-owned CRUD, private attendee-circle access, cross-user rejection |
| Code quality | React services/components, Flask blueprints/models, consistent errors, automated checks |
| User experience | Responsive UI, clear login state, controlled forms, loading/empty/error/success feedback |
| Documentation | Main/server READMEs, ERD, endpoints, setup, deployment, demo, reflection, and clean history |
