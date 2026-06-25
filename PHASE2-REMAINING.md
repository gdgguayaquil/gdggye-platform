# Phase 2 — Remaining work

Snapshot of what's left after Sprint 4 (scanner) landed. The full spec lives
in `Claude phase2.md`; this file is the short, current punch-list.

## 1. Sprint 4 — manual smoke test (verify before declaring done)

Typecheck is green and Option A discipline holds, but the camera + scan
path can only be validated by running it end-to-end. Do this in dev once
before the next sprint:

1. Boot local Supabase + bwai + admin:
   ```bash
   npx supabase start
   npm run dev --workspace=@gdggye/web-admin       # http://localhost:3000
   npm run dev --workspace=@gdggye/web-bwai-2026   # http://localhost:3001
   ```
2. In `web-admin`:
   - Create / open the BWAI 2026 event and set **status = `live`** (the
     `validateAndRecordScan` use-case rejects anything not live).
   - Confirm event `start_at` ≤ now ≤ `end_at`. Adjust if needed.
   - Go to **Sponsors (global)** → create one sponsor (any slug).
   - Open the event → **Sponsors** tab → attach that sponsor, give it a
     tier, ensure **active**.
   - (Optional) Create one **Activity** with `points = 25`, active window
     covering now.
   - Click **QR sheet** in the event nav → opens the printable PDF in a
     new tab. Keep the tab open so you can scan from it.
3. In `web-bwai-2026`:
   - Sign in with the same account that registers as an attendee.
   - Visit `/scanner` (must be HTTPS or `localhost` — Web Crypto + camera
     require a secure context).
   - Tap **Activar cámara** → permission prompt → scan the sponsor QR
     from the PDF.
   - **Expected:** green panel with `+10 puntos` and a new total.
4. Re-scan the same QR.
   - **Expected:** red panel with `Ya escaneaste este QR`
     (`reason = already_claimed`).
5. Scan the activity QR.
   - **Expected:** green panel with `+25 puntos`, total now `35`.
6. SQL sanity (Supabase Studio → SQL editor):

   ```sql
   select target_type, result, reject_reason, points_granted, scanned_at
     from public.scan_logs
    where scanner_user_id = '<your user id>'
    order by scanned_at desc
    limit 10;

   select total_points
     from public.registrations
    where user_id = '<your user id>';
   ```

   Three rows in `scan_logs` (2 accepted, 1 rejected). `total_points = 35`.

**Common failure modes** to suspect first:

- `event_not_live` → status isn't `live`, or `start_at`/`end_at` window
  is off. Both are checked in the use-case.
- `target_inactive` → forgot to attach the sponsor _to this event_, or the
  attachment's `is_active` is false. A sponsor existing globally isn't
  enough.
- `outside_activity_window` → activity's `starts_at`/`ends_at` don't span
  "now".
- `invalid_token` on every scan → `QR_SIGNING_SECRET` mismatch between the
  admin app (which mints the PDF) and the bwai app (which validates). They
  must be the **same string ≥ 32 chars** in both `.env.local` files.

## 2. Sprint 5 — Leaderboard & stats (next sprint)

Spec lives in `Claude phase2.md` Epic F. Scope:

**F1 — Live leaderboard (`/leaderboard` in web-bwai-2026)**

- Supabase Realtime subscription on `public.registrations` filtered by
  `event_id`, ordered by `total_points desc`.
- Server renders the initial top-N (RSC); client component subscribes to
  the channel for updates.
- Show top N + the current user's row pinned at the bottom if they fall
  outside top N.
- Reconnect cleanly after a network drop (Realtime's default retry plus a
  refetch on `subscribe()` settled).

**F2 — My event stats (`/profile` or `/my-stats`)**

- New use-case `getMyEventStats(eventId, userId)` returning `{ total,
rank, breakdown: Record<PointSource, number> }`.
- Reads only the user's own data (RLS-enforced on `point_transactions` and
  `registrations`).

**Files that will need to exist:**

- `packages/backend-core/src/application/use-cases/stats/getMyEventStats.ts`
- A new port for ranked reads (or extend `RegistrationRepository` with
  `rankFor(eventId, userId)` returning `{ rank, total }`).
- `apps/web-bwai-2026/app/leaderboard/page.tsx` (server) + a
  `Leaderboard.tsx` client component that handles the subscription.
- `apps/web-bwai-2026/lib/server/stats.ts` thin facade.

**Open decisions for Sprint 5:**

- Top-N value (suggest 20, configurable per event later).
- Whether to show full names + photos or anonymize. Privacy: profiles are
  public-read, but a leaderboard surfaces them in aggregate. Probably
  show display name + photo; offer opt-out toggle in profile.
- Whether to share the realtime channel between leaderboard and a future
  "live activity feed" (Phase 6). Default: separate channel; cheap.

## 3. Deferred from Phase 2 (do before declaring Phase 2 complete)

- **Unit tests for backend-core use-cases.** Skipped at user request;
  should land before Phase 2 ships. Highest priority test:
  `validateAndRecordScan` rejection-order coverage with an in-memory
  scan/target repo. Pattern already exists in `events` use-case tests.
- **Phase 2 acceptance criteria** (`Claude phase2.md` §"Phase 2 acceptance
  criteria"). Walk the list once Sprint 5 is in.
- **Risk register sweep** (`Claude phase2.md` §"Risk register").
  Especially the iOS Safari camera permission flow — verify on a real
  iPhone, not desktop dev tools.

## 4. Out-of-Phase-2 known follow-ups (don't do now)

- **Phase 3** — Pre-checkin workflow.
- **Phase 4** — Full admin suite (current admin app is the "minimum
  slice"; Phase 4 expands it).
- **Phase 5** — Networking + badges (this is where the `attendee` scan
  target type wakes up; the schema + use-case branches are already in
  place but return `points = 0`).
- **Phase 6** — Reports, global ranking, hardening.

## 5. Open architectural questions (carry-overs)

These come from `CLAUDE.md` § "Open decisions for the user" and are still
unanswered:

1. Bingo / games mechanic — still deferred.
2. Hosting — assumed Vercel + Supabase Cloud (now documented in
   `DEPLOY.md`). Confirm before launch.
3. Domains — confirm `gdggye.org`, `2026.bwai.gdggye.org`,
   `admin.gdggye.org` are owned and DNS is configurable.
4. Email / notifications provider — needed by Phase 3, not Phase 2. Pick
   in Phase 3.
5. Image hosting — Supabase Storage assumed; only matters once admins
   start uploading logos.
