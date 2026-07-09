# CLAUDE-phase2.md — Phase 2: Auth + Attendee Gamification

> Read `CLAUDE.md` first. This file details Phase 2 only. All locked decisions and architectural rules in `CLAUDE.md` still apply — especially the **Option A discipline rule** and **Rule 8 (shadcn lives only in ui-kit)**.

## Phase 2 goal

A real attendee signs in with Google on the **BWAI 2026** site, completes their profile and consents, gets a personal QR, scans a sponsor booth at the venue, and watches the leaderboard update live — backed by a minimum admin slice that lets an organizer set the event up.

Phase 2 is the **riskiest phase** (auth + RLS + scan integrity + live traffic). Build the risky infrastructure first, visible payoff last.

---

## Phase 2 locked decisions

| Decision                             | Choice                                                                                                                        |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| QR security model                    | **Model A** — static printed QR + server-signed token, one-claim-per-target rule. No rotation in v1.                          |
| `qrRotationSeconds` field            | Kept in schema as a **dormant** field for future hardening. Not used by any v1 logic.                                         |
| Bingo / challenge cards              | **Deferred** to a later sprint. Schema must not block it, but no bingo code in Phase 2.                                       |
| Admin slice                          | **Thin real pages** in `web-admin` (event + sponsor + activity CRUD, QR sheet PDF). Reused in Phase 4 — no throwaway scripts. |
| Scan validation location             | **Next.js route handler** in `web-bwai-2026` calling `validateAndRecordScan` in `backend-core`. **NOT an Edge Function.**     |
| Edge Functions / pg_cron             | Reserved for **scheduled jobs only** (Phase 3 ticket deletion, Phase 6 snapshots). Never business logic.                      |
| Client QR decode library             | `html5-qrcode` or `@zxing/browser` — pick one in Sprint 4, document it here.                                                  |
| Networking scans (attendee→attendee) | **Phase 5.** In Phase 2 the personal QR only _displays_; it is not scannable for points yet.                                  |

### Why scan validation is a route handler, not an Edge Function

Edge Functions run **Deno** and cannot cleanly import the `backend-core` npm workspace package. Putting scan logic there would force duplicating business rules into Deno — directly violating the Option A discipline rule ("all logic lives in backend-core"). Community-event load (hundreds to low thousands of attendees) is well within Vercel route-handler capacity. Keep it in a route handler.

---

## What ships in Phase 2

- Google sign-in via Supabase Auth, with `system_role` JWT claim
- Profile completion + three independent consents (terms, privacy, sponsor)
- `web-bwai-2026` event-year app with its own theme
- Personal QR display (one per attendee per event)
- Camera scanner: sponsor QR + activity QR → points
- Live leaderboard (Supabase Realtime) + my-event-stats
- Minimum admin slice: create/publish event, sponsor CRUD, activity CRUD, QR sheet PDF
- backend-core modules: identity, users, consent, registrations, sponsors, activities, scans, points, leaderboards
- Migration `0002` with full RLS for all three roles

## What does NOT ship in Phase 2

- ❌ Networking scans (Phase 5)
- ❌ Badges (Phase 5)
- ❌ Bingo / challenge cards (deferred sprint)
- ❌ Pre-checkin / ticket upload (Phase 3)
- ❌ Full admin suite — dashboard, reports, user management (Phase 4)
- ❌ Reports / CSV export (Phase 6)
- ❌ Global cross-event ranking (Phase 6)
- ❌ QR rotation (dormant field only)
- ❌ Geofencing (optional future hardening)

If tempted to add anything from this list, **STOP and ask the user.**

---

## Sprint order (five sprints)

| Sprint | Focus                                             | Epics | Why this order                                                    |
| ------ | ------------------------------------------------- | ----- | ----------------------------------------------------------------- |
| 1      | Auth + profile + consent                          | A, B  | Gets riskiest infra (RLS + role claims) working first             |
| 2      | Event-year app shell + registration + personal QR | C, D  | Visible progress, reuses Phase 1 patterns                         |
| 3      | Minimum admin slice                               | G     | **Blocks Sprint 4** — nothing to scan without sponsors/activities |
| 4      | Scan core + points                                | E     | The keystone; highest fraud/integrity risk                        |
| 5      | Leaderboard + my-stats                            | F     | Realtime payoff                                                   |

