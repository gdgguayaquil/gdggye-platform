# Backlog — outstanding non-phase work

Tracks optional / deferred work that isn't tied to a numbered project phase
(for those, see the phase map in `CLAUDE.md`). Check items off as they land;
add new ones as they surface. The **how** for design items lives in
`docs/design-system.md` — this file only tracks **what's left**.

Last updated: 2026-07-09.

## Design adoption — remaining pages

The Event-First system is adopted across the public surfaces of `web-main`
(home, `/events`, `/events/[slug]`, auth/profile) and `web-bwai-2026` (event
home, `my-qr`, `leaderboard`, `my-stats`, auth/profile). Still to do:

- [ ] **bwai `scanner`** — bring into the system. Quiet register; a panel
      header only if the page grows a clear hero stat. Low visibility.
- [ ] **bwai `pre-checkin`** — restyle into the system. So far only touched
      for a lint fix; the status callouts and form are still pre-redesign.
- [ ] **Event-day `Ticker`** — venue-signage marquee for live announcements
      ("Track 2 starts 14:00"). This is a _feature_, not a restyle: it needs a
      real announcement source. Build when that content exists. Pattern spec in
      design-system.md §5.3.

## Consolidation — promote when a second app needs it

Deferred on purpose (design-system.md §10 rule: promote to a shared package
only when a second consumer appears — moving early adds coupling for no payoff).

- [ ] **`EventCard`** (badge card) → `@gdggye/ui-kit` pattern. Currently only
      `web-main` uses it.
- [ ] **`Ticker`** → `@gdggye/ui-kit` pattern taking `items: { accent, label }[]`.
      Currently only `web-main` uses it.
- [ ] **`AccentPanel`** wrapper → extract alongside the above (the hero/panel
      markup is hand-rolled in each view today).

## Deferred features (built-around, revisit when prioritized)

- [ ] **Pre-checkin notifications** — deferred. The pre-checkin workflow
      (attendee form + admin approve/reject review) is live, but attendees are
      **not notified** when their submission is approved or rejected. Nothing
      to "turn off" — no email/notification path was ever wired; the flow just
      updates status in the DB and the attendee sees it next time they open
      `/pre-checkin`. Blocked on **`CLAUDE.md` open decision #4** (pick an
      email/notification provider: Resend / Postmark / Supabase native). Wire
      this to close Phase 3 fully.

## Nice-to-haves / cleanups

- [ ] Tailwind "canonical class" lint suggestions (e.g. `bg-[var(--c-bg)]` →
      `bg-bg`) appear as editor warnings across the codebase. Cosmetic and
      consistent with existing convention — only worth a sweep if we decide to
      adopt the shorthand everywhere at once.

## Larger product scope

Phases 3–6 (pre-checkin workflow, full admin suite, networking + badges,
reports + global ranking + hardening) are tracked in **`CLAUDE.md`** → _Phase
map_. Not restated here to avoid drift.
