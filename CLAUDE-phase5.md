# CLAUDE-phase5.md — Phase 5: Networking + Badges

> **Status: v1 complete.** All four sprints shipped — 5.1 networking scans,
> 5.2 badge model/engine, 5.3 wiring + attendee surfacing, 5.4 admin badges
> read — each verified end-to-end against local RLS. Open items (mutual credit,
> per-event cap, admin badge CRUD) remain deferred. Phase 4
> (admin suite) is v1-complete. Phase 5 turns on the two attendee-facing systems
> that were scaffolded but inert: **networking scans** (attendee↔attendee, now
> live) and **badges/achievements** (next). This file is the full spec;
> `CLAUDE.md` remains the source of truth for cross-phase locked decisions and
> architectural rules.
>
> **Payout mechanic locked (open item #1): scanner-only.** One `point_transaction`
> to the scanner per scan; no mutual credit.

## Phase 5 goal

Make the event social and rewarding: an attendee can scan another attendee's
badge to earn networking points, and the gamification loop pays out **badges**
for milestones (points, scans, networking, check-in). Everything stays
server-authorized (architectural rule 4) and Option A-clean.

Success test: at BWAI 2026, attendee A scans attendee B's personal QR, both the
scan and the points are recorded server-side, and when A crosses a threshold
(e.g. 5 people met) the scanner immediately shows a newly-earned badge.

---

## What's already scaffolded (do NOT rebuild)

- **Personal QR** already encodes `{ t: "attendee", e: eventId, i: userId }`
  and is signed (`mintAttendeeQrToken` + `signQrToken`). No QR format change.
- **`scan_logs.target_type`** enum already includes `attendee`; the
  `validateAndRecordScan` switch is exhaustive over it and already rejects
  `self_scan`.
- **`point_transactions.source_type`** already includes `networking`; the scan
  adapter already maps an `attendee` target to `source_type = 'networking'`.
- **What's inert:** `SupabaseScanTargetRepository.find("attendee", …)` returns
  `null` (so an attendee scan currently rejects `target_inactive`), and
  `resolveScanPoints({type:"attendee"})` returns `0`. Phase 5 flips both on.

---

## Phase 5 locked decisions

| Decision                   | Choice                                                                                                                                                                                                                                                                            |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Networking payout          | The **scanner** earns `NETWORKING_SCAN_POINTS` (flat constant, v1 = 5). Mutual credit (both parties earning from one scan) is **out of v1** — if wanted it's a second grant to the target, decided later. Two people who both scan each other each earn once (independent scans). |
| Networking target validity | An `attendee` target is valid iff they have a **registration** for the event. Pre-checkin status does not gate networking (you can meet anyone registered).                                                                                                                       |
| Anti-farming               | The existing one-accepted-scan-per-`(event, scanner, target_type, target_id)` unique index already stops re-scanning the same person. v1 adds an **optional per-event networking cap** (max distinct people that pay out) as an open item, not a hard requirement.                |
| Badge authority            | Badges are **server-awarded only**, evaluated in `backend-core` after a points-changing event. Never client-trusted (rule 4). Awards are idempotent via `unique (user_id, badge_id)`.                                                                                             |
| Badge scope                | A badge definition is either **event-scoped** (`event_id` set) or **global** (`event_id null`, applies to every event). v1 seeds a small event-scoped set for BWAI.                                                                                                               |
| Badge criteria             | Declarative: `criteria_type` enum + integer `threshold`. v1 types: `points_total`, `sponsor_scans`, `activity_scans`, `networking_scans`, `precheckin_approved`. Composite/AND criteria are out of v1.                                                                            |
| Evaluation trigger         | `evaluateBadges(userId, eventId)` runs **after a successful scan** (and after an admin point adjustment). It returns newly-awarded badges so the scanner can surface them immediately. No cron, no DB triggers for award logic — it lives in a use-case.                          |
| Admin surface              | v1 ships a **read + seed** path for badges (list definitions, see who earned what). Full badge-definition CRUD in admin is a stretch goal, not required for v1.                                                                                                                   |

### Why evaluation is a use-case, not a DB trigger

Badge criteria are domain rules ("5 networking scans earns _Connector_"). Per
architectural rule 4 and the Option A discipline, domain rules live in
`backend-core`, never in SQL. A DB trigger would bury the rule in the database
and couple us to Postgres — exactly what Option A avoids. The evaluator reads
the user's current tallies through ports and writes awards through a port.

---

## What ships in Phase 5

- **Networking scans** — attendee target resolves via registration; scanner
  earns networking points; scanner UI shows "+5 · met {name}".
- **Badge model** — `badges` + `user_badges` tables with RLS; a seeded BWAI set.
- **Badge engine** — `evaluateBadges` use-case wired into the scan path and the
  admin points-adjustment path; idempotent awards.
- **Attendee badge surfacing** — `/my-badges` (earned + locked-with-progress)
  and a badge-earned moment in the scanner result.
- **Admin read** — a per-event "Badges" view: definitions + award counts.

## What does NOT ship in Phase 5

- ❌ Mutual/both-party networking credit (open item)
- ❌ Composite/AND badge criteria, tiered badges (bronze/silver/gold)
- ❌ Full admin badge-definition CRUD (seed-driven in v1; stretch goal)
- ❌ Cross-event / global ranking or badge leaderboards (Phase 6)
- ❌ Badge sharing / social cards / exports
- ❌ Any change to the signed QR format or the scan token flow

---

## Data model — migration `00XX_badges.sql` (sketch)

Networking needs **no new table** (scan_logs + point_transactions already carry
it). Only badges are new.

```sql
create type badge_criteria_type as enum (
  'points_total', 'sponsor_scans', 'activity_scans',
  'networking_scans', 'precheckin_approved'
);

create table public.badges (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid references public.events(id) on delete cascade, -- null = global
  key           text not null,               -- stable slug
  name          text not null,
  description   text,
  icon          text,                         -- emoji or icon key
  criteria_type badge_criteria_type not null,
  threshold     integer not null default 1,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (event_id, key)
);

create table public.user_badges (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  event_id   uuid not null references public.events(id) on delete cascade,
  badge_id   uuid not null references public.badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  unique (user_id, badge_id)                  -- idempotent award, one per badge
);

create index user_badges_user_event_idx on public.user_badges(user_id, event_id);

alter table public.badges      enable row level security;
alter table public.user_badges enable row level security;

-- Definitions are public-read (attendees see locked badges + progress);
-- staff write.
create policy badges_public_read on public.badges for select using (true);
create policy badges_staff_write on public.badges for all
  using (public.is_staff()) with check (public.is_staff());

-- A user reads their own awards; staff read all. Awards are written by the
-- server-authorized evaluator via the service-role client (like scans) — no
-- attendee insert policy, on purpose (mirrors point_transactions).
create policy user_badges_self_read on public.user_badges for select
  using (user_id = auth.uid() or public.is_staff());
```

> The evaluator writes `user_badges` through the **service-role client** (same
> pattern as `validateAndRecordScan` writing points) — awards are never
> client-trusted, so there is deliberately no attendee insert policy.

---

## Networking — the small change

1. `resolveScanPoints`: `attendee` → `NETWORKING_SCAN_POINTS` (new constant in
   `scoringRules.ts`, v1 = 5).
2. `SupabaseScanTargetRepository.find("attendee", eventId, targetId)`: resolve
   against `registrations` — return an `AttendeeScanTarget` with
   `isActive: true` iff a registration exists for `(eventId, targetId)`.
   `id = targetId`. (The `self_scan` and one-claim guards already exist.)
3. Nothing else in `validateAndRecordScan` changes — the switch already carries
   the `attendee` case end-to-end. The scan adapter already maps it to
   `source_type = 'networking'`.

That's the entire networking feature server-side. The scanner UI adds the
"met {name}" copy (needs the target's `full_name` — resolve from `users` in the
scan response assembly, honoring the leaderboard's public-identity rule: name +
photo only, never email).

---

## Badge engine — `evaluateBadges` use-case

```ts
// packages/backend-core/src/application/use-cases/badges/evaluateBadges.ts
export interface EvaluateBadgesDeps {
  badgeRepo: BadgeRepository; // list active defs for event+global
  userBadgeRepo: UserBadgeRepository; // read awarded ids, insert awards
  statsRepo: AttendeeStatsRepository; // current tallies (points + scan counts)
}

// Runs after a points-changing event. Reads the user's current tallies once,
// checks every not-yet-awarded active badge whose criteria the user now meets,
// and awards them idempotently. Returns the newly-awarded badges so the caller
// (scan route) can surface them. Never throws on an award race — the
// unique(user_id, badge_id) index makes a duplicate insert a no-op.
export async function evaluateBadges(
  userId: string,
  eventId: string,
  deps: EvaluateBadgesDeps,
): Promise<AwardedBadge[]> {
  /* … */
}
```

- **Tallies** (`AttendeeStatsRepository`): `points_total` from
  `registrations.total_points`; `sponsor_scans` / `activity_scans` /
  `networking_scans` = count of accepted `scan_logs` by `target_type`;
  `precheckin_approved` = 1 if `registrations.pre_checkin_status = 'approved'`.
- **Met check**: `tally[criteria_type] >= threshold`.
- **Wiring**: call it at the end of the scan route after `validateAndRecordScan`
  resolves, and after `adjustEventPoints`. Failure to evaluate must never fail
  the scan/adjustment — wrap and log (same discipline as `logRejection`).

Every use-case ships with in-memory-repo unit tests (rule 6): threshold
boundary (below/at/above), idempotency (re-eval awards nothing new), global +
event-scoped defs both considered, and the "evaluation error doesn't poison the
scan" path.

---

## Sprint order

1. **Sprint 5.1 — Networking scans.** The three-point change above + scanner
   "met {name}" feedback + unit tests for the attendee target path. Smallest,
   highest-value, no new tables. Ship first.
2. **Sprint 5.2 — Badge model + engine.** Migration, `BadgeRepository` /
   `UserBadgeRepository` / `AttendeeStatsRepository` ports + adapters,
   `evaluateBadges` use-case, seed a BWAI badge set. No UI yet.
3. **Sprint 5.3 — Wire + surface.** Call `evaluateBadges` from the scan +
   adjustment paths; return newly-awarded to the scanner; build `/my-badges`
   (earned + locked-with-progress); add the scanner badge-earned moment.
4. **Sprint 5.4 — Admin read.** Per-event Badges view (definitions + award
   counts). Quiet register. (Definition CRUD is the stretch goal.)

---

## Phase 5 acceptance criteria

- [x] Scanning a registered attendee's QR grants `NETWORKING_SCAN_POINTS` to the
      scanner and logs a `networking` transaction; scanning the same person
      again rejects `already_claimed`; scanning yourself rejects `self_scan`.
      _(5.1 — unit-tested + DB-verified.)_
- [x] Scanning an unregistered/absent attendee rejects `target_inactive`. _(5.1)_
- [x] `badges` + `user_badges` ship with RLS; awards write only via the
      server-authorized evaluator (no attendee insert policy). _(5.2 — migration
      `0014`; DB-verified: 23505 on duplicate award.)_
- [x] Crossing a badge threshold via a scan awards the badge exactly once;
      re-evaluating awards nothing new (idempotent). _(5.2 — engine unit-tested;
      wiring into the scan path is 5.3.)_
- [x] `/my-badges` shows earned badges and locked ones with progress. _(5.3 —
      bwai page + bottom-nav "Logros" tab.)_
- [x] The scanner surfaces a badge earned on the scan that triggered it. _(5.3 —
      scan route returns `newBadges`; QrScanner celebrates them.)_
- [x] A failed badge evaluation never fails the underlying scan/adjustment.
      _(5.3 — both call sites wrap `evaluateBadges` best-effort.)_
- [x] Every new `backend-core` use-case has an in-memory-repo unit test.
      _(evaluateBadges, getMyBadges, getEventBadgeStats — 90 tests total.)_
- [x] `grep -r "supabase\|@supabase" packages/backend-core/src` → zero.
- [x] `grep -r "from 'next" packages/backend-core/src` → zero.
- [x] `npm run typecheck && npm run lint && npm run build` green across the repo.

---

## Risk register

- **Networking farming.** Two colluding attendees scanning each other is capped
  at one payout each by the unique index. A ring of N still earns O(N) each —
  the per-event cap (open item) is the mitigation if abuse appears.
- **Evaluation cost.** Running `evaluateBadges` on every scan adds reads. Keep
  it to one tallies read + one awarded-ids read + one bulk insert; badges per
  event are few. Revisit if scan throughput demands it.
- **Award races.** Two near-simultaneous scans both crossing a threshold could
  both try to award. The `unique(user_id, badge_id)` index makes the loser a
  no-op — the adapter must swallow 23505 like the scan path does.
- **Identity leak.** The "met {name}" response must expose only public identity
  (name + photo), never the target's email — same rule as the leaderboard.

---

## Open items to resolve during Phase 5

1. **Mutual networking credit** — does scanning B also grant B points? v1 says
   no (scanner-only). Confirm before 5.1 if mutual is wanted.
2. **`NETWORKING_SCAN_POINTS` value** — placeholder 5. Confirm with the
   gamification balance.
3. **Per-event networking cap** — build now or defer to abuse. Recommend defer.
4. **BWAI badge set** — the actual list of badges + thresholds needs product
   input (names, icons, criteria). Seed is a placeholder until then.
5. **Admin badge CRUD** — v1 is seed-driven. Decide if organizers need to
   create badges without a deploy.