**Sprint 3 before Sprint 4 is deliberate** — you can't test scanning until an organizer can create scan targets.

---

## Epics & stories (story format with acceptance criteria)

### Epic A — Authentication & identity (Sprint 1)

**A1 — Sign in**
As a visitor, I can sign in (Google OAuth primary, email/password fallback) so I can access private event features.

- Supabase Google OAuth provider configured (staging + prod client IDs)
- Email + password path available for users without a Google account and for local dev without OAuth setup; `auth.email.enable_signup = true`, confirmations on for staging/prod, off for local
- SSR-safe Supabase client (`@supabase/ssr`) reads/writes session cookies
- Session persists across reloads; sign-out clears it
- Redirect back to the page the user started from
- Both paths converge on the same `signInBootstrap` use-case in A2 (auth method is transparent to backend-core)

**A2 — Account bootstrap on first login**
As a first-time user, my account is created automatically on first sign-in.

- `signInBootstrap` use-case in backend-core creates a `users` row if none exists for the Google ID
- Idempotent — repeated logins never duplicate
- Default `system_role = 'attendee'`

**A3 — Role enforcement via JWT claim**
As the system, I enforce roles so attendees can't reach organizer/admin data.

- Custom access-token hook injects `system_role` into the JWT
- RLS policies branch on the claim (see RLS section)
- Verified with all three roles before any UI is built on top

### Epic B — Profile & consent (Sprint 1)

**B1 — Complete profile**
As a user, I complete my profile so the community and sponsors can identify me.

- `completeProfile` use-case validates required fields (fullName, email from Google, company optional)
- Incomplete profile gates entry to event features with a clear prompt
- Optional fields: phone, city, social links

**B2 — Accept terms and privacy separately**
As a user, I accept terms and privacy as distinct actions.

- `acceptTerms` and `acceptPrivacy` use-cases each write a timestamped `consent_records` row
- Both required before event participation
- Re-acceptance supported if versions change (store a version string)

**B3 — Optional sponsor-data-sharing consent**
As a user, I can opt in to sponsor data sharing independently.

- `acceptSponsorConsent` writes its own record
- Fully optional — declining never blocks participation
- Affects what appears in sponsor reports (Phase 6)

### Epic C — Event-year app shell `web-bwai-2026` (Sprint 2)

**C1 — BWAI-themed event site**
As an attendee, I see the BWAI 2026 event site with its own branding.

- New app `apps/web-bwai-2026` consuming `@gdggye/ui-kit` and `bwai-2026` theme
- Agenda, speakers, sponsors, venue rendered from `event_content`
- Theme swap is a single import — shadcn picks up colors via CSS variables (per `CLAUDE.md` shadcn↔theme section)

**C2 — Fast mobile navigation**
As an attendee, I navigate the event app quickly on my phone.

- PWA installable; scanner reachable in one tap during live event
- Points summary above the fold
- Bottom nav bar: Home, Scanner, Leaderboard, My QR, Profile

### Epic D — Personal QR & registration (Sprint 2)

**D1 — Register for the event**
As an attendee, I register so my points are tracked for this event.

- `ensureRegistration` creates a `registrations` row (idempotent)
- `preCheckinStatus` defaults to `not_submitted` (Phase 3 uses it)
- `totalPoints` starts at 0

**D2 — View personal QR**
As an attendee, I see my personal QR from my profile/dashboard.

- QR encodes a signed, event-scoped identifier (not raw user ID)
- Rendered client-side from a value the server provides
- **Display only in Phase 2** — scanning it for networking points is Phase 5

### Epic E — Scanning & points (Sprint 4 — the keystone)

**E1 — Open scanner & grant camera permission**
As an attendee, I open the scanner and understand why camera access is needed.

- Client QR decode (library chosen in this sprint)
- Permission explainer state before requesting camera
- Graceful states: permission denied, no camera, insecure context

**E2 — Scan sponsor QR → points once**
As an attendee, scanning a sponsor booth QR grants points exactly once.

- `validateAndRecordScan` checks, in order: authenticated → event published & live → now within event hours → target exists & active → not self → not already claimed
- On success: insert `scan_logs` (result accepted) + `point_transactions`; trigger updates `registrations.total_points`
- One-claim enforced by DB unique constraint `(event_id, user_id, target_type, target_id)` — last line of defense
- Returns points granted + new total

