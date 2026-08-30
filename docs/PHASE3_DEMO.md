# Hackaform Phase 3 — 2:30 Live Demo

This is the marking-ready demonstration requested in the Phase 2 presentation feedback: use the **deployed website**, share the **entire screen**, open **Inspect → Network → Fetch/XHR**, and prove that React is calling the deployed Flask API. The goal is not to tour every page; it is to prove authentication and user-owned CRUD clearly within 150 seconds.

## What to have ready

- Open [hackaform-ten.vercel.app](https://hackaform-ten.vercel.app) in a private/incognito window and wake it up before presenting.
- Confirm [the API health endpoint](https://hackaform-api-svnd3.onrender.com/api/health) returns a successful response.
- Use a fresh disposable account or an account with no Nairobi Build Weekend booking. Never reuse a real password.
- Open the Nairobi Build Weekend detail page in one tab.
- Press `F12`, choose **Network**, select **Fetch/XHR**, clear the request list, and keep DevTools docked at the side.
- Keep the browser at a readable zoom and close notifications and unrelated tabs.
- Do one timed rehearsal. If the free API is asleep, wake it before your turn.

## Exact 2:30 run-of-show and script

### 0:00–0:18 — Problem and product

**Show:** Hackaform event page and the empty Network panel.

**Say:** “Hackaform helps people discover Kenyan and regional tech events, then keep bookings in one schedule. Organizers can publish events and programmes without managing attendance in separate spreadsheets.”

### 0:18–0:43 — Authentication

**Do:** Open **Create account**, enter a disposable name/email/password, submit, and point to `POST /api/auth/register` in Network.

**Say:** “This React form calls my deployed Flask API. Registration returns `201 Created`; Flask validates a unique email, hashes the password, creates the user in PostgreSQL, and returns a signed JWT. The app uses that token for protected requests.”

Do not open or read the token on screen. The Network row, method, URL, and status are sufficient evidence.

### 0:43–1:15 — Create and read owned data

**Do:** Return to Nairobi Build Weekend, add an optional note, click **Confirm booking**, then open **My schedule**. Point to `POST /api/bookings` (`201`) and `GET /api/bookings` (`200`).

**Say:** “Creating a booking returns `201`. My schedule then reads only the signed-in user's bookings with `200`. The user ID comes from the verified token; the browser cannot choose another owner.”

### 1:15–1:40 — Update owned data

**Do:** On the booking card click **Edit**, change the note or quantity, and click **Save changes**. Point to `PATCH /api/bookings/{id}` (`200`).

**Say:** “This PATCH updates my booking. Flask loads the record, checks that its `user_id` matches the authenticated identity, rechecks event capacity, and only then commits.”

### 1:40–2:02 — Delete owned data

**Do:** Click **Cancel booking**, confirm, and point to `DELETE /api/bookings/{id}` (`204`).

**Say:** “Delete returns `204 No Content`, and the UI removes the item. That completes create, read, update, and delete on a user-owned resource.”

### 2:02–2:22 — Authorization and architecture

**Show:** Keep the Network rows visible.

**Say:** “Protected requests carry the JWT, but authorization is enforced in Flask—not by hidden buttons. A different user receives `403 Forbidden` when trying to change this booking, event, or agenda. The deployed path is React on Vercel, Flask on Render, and PostgreSQL.”

### 2:22–2:30 — Close

**Say:** “So Hackaform proves secure authentication, relational user ownership, full RESTful CRUD, persistence, and a responsive user experience in one deployed flow.”

## Status-code cheat sheet

| Status | Meaning in this demo |
| --- | --- |
| `200 OK` | Login/read/update succeeded |
| `201 Created` | Account, event, agenda item, or booking was created |
| `204 No Content` | Delete succeeded |
| `400 Bad Request` | Validation failed |
| `401 Unauthorized` | Token is missing, invalid, expired, or belongs to no current user |
| `403 Forbidden` | Signed in, but not the owner of the requested record |
| `404 Not Found` | Record does not exist or a private event is hidden from a non-owner |
| `409 Conflict` | Duplicate booking, closed/full event, or another business-rule conflict |

## If something goes wrong

- **First request is slow:** say “The free Render service is waking,” then continue once the health endpoint responds.
- **`409 duplicate_booking`:** use the existing booking for read/update/delete, or use a fresh account.
- **No requests appear:** confirm **Fetch/XHR** is selected, recording is active, and the list is cleared rather than paused.
- **`401`:** sign out and sign in again; the 12-hour token may have expired.
- **Network failure:** show the app's error state, retry once, then explain the expected request. Keep screenshots or a short backup recording available.
- **Time is running out:** skip the architecture sentence, not the create/update/delete evidence.

## Optional ownership proof after the timed demo

If the lecturer asks for stronger evidence, sign in as a second user and attempt a request against the first user's booking/event ID. Show the `403` response, then briefly open the matching ownership test. Do not edit a production token in front of the class or expose secrets.
