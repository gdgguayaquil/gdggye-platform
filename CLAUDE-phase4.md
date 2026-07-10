# CLAUDE-phase4.md — Phase 4: Full Admin Suite

> The Phase 2 work shipped a **minimum admin slice** (`apps/web-admin`): enough
> to author event content and gate the scanner. Phase 4 turns that slice into an
> operations console staff can actually run an event day from. This file is the
> full spec; `CLAUDE.md` remains the source of truth for cross-phase locked
> decisions and architectural rules.

## Phase 4 goal

Give organizers a self-serve console for the parts of running an event that
today require a DB console: **seeing who registered, correcting points,
watching scans, and managing who's staff** — without ever weakening the
server-authorized gamification model or the Option A discipline.

The success test: a lead organizer can run BWAI 2026 check-in desk and
help-desk operations for a full day touching **only** `admin.gdggye.org`, never
Supabase Studio.

---

## Phase 4 locked decisions

| Decision              | Choice                                                                                                                                                                                                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Admin visual register | **Quiet register only.** No accent panels, ticker, or badge cards (design-system §9 / architectural rule 7). Tables, chips, forms, and the existing admin tokens. The "showy" system is attendee-facing only.                                                          |
| Points administration | Every adjustment is a **new `point_transactions` row** with `source_type = 'admin_adjustment'`. Never a direct `UPDATE registrations.total_points` — the existing `apply_point_transaction` trigger owns the running total. Adjustments can be negative (corrections). |
| Authorization         | All writes go through **`backend-core` use-cases** called by thin route/server-action adapters. Staff identity is enforced by `requireStaff()` in the adapter **and** RLS in the DB (defense in depth).                                                                |
| Role model            | Roles live in `users.system_role` (`attendee                                                                                                                                                                                                                           | organizer | admin`), surfaced to RLS via the `system_role` JWT claim (custom access-token hook). Phase 4 adds an **admin-only** UI to change it; the change routes through a staff-scoped use-case under RLS (`is_admin()`), not a service-role key. |
| Reporting boundary    | Phase 4 ships **operational** read views (per-event attendee list, scan feed, at-a-glance counts). **Cross-event ranking, exports, and analytics dashboards stay in Phase 6** to avoid building the same aggregates twice.                                             |
| Audit                 | Points adjustments and role changes are inherently auditable (a `point_transactions` row / a role-change is a discrete event). A dedicated `admin_audit` log is **out of scope** unless a story below needs it — noted as an open item, not built speculatively.       |

### Why points adjustment is not a direct write

`registrations.total_points` is maintained by the `point_tx_after_insert`
trigger. Writing it directly would (a) desync from the transaction ledger the
leaderboard and `/my-stats` reconcile against, and (b) leave no record of _why_
the total changed. Inserting a signed `admin_adjustment` transaction keeps one
source of truth and a built-in audit trail. This mirrors the scan path exactly
— `validateAndRecordScan` also grants via a `point_transactions` insert.

---

## What ships in Phase 4

- **Attendee / registration management** — per-event attendee list (name,
  email, pre-checkin status, total points, rank), search, and a per-attendee
  detail drawer showing their point-transaction ledger and scan history.
- **Points administration** — grant or correct points from the attendee detail
  view via a signed `admin_adjustment` transaction with a required reason.
- **Scan monitoring** — a live-ish (realtime or polled) per-event scan feed off
  `scan_logs` with accepted/rejected counts and reject-reason breakdown, so a
  misconfigured QR (everything rejecting `target_inactive`) is obvious.
- **User / role management** — an admin-only screen to view users and
  promote/demote `system_role` (attendee ↔ organizer ↔ admin).
- **Event overview page** — a quiet dashboard header per event: registrations,
  pre-checkin approved/pending, total scans, points granted. Read-only counts,
  not charts.

## What does NOT ship in Phase 4

- ❌ Cross-event / global ranking (Phase 6)
- ❌ CSV/PDF exports and analytics charts (Phase 6)
- ❌ Badges / achievements / networking scan payouts (Phase 5)
- ❌ Email/notification sending (blocked on decision #4; tracked in `docs/backlog.md`)
- ❌ Any accent-panel / ticker / badge-card styling in admin (rule 7)
- ❌ Editing an attendee's profile fields on their behalf (privacy — attendees
  own their profile; admin sees, does not edit, PII beyond review needs)
- ❌ Bulk points operations (single-attendee adjustments only in v1; revisit if
  a real event-day need appears)

---

## Sprint order

Build in this order; each sprint is independently shippable.