**E3 — Scan activity QR → activity point rule**
As an attendee, scanning a sponsor activity grants that activity's point value.

- Same validation path; points come from `activities.points`
- Activity must be within its own `starts_at`/`ends_at` window

**E4 — Invalid scans fail gracefully**
As an attendee, I get a clear message when a scan can't be accepted.

- Distinct error states: expired/invalid token, wrong event, already claimed, outside event hours, target inactive, self-scan
- Failed attempts logged to `scan_logs` (result rejected, reason) for anti-abuse monitoring
- No points granted, no partial writes

### Epic F — Leaderboard & stats (Sprint 5)

**F1 — Live leaderboard**
As an attendee, I see rankings update in real time.

- Supabase Realtime subscription on `registrations` filtered by `event_id`, ordered by `total_points desc`
- Reconnects after network drop; light payload for event-day traffic
- Shows top N + the current user's rank if outside top N

**F2 — My event stats**
As an attendee, I see my points, rank, and scan history.

- `getMyEventStats` returns totals, rank, and accepted-scan breakdown by source
- Reads only the user's own data (RLS-enforced)

### Epic G — Minimum admin slice (Sprint 3 — blocks Sprint 4)

**G1 — Create & publish event**
As an organizer, I create the BWAI 2026 event and publish it.

- `createEvent` / `publishEvent` / `updateEvent` use-cases (status workflow draft→published→live→closed)
- Set dates, deadlines, timezone, theme key, leaderboard toggle

**G2 — Sponsor CRUD**
As an organizer, I manage sponsors for the event.

- Create/edit/deactivate sponsors with tier, logo, booth label
- `isActive` toggle controls scan eligibility

**G3 — Activity CRUD**
As an organizer, I manage sponsor activities with point values.

- Point value, active window (`starts_at`/`ends_at`)
- `qrRotationSeconds` field present but dormant (Model A)

**G4 — Generate QR sheets**
As an organizer, I print QR codes for booths.

- "Generate QR sheet" produces a printable PDF per sponsor/activity
- Each QR encodes the signed, event-scoped target token
- (Uses the `pdf` capability; static codes since Model A)

---

## Migration `0002_auth_gamification.sql`

