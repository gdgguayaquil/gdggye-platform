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

## 2. Sprint 5 — Leaderboard & stats — ✅ LANDED

Delivered:

- Migration `0010_leaderboard.sql`: added `registrations` to
  `supabase_realtime`, event-scoped read policy for published+ events, and
  SECURITY DEFINER RPCs `get_event_leaderboard` + `get_user_event_rank`
  with `rank()` tie-break by `created_at`.
- `packages/backend-core` — `LeaderboardRepository`,
  `PointTransactionRepository` ports + `leaderboardUseCases`
  (`getEventLeaderboard`, `getMyEventStats`).
- `apps/web-bwai-2026/app/leaderboard/` — server-rendered top-N + client
  `LeaderboardClient` with debounced (600 ms) realtime refetch and
  pinned viewer row when outside top-N.
- Browser barrel: `@gdggye/supabase-adapters/browser` now exports
  `SupabaseLeaderboardRepository` + `SupabasePointTransactionRepository`.

Open follow-ups (not blocking Phase 2):

- `/my-stats` discoverability — link from `/profile` and from the viewer's
  row on `/leaderboard`.
- Opt-out toggle for name/photo on the leaderboard (privacy).

## 3. Deferred from Phase 2 (do before declaring Phase 2 complete)

- ~~**Unit tests for backend-core use-cases.**~~ ✅ **Landed** (49 tests
  passing across `events`, `scans`, `pre-checkin`, `leaderboard`). Covers
  `validateAndRecordScan` full rejection order (incl. the 23505 race +
  rejection-log swallow), `submitPreCheckin` guards, `reviewPreCheckin`
  transitions, and leaderboard limit clamping.
- **Phase 2 acceptance criteria** (`Claude phase2.md` §"Phase 2 acceptance
  criteria"). Walk the list once Sprint 5 is in.
- **Risk register sweep** (`Claude phase2.md` §"Risk register").
  Especially the iOS Safari camera permission flow — verify on a real
  iPhone, not desktop dev tools.

## 4. Out-of-Phase-2 known follow-ups

- **Phase 3 v1 — Pre-checkin workflow** — ✅ **Landed**. Migration
  `0011_pre_checkin.sql` (submissions table + tight RLS), backend-core
  `submitPreCheckin` / `reviewPreCheckin` use-cases (unit-tested),
  attendee form at `apps/web-bwai-2026/app/pre-checkin`, admin queue at
  `apps/web-admin/app/events/[id]/pre-checkin` with status tabs +
  approve/reject actions.
- **Phase 3 v2** — Email notifications on approve/reject (needs email
  provider decision), bulk actions in the admin queue.
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