1. **Sprint 4.1 — Attendee management (read).** Registration list + detail
   drawer (ledger + scan history). Highest operational value, pure reads, no new
   RLS write surface. Unblocks 4.2.
2. **Sprint 4.2 — Points administration (write).** `adjustEventPoints`
   use-case + RLS + the adjust action in the detail drawer. The keystone write.
3. **Sprint 4.3 — Scan monitoring.** Per-event scan feed + counts. Mostly a new
   read view over `scan_logs`; realtime optional.
4. **Sprint 4.4 — Role management.** Users list + `setUserRole` use-case + RLS.
   Admin-only (not organizer).
5. **Sprint 4.5 — Event overview header.** Aggregate counts assembled from the
   repositories built in 4.1–4.3. Thin; ships last because it depends on them.

---

## Epics & stories (story format with acceptance criteria)

### Epic A — Attendee & registration management (Sprint 4.1)

**A1. Per-event attendee list.**
As an organizer, I see everyone registered for an event.

- Route: `apps/web-admin/app/events/[id]/attendees/page.tsx` + a new
  "Attendees" tab in `event-sub-nav.tsx` (before Pre-checkin).
- Server component calls a `listEventRegistrations` use-case → rows of
  `{ userId, fullName, email, preCheckinStatus, totalPoints, rank }`.
- Columns: attendee (name + email), pre-checkin chip, points (tabular-nums),
  rank. Sortable by points desc default. Search box filters name/email
  client-side over the loaded page; server-side pagination if a page exceeds
  ~200 rows.
- Quiet register: reuse the pre-checkin table styling (grid + `chip-*`).

**A2. Attendee detail drawer.**
As an organizer, I open one attendee to see why their total is what it is.

- A slide-over (`Sheet` from ui-kit) showing identity, pre-checkin status, and
  two lists: **point ledger** (`point_transactions` for this event+user, newest
  first, source-type chip + signed points) and **scan history**
  (`scan_logs`, accepted/rejected with reason).
- Reads via `getRegistrationDetail` use-case composing
  `PointTransactionRepository` + `ScanRepository` + `RegistrationRepository`.