```sql
-- ── Enums ────────────────────────────────────────────────
create type system_role        as enum ('attendee', 'organizer', 'admin');
create type precheckin_status  as enum ('not_submitted', 'pending', 'approved', 'rejected');
create type scan_target_type   as enum ('sponsor', 'activity', 'attendee');
create type scan_result        as enum ('accepted', 'rejected');
create type point_source       as enum ('sponsor', 'activity', 'networking', 'bonus', 'admin_adjustment');

-- ── Users ────────────────────────────────────────────────
create table public.users (
  id                          uuid primary key references auth.users(id) on delete cascade,
  google_id                   text unique,
  email                       text not null,
  full_name                   text not null default '',
  photo_url                   text,
  company                     text,
  role                        text,                 -- job title, free text
  phone                       text,
  city                        text,
  social_links                jsonb not null default '{}'::jsonb,
  system_role                 system_role not null default 'attendee',
  accepted_terms_at           timestamptz,
  accepted_privacy_at         timestamptz,
  accepted_sponsor_consent_at timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

-- ── Consent records (separate audit trail per consent) ──
create table public.consent_records (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  consent_type text not null,          -- 'terms' | 'privacy' | 'sponsor'
  version      text not null default 'v1',
  accepted_at  timestamptz not null default now()
);
create index consent_user_idx on public.consent_records(user_id);

-- ── Registrations (one per user per event) ──────────────
create table public.registrations (
  id                 uuid primary key default gen_random_uuid(),
  event_id           uuid not null references public.events(id) on delete cascade,
  user_id            uuid not null references public.users(id) on delete cascade,
  pre_checkin_status precheckin_status not null default 'not_submitted',
  approved_at        timestamptz,
  total_points       integer not null default 0,
  event_rank         integer,
  created_at         timestamptz not null default now(),
  unique (event_id, user_id)
);
create index reg_event_points_idx on public.registrations(event_id, total_points desc);

-- ── Sponsors ─────────────────────────────────────────────
create table public.sponsors (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  name        text not null,
  tier        text,
  logo_url    text,
  description text,
  booth_label text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index sponsors_event_idx on public.sponsors(event_id);

-- ── Sponsor activities ──────────────────────────────────
create table public.activities (
  id                  uuid primary key default gen_random_uuid(),
  sponsor_id          uuid not null references public.sponsors(id) on delete cascade,
  event_id            uuid not null references public.events(id) on delete cascade,
  name                text not null,
  points              integer not null default 0,
  starts_at           timestamptz,
  ends_at             timestamptz,
  qr_rotation_seconds integer not null default 0,  -- DORMANT (Model A)
  is_active           boolean not null default true,
  created_at          timestamptz not null default now()
);
create index activities_event_idx on public.activities(event_id);

-- ── Scan log (every attempt, accepted or rejected) ──────
create table public.scan_logs (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references public.events(id) on delete cascade,
  scanner_user_id uuid not null references public.users(id) on delete cascade,
  target_type     scan_target_type not null,
  target_id       uuid not null,
  scanned_at      timestamptz not null default now(),
  points_granted  integer not null default 0,
  result          scan_result not null,
  reject_reason   text
);
-- One-claim-per-target safety net (only accepted scans count).
create unique index scan_one_claim_idx
  on public.scan_logs(event_id, scanner_user_id, target_type, target_id)
  where result = 'accepted';
create index scan_event_idx on public.scan_logs(event_id);

-- ── Point transactions (source of truth for points) ────
create table public.point_transactions (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  source_type point_source not null,
  source_id   uuid,
  points      integer not null,
  created_at  timestamptz not null default now()
);
create index pt_event_user_idx on public.point_transactions(event_id, user_id);

-- ── Trigger: keep registrations.total_points in sync ────
-- INFRASTRUCTURE ONLY. It aggregates; it does NOT decide whether to grant.
-- The grant decision lives in backend-core validateAndRecordScan.
create or replace function public.apply_point_transaction()
returns trigger language plpgsql as $$
begin
  update public.registrations
     set total_points = total_points + new.points
   where event_id = new.event_id
     and user_id  = new.user_id;
  return new;
end;
$$;

create trigger point_tx_after_insert
  after insert on public.point_transactions
  for each row execute function public.apply_point_transaction();

-- ── updated_at triggers (reuse handle_updated_at from 0001) ──
create trigger users_updated_at before update on public.users
  for each row execute function public.handle_updated_at();
```

---

## RLS policies (all three roles)

> Helper assumes `system_role` is present in the JWT via the custom access-token hook. Read it with `auth.jwt() ->> 'system_role'`.

```sql
-- Enable RLS on every new table
alter table public.users              enable row level security;
alter table public.consent_records    enable row level security;
alter table public.registrations      enable row level security;
alter table public.sponsors           enable row level security;
alter table public.activities         enable row level security;
alter table public.scan_logs          enable row level security;
alter table public.point_transactions enable row level security;

-- Convenience: is the caller an organizer or admin?
create or replace function public.is_staff() returns boolean
language sql stable as $$
  select coalesce(auth.jwt() ->> 'system_role', 'attendee') in ('organizer','admin');
$$;

create or replace function public.is_admin() returns boolean
language sql stable as $$
  select coalesce(auth.jwt() ->> 'system_role', 'attendee') = 'admin';
$$;

-- USERS: read/update own row; staff read all; only admin changes roles (enforce role-immutability in use-case + a guard)
create policy users_self_read   on public.users for select using (id = auth.uid() or public.is_staff());
create policy users_self_update on public.users for update using (id = auth.uid());
create policy users_staff_read  on public.users for select using (public.is_staff());

-- CONSENT: own rows only (staff need none here)
create policy consent_self on public.consent_records
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- REGISTRATIONS: attendee own; staff read all; writes via service role / use-case
create policy reg_self_read  on public.registrations for select using (user_id = auth.uid() or public.is_staff());
create policy reg_self_write on public.registrations for insert with check (user_id = auth.uid());

-- SPONSORS / ACTIVITIES: public read when event is visible; staff write
create policy sponsors_public_read on public.sponsors for select
  using (exists (select 1 from public.events e
                 where e.id = sponsors.event_id and e.status in ('published','live','closed')));
create policy sponsors_staff_write on public.sponsors for all
  using (public.is_staff()) with check (public.is_staff());

create policy activities_public_read on public.activities for select
  using (exists (select 1 from public.events e
                 where e.id = activities.event_id and e.status in ('published','live','closed')));
create policy activities_staff_write on public.activities for all
  using (public.is_staff()) with check (public.is_staff());

-- SCAN LOGS: attendee reads own; staff read all; INSERTS happen via service-role
-- client (server-only) inside the route handler, so no attendee insert policy.
create policy scan_self_read  on public.scan_logs for select using (scanner_user_id = auth.uid() or public.is_staff());

-- POINT TRANSACTIONS: attendee reads own; staff read all; inserts via service role only
create policy pt_self_read on public.point_transactions for select using (user_id = auth.uid() or public.is_staff());
```

