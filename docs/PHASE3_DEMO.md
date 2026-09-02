# Hackaform Phase 3 — Final Demo Recording

Beatrice's 1 September briefing requires a **deployed**, pre-recorded application demo with voice-over. Keep the recording between **60 and 90 seconds**, embed it on the Demo slide, and keep the full presentation under six minutes. She will test the deployed application while the video plays, so do not record localhost.

## Prepare before recording

- Wake [the Render API](https://hackaform-api-svnd3.onrender.com/api/health), then open [the deployed app](https://hackaform-ten.vercel.app) in an incognito window.
- Confirm the health endpoint returns `200`, the latest deployment is live, and a new account can complete the flow.
- Create a disposable attendee email and a real WhatsApp group invite for the organizer test. Never reuse a personal password.
- Open Chrome **Inspect → Network → Fetch/XHR**, clear the list, and keep it narrow enough that the product remains readable.
- Silence notifications, close unrelated tabs, use 100% browser zoom, and record the full browser window with microphone audio.

## 80-second shot list and voice-over

### 0:00–0:08 — Discover

**Show:** Home, then Explore; filter for a Nairobi hackathon.

**Say:** “Hackaform brings scattered Kenyan and regional tech events into one clear place to discover, plan, and attend.”

### 0:08–0:21 — Authenticate

**Show:** Register a disposable user; briefly point to `POST /api/auth/register` → `201` in Network.

**Say:** “A visitor can register securely. Flask validates the request, hashes the password, persists the user in PostgreSQL, and returns a signed JWT.”

### 0:21–0:35 — Create and read owned data

**Show:** Open Nairobi Build Weekend, confirm one place, then open My schedule. Point to `POST /api/bookings` → `201` and `GET /api/bookings` → `200`.

**Say:** “Booking creates user-owned data, and My schedule reads only records belonging to the authenticated user.”

### 0:35–0:48 — Unlock the attendee circle

**Show:** Return to the event and reveal **Attendee circle**. If a real invite is configured, click Open attendee chat and return immediately.

**Say:** “A confirmed booking unlocks the private attendee circle, so people can introduce themselves and form teams before the hackathon. The invite is never sent in public event data.”

### 0:48–1:02 — Update and delete

**Show:** Edit the booking note or quantity, save, then cancel and confirm. Point to `PATCH` → `200` and `DELETE` → `204`.

**Say:** “The attendee can update and delete their own booking. Cancelling also removes access to the private circle.”

### 1:02–1:20 — Organizer workspace and close

**Show:** Use a prepared organizer session or a quick cut to the Organizer Studio, event editor, agenda, roster, and circle manager.

**Say:** “Organizers manage only their own events, agendas, attendance, and circle settings. React runs on Vercel, Flask on Render, and PostgreSQL stores the relationships. Ownership is enforced in the API, where another user receives `403 Forbidden`.”

## What the circle feature does—and does not do

Hackaform securely stores and releases the host's WhatsApp invite. The host creates the group in WhatsApp and pastes the invite into Hackaform. The **Download group cover** helper creates an event-branded image the host can set manually. WhatsApp has no supported public API for silently creating ordinary groups or setting their photos, so never claim those steps are automatic.

## Recording checklist

- [ ] Deployed Vercel URL is visible; no localhost.
- [ ] Voice-over is audible and the recording is 1:00–1:30.
- [ ] Authentication is visible.
- [ ] Booking `POST`, `GET`, `PATCH`, and `DELETE` are visible in Network.
- [ ] Circle access is shown only after confirmation.
- [ ] Organizer workspace appears briefly.
- [ ] No JWT, database URL, private invite code, or personal password is zoomed into view.
- [ ] The video is inserted on slide 5 and plays from the first click.

If Render is asleep, wake it at least five minutes before presenting. Keep a local copy of the MP4 and the PDF deck as backups.