- The ledger sum **must equal** `registrations.total_points` — surface a
  mismatch banner if not (that's a real bug worth seeing).

### Epic B — Points administration (Sprint 4.2)

**B1. Adjust points.**
As an organizer, I grant or correct an attendee's points with a reason.

- Action in the A2 drawer: signed integer input (+/-) + required reason text.
- Server action → `adjustEventPoints({ eventId, userId, points, reason,
actorId })`. Rejects `points === 0`; enforces a sane bound (e.g. |points| ≤ 1000) as a domain rule in the use-case.
- Writes one `point_transactions` row (`source_type = 'admin_adjustment'`,
  `source_id = null`); the trigger updates the total. On success the drawer
  re-reads and the new row appears at the top of the ledger.
- **Reason is not optional.** Store it — this is the audit trail. If
  `point_transactions` has no free-text column (it does not today), the
  migration adds a nullable `note text` column used only by adjustments.

### Epic C — Scan monitoring (Sprint 4.3)

**C1. Per-event scan feed.**
As an organizer, I watch scans land during the event.

- Route: `apps/web-admin/app/events/[id]/scans/page.tsx` + sub-nav tab.
- `listScanLogs` use-case → recent N rows: attendee, target (type + resolved
  name), result chip, reject reason, time.
- Header counts: accepted / rejected totals and a reject-reason breakdown.
- Realtime is a nice-to-have (subscribe to `scan_logs` for this event, same
  debounced pattern as the leaderboard client). Ship polling/manual-refresh if
  realtime adds risk; note the choice.

### Epic D — Role management (Sprint 4.4)

**D1. Users list + role change.**
As an **admin** (not organizer), I promote/demote staff.

- Route: `apps/web-admin/app/users/page.tsx` + top-level nav item, visible only
  when the viewer is `admin`.
- `listUsers` use-case (paginated) → `{ id, fullName, email, systemRole }`.
- `setUserRole({ targetUserId, role, actorId })` use-case with domain guards:
  an admin cannot demote **themselves** (lockout guard); role must be a valid
  enum value. Writes `users.system_role`.
- The claim is JWT-based, so a demoted/promoted user's effective permissions
  change on their **next token refresh** — surface this in the UI copy ("takes
  effect on their next sign-in / token refresh") so it isn't read as a bug.

### Epic E — Event overview (Sprint 4.5)

**E1. Event dashboard header.**
As an organizer, I see the event's vital signs at a glance.

- On `events/[id]` (or a new `events/[id]/overview`): registrations,
  pre-checkin approved/pending, scans accepted, points granted.
- Pure aggregate reads from the repositories built above; no new tables.
- Quiet stat row — labeled numbers, not accent panels.

---

## Migration `00XX_admin_suite.sql` (sketch)

Only two schema needs; everything else is new read paths over existing tables.

**Shipped as `0012_points_admin.sql` (Sprint 4.2):**

```sql
-- 1. Audit fields for manual adjustments (Epic B). Both nullable — scan-driven
--    rows never set them. actor_user_id records WHICH staff member posted it.
alter table public.point_transactions
  add column note text,
  add column actor_user_id uuid references public.users(id) on delete set null;

-- 2. Staff may insert ONLY admin_adjustment rows. Attendees have no insert
--    policy at all (unchanged). Scans still flow through the service-role
--    path in validateAndRecordScan, unaffected.
create policy pt_staff_adjust on public.point_transactions
  for insert
  with check (public.is_staff() and source_type = 'admin_adjustment');

-- 3. REQUIRED, discovered during 4.2: apply_point_transaction() was a plain
--    (invoker-rights) trigger. It only ever worked because every insert came
--    from the service-role client (RLS bypassed). A staff-JWT insert runs
--    RLS-ON, and there is NO staff UPDATE policy on registrations (by design
--    — nothing writes total_points directly). So the trigger's UPDATE would
--    silently match zero rows and the total would never move. Fix: make the
--    trigger SECURITY DEFINER so its UPDATE always runs as owner and bypasses
--    RLS. Invariant preserved: only this trigger writes the total.
create or replace function public.apply_point_transaction()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  update public.registrations
     set total_points = total_points + new.points
   where event_id = new.event_id and user_id = new.user_id;
  return new;
end;
$$;
```

**Role-change policy (deferred to Sprint 4.4, not in 0012):**

```sql
create policy users_admin_role_write on public.users
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
```

> Verified end-to-end against local RLS: staff `+25`/`−10` move the total via
> the trigger; an attendee self-grant and a staff non-`admin_adjustment` insert
> are both denied by `pt_staff_adjust`.

> **Locked:** the adjustment and role-change use-cases run under the **staff JWT
> with the RLS policies above** — not a service-role key. This follows RLS-first
> (architectural rule 5) and keeps the service-role key out of these code paths.
> The scan path (`validateAndRecordScan`) is unchanged and keeps its existing
> write mechanism; only the new admin writes adopt the staff-JWT + RLS pattern.

`apply_point_transaction` (0002) already keeps `registrations.total_points` in
sync on insert — **no trigger changes needed.** The `note` column is ignored by
that trigger.

---

## backend-core use-cases (new)

All under `packages/backend-core/src/application/use-cases/`. Ports mostly
already exist (`RegistrationRepository`, `PointTransactionRepository`,
`ScanRepository`, `UserRepository`) — extend them with the read methods below;
add none of them to `supabase`/`next` imports.

| Use-case                 | Dir              | Ports used                                                               | Notes                                                     |
| ------------------------ | ---------------- | ------------------------------------------------------------------------ | --------------------------------------------------------- | ------ | ---------------- |
| `listEventRegistrations` | `registrations/` | `RegistrationRepository`, `UserRepository`                               | join name/email; sort points desc                         |
| `getRegistrationDetail`  | `registrations/` | `RegistrationRepository`, `PointTransactionRepository`, `ScanRepository` | returns ledger + scan history; assert ledger sum == total |
| `adjustEventPoints`      | `points/` (new)  | `PointTransactionRepository`, `Clock`                                    | reject 0, bound                                           | points | , require reason |
| `listScanLogs`           | `scans/`         | `ScanRepository`, `ScanTargetRepository`                                 | resolve target names; counts by result                    |
| `listUsers`              | `identity/`      | `UserRepository`                                                         | paginated                                                 |
| `setUserRole`            | `identity/`      | `UserRepository`                                                         | self-demotion guard, enum guard                           |

Each new use-case ships with a **unit test using in-memory repos** (rule 6).
Priority test cases: `adjustEventPoints` rejects 0 / out-of-bounds and produces
exactly one signed transaction; `setUserRole` refuses admin self-demotion;
`getRegistrationDetail` flags a ledger/total mismatch.

---

## Reference: `adjustEventPoints` use-case (the keystone write)

```ts
// packages/backend-core/src/application/use-cases/points/adjustEventPoints.ts
import type { PointTransactionRepository } from "../../ports/PointTransactionRepository";
import type { Clock } from "../../ports/Clock";

export interface AdjustEventPointsInput {
  eventId: string;
  userId: string;
  points: number; // signed; 0 rejected
  reason: string; // required audit note
  actorId: string; // staff user making the change
}
export interface AdjustEventPointsDeps {
  pointTx: PointTransactionRepository;
  clock: Clock;
}

const MAX_ABS = 1000;

export async function adjustEventPoints(
  input: AdjustEventPointsInput,
  deps: AdjustEventPointsDeps,
): Promise<{ transactionId: string }> {
  if (!Number.isInteger(input.points) || input.points === 0) {
    throw new Error("adjustment must be a non-zero integer");
  }
  if (Math.abs(input.points) > MAX_ABS) {
    throw new Error(`adjustment must be within ±${MAX_ABS}`);
  }
  if (!input.reason.trim()) {
    throw new Error("a reason is required for point adjustments");
  }

  // One signed admin_adjustment row. The DB trigger updates the running total;
  // we never touch registrations.total_points directly.
  const tx = await deps.pointTx.insert({
    eventId: input.eventId,
    userId: input.userId,
    sourceType: "admin_adjustment",
    sourceId: null,
    points: input.points,
    note: `${input.reason.trim()} (by ${input.actorId})`,
    createdAt: deps.clock.now(),
  });

  return { transactionId: tx.id };
}
```

> No Supabase, no Next. The route/server-action adapter parses the form, calls
> `requireStaff()`, constructs the repo from a Supabase client, and invokes this.

---

## Phase 4 acceptance criteria

Phase 4 (v1 scope above) is done when:

- [ ] `events/[id]/attendees` lists registrations with points + pre-checkin
      status, searchable.
- [ ] The attendee drawer shows the point ledger and scan history, and the
      ledger sum reconciles with `registrations.total_points`.
- [ ] An organizer can post a signed `admin_adjustment` with a reason; the total
      updates via the trigger and the new row appears in the ledger.
- [ ] `adjustEventPoints` rejects `0`, non-integers, out-of-bounds, and empty
      reasons — covered by unit tests.
- [ ] `events/[id]/scans` shows recent scans with accepted/rejected counts and
      reject-reason breakdown.
- [ ] An **admin** can change a user's `system_role`; an organizer cannot see
      the users screen; an admin cannot demote themselves.
- [ ] Every new backend-core use-case has an in-memory-repo unit test.
- [ ] `grep -r "supabase\|@supabase" packages/backend-core/src` → zero matches.
- [ ] `grep -r "from 'next" packages/backend-core/src` → zero matches.
- [ ] No accent panel / ticker / badge card appears anywhere in `web-admin`.
- [ ] `npm run typecheck && npm run lint && npm run build` green across the repo.

---

## Risk register

- **Points desync.** If any code path writes `registrations.total_points`
  directly, the ledger and the total drift. Mitigation: the reconciliation
  assert in `getRegistrationDetail` + the mismatch banner surface it early.
- **Role change confusion.** JWT claims update on refresh, not instantly. Copy
  must set the expectation, or staff will report "I promoted them and nothing
  happened."
- **Self-lockout.** An admin demoting the last admin. Guard self-demotion in
  `setUserRole`; consider a "cannot remove the last admin" guard if a single-
  admin deployment is realistic (open item).
- **PII exposure.** The attendee list surfaces name + email to all staff.
  Acceptable for organizers, but confirm this matches consent copy before ship.
- **Scan feed load.** A busy event writes many `scan_logs` rows; the feed must
  paginate/cap, not `select *`. Index `scan_event_idx` already exists.

---

## Settled decisions (were open; resolved for Phase 4)

1. **RLS, not service-role**, for adjustment/role writes — staff-JWT + the
   policies in the migration sketch (see the locked note there).
2. **Capability split:** `organizer` gets attendee management, points
   administration, and scan monitoring. **`admin`** additionally gets role
   management (the `/users` screen). The users screen and `setUserRole` are
   admin-only, enforced in both the adapter and the `users_admin_role_write`
   RLS policy (`is_admin()`).
3. **No dedicated `admin_audit` table in Phase 4.** The `note` column on
   `admin_adjustment` transactions plus discrete role-change events are the
   audit trail. Revisit a first-class audit log in Phase 6 hardening if needed.

## Open items (carry into implementation)

4. **Attendee search scale.** Client-side filter is fine for hundreds; if an
   event expects thousands, `listEventRegistrations` needs server-side search.
   Decide per real event size.
5. **Bulk points ops.** Left out of v1 by decision. Revisit only if event-day
   experience demands it.
6. **Last-admin lockout guard.** `setUserRole` blocks admins demoting
   _themselves_; whether to also block demoting the _last remaining_ admin is a
   deployment-shape question — add the guard if single-admin deployments are
   realistic.