> **Important:** scan/point writes go through a **server-only service-role client** inside the route handler (after `validateAndRecordScan` approves), bypassing RLS deliberately. Attendees never get direct insert rights on `scan_logs` / `point_transactions` — that's what prevents client-forged points and satisfies Rule 4 (gamification is server-authorized).

---

## Reference: `validateAndRecordScan` use-case

```ts
// packages/backend-core/src/application/use-cases/scans/validateAndRecordScan.ts
import type { ScanRepository } from "../../ports/ScanRepository";
import type { EventRepository } from "../../ports/EventRepository";
import type { ScanTargetRepository } from "../../ports/ScanTargetRepository";
import type { Clock } from "../../ports/Clock";
import { resolveScanPoints } from "../../../domain/rules/scoringRules";
import { ScanRejected } from "../../../errors";

export interface ValidateAndRecordScanInput {
  eventId: string;
  scannerUserId: string;
  targetType: "sponsor" | "activity";
  targetId: string;
}

export interface ValidateAndRecordScanDeps {
  events: EventRepository;
  targets: ScanTargetRepository;
  scans: ScanRepository;
  clock: Clock;
}

export interface ScanOutcome {
  pointsGranted: number;
  newTotal: number;
}

export async function validateAndRecordScan(
  input: ValidateAndRecordScanInput,
  deps: ValidateAndRecordScanDeps,
): Promise<ScanOutcome> {
  const now = deps.clock.now();

  const event = await deps.events.findById(input.eventId);
  if (!event) throw new ScanRejected("wrong_event");
  if (event.status !== "live") throw new ScanRejected("event_not_live");
  if (now < event.startAt || now > event.endAt)
    throw new ScanRejected("outside_event_hours");

  const target = await deps.targets.find(input.targetType, input.targetId);
  if (!target || !target.isActive || target.eventId !== input.eventId)
    throw new ScanRejected("target_inactive");

  // Self-scan only relevant for attendee targets (Phase 5); guard anyway.
  if (input.targetType === "attendee" && target.id === input.scannerUserId)
    throw new ScanRejected("self_scan");

  if (input.targetType === "activity") {
    if (
      (target.startsAt && now < target.startsAt) ||
      (target.endsAt && now > target.endsAt)
    )
      throw new ScanRejected("outside_activity_window");
  }

  const already = await deps.scans.hasAcceptedScan(
    input.eventId,
    input.scannerUserId,
    input.targetType,
    input.targetId,
  );
  if (already) throw new ScanRejected("already_claimed");

  const points = resolveScanPoints(input.targetType, target);

  // Repository performs the accepted scan_log insert + point_transaction insert
  // transactionally via the service-role client. The DB unique index is the
  // final guard against a race. Returns the new denormalized total.
  const newTotal = await deps.scans.recordAcceptedScan({
    eventId: input.eventId,
    scannerUserId: input.scannerUserId,
    targetType: input.targetType,
    targetId: input.targetId,
    points,
  });

  return { pointsGranted: points, newTotal };
}
```

> No Supabase, no Next, no HTTP in this file. Validation order matters — cheapest/most-common rejections first. The route handler catches `ScanRejected` and maps `reason` → HTTP + a `scan_logs` rejected row.

## Reference: scan route handler (Option A)

