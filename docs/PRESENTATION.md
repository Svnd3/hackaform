# Hackaform Phase 3 — Presentation Index

Use the presentation that matches the assessment. Phase 3 has two different speaking moments: the **pitch** explains the plan, while the **final demo** proves the completed product. Do not present the old Phase 1 deck for either task.

## Phase 3 pitch

**Purpose:** Explain how the existing Hackaform codebase will be completed with authentication, authorization, user-owned data, testing, and deployment readiness.

**Recommended length:** 2:30 if the lecturer keeps the announced short format.

**Source:** [PHASE3_PITCH.md](./PHASE3_PITCH.md)

Suggested four-slide story:

1. **The coordination problem** — scattered events waste attendee and organizer time.
2. **The secure product** — public discovery; authenticated personal bookings; owner-only events and agendas.
3. **How access works** — React → JWT → Flask ownership guard → PostgreSQL; non-owner → `403`.
4. **Two-week delivery** — audit, harden, test with two users, critique/iterate, deploy, document.

The honest Phase 3 framing is: authentication was introduced early in Phase 2, and the final phase verifies and hardens it. Do not claim that a finished feature is still only planned, and do not imply that React controls authorization.

## Final live demonstration

**Purpose:** Prove the rubric from the deployed UI.

**Length:** 2:30 unless the lecturer announces otherwise.

**Source:** [PHASE3_DEMO.md](./PHASE3_DEMO.md)

The essential evidence is:

1. Create an account: `POST /api/auth/register` → `201`.
2. Create a personal booking: `POST /api/bookings` → `201`.
3. Read it in My schedule: `GET /api/bookings` → `200`.
4. Edit it: `PATCH /api/bookings/{id}` → `200`.
5. Delete it: `DELETE /api/bookings/{id}` → `204`.
6. Explain that server-side ownership rejects a different user with `403`.

Share the entire screen and keep **Inspect → Network → Fetch/XHR** visible. Use the UI for every normal action; the Network panel is evidence that the deployed React client is calling the Flask API. Never expose production secrets, a database URL, or a reusable token.

## Supporting material

- [Phase 3 written reflection](./PHASE3_REFLECTION.md)
- [Phase 3 submission checklist](./PHASE3_SUBMISSION_CHECKLIST.md)
- [Entity relationship diagram](./ERD.md)
- [Backend contract and security notes](../server/README.md)

Earlier Phase 1 and Phase 2 files remain in `docs/` as project-history evidence. They are archived context, not the current Phase 3 script.