```ts
// apps/web-bwai-2026/app/api/scans/validate/route.ts
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { validateAndRecordScan } from "@gdggye/backend-core/scans";
import { ScanRejected } from "@gdggye/backend-core/errors";
import {
  createSupabaseServerClient, // user-scoped, RLS on — for identity
  createSupabaseServiceClient, // service role, server-only — for writes
  buildScanDeps, // wires repositories around the clients
  verifyTargetToken, // unwraps the signed QR token
} from "@gdggye/supabase-adapters";

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { eventId, token } = await req.json();
  const target = verifyTargetToken(token); // {targetType, targetId, eventId} or throws
  if (!target || target.eventId !== eventId)
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });

  const deps = buildScanDeps(createSupabaseServiceClient());

  try {
    const outcome = await validateAndRecordScan(
      {
        eventId,
        scannerUserId: user.id,
        targetType: target.targetType,
        targetId: target.targetId,
      },
      deps,
    );
    return NextResponse.json(outcome);
  } catch (e) {
    if (e instanceof ScanRejected) {
      // repository/use-case also logs the rejected scan for anti-abuse
      return NextResponse.json({ error: e.reason }, { status: 409 });
    }
    throw e;
  }
}
```

---

## Custom access-token hook (the `system_role` claim)

Phase 2 depends on `system_role` being in the JWT so RLS can branch on it. Configure a Supabase **custom access token hook** (Postgres function) that reads `public.users.system_role` and adds it to the token claims. Without this, `auth.jwt() ->> 'system_role'` is null and every staff policy fails closed.

- Implement as a SQL hook function; register it in Supabase Auth settings.
- Default to `'attendee'` when absent.
- Test: sign in as each role, decode the JWT, confirm the claim is present and correct **before** building any staff UI.

---

## Phase 2 acceptance criteria

- [ ] `npm run typecheck`, `npm run lint`, `npm run build` all pass
- [ ] `grep -r "supabase\|@supabase" packages/backend-core/src` → **zero matches**
- [ ] `grep -r "from 'next" packages/backend-core/src` → **zero matches**
- [ ] No scan/points logic exists in any Edge Function (`supabase/functions/`)
- [ ] Sign-in works via both Google OAuth and email/password; first login through either path creates exactly one `users` row (idempotent)
- [ ] JWT contains correct `system_role` for attendee, organizer, admin
- [ ] RLS verified with all three roles: attendee cannot read another user's registration/scans/points
- [ ] Profile completion gates event features; three consents recorded independently
- [ ] `web-bwai-2026` renders with BWAI theme; shadcn picks up theme colors via CSS variables
- [ ] Personal QR displays (not scannable for points — Phase 5)
- [ ] Organizer can create+publish event, add sponsors/activities, generate a QR sheet PDF
- [ ] Scanning a sponsor QR grants points exactly once; a second scan returns `already_claimed`
- [ ] Scanning outside event hours / inactive target / self → correct distinct errors, no points
- [ ] Rejected scans are logged with a reason
- [ ] DB unique index blocks a duplicate accepted scan even under a forced race
- [ ] Attendee cannot insert into `scan_logs` / `point_transactions` directly (RLS denies)
- [ ] Leaderboard updates live via Realtime; reconnects after network drop
- [ ] `getMyEventStats` returns correct totals/rank/breakdown for the signed-in user
- [ ] Scanner tested on real iOS Safari **and** Android Chrome devices

---

## Risk register

| Risk                                                         | Mitigation                                                                                              |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| RLS misconfigured → data leak or total lockout               | Test all three roles before building UI; fail-closed defaults                                           |
| Client forges points                                         | All point writes via server-only service-role client after use-case approval; no attendee insert policy |
| Double-claim race                                            | DB unique index on accepted scans is the final guard, independent of app logic                          |
| Camera permission quirks (iOS Safari)                        | Real-device testing in Sprint 4; explicit permission explainer + fallback states                        |
| `system_role` claim missing                                  | Verify JWT decode for each role before staff UI; policies fail closed                                   |
| Event-day traffic spike                                      | Light Realtime payloads; denormalized `total_points`; indexed leaderboard query                         |
| Scope creep into Phase 3/5 (pre-checkin, networking, badges) | "Does NOT ship" list; stop-and-ask rule                                                                 |

---

## Open items to resolve during Phase 2

1. **QR decode library** — choose `html5-qrcode` vs `@zxing/browser` in Sprint 4; record the choice here.
2. **Token signing secret management** — where the QR-signing secret lives (Vercel env, server-only). Decide in Sprint 3 before generating QR sheets.
3. **Bingo sprint** — still deferred; revisit after Sprint 5. Schema already supports deriving cells from `scan_logs`.
4. **Profile required-field set** — confirm exactly which fields gate participation (Sprint 1).
