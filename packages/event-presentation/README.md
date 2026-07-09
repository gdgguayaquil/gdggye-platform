# @gdggye/event-presentation

Pure presentation helpers for events, shared across apps so the public site
and every event microsite render events the same way.

**What it holds**

- `eventAccent(event)` / `EventAccent` — maps an event type to its design-system
  accent color (`blue` | `green` | `yellow` | `red`).
- `eventTypeLabel(type)` — human-readable label per event type.
- `isUpcomingEvent(event)` — whether the event's start is in the future.
- `pickFeaturedEvent(events)` — the next upcoming event (falls back to the first).
- `isPreCheckinClosed(event)` — whether the pre-checkin window has passed.
- `shortVenue(name)` / `eventSummary(event, lang)` — small formatting helpers.

**Why it's separate.** Accent color and type labels are design decisions, not
domain rules, so they stay out of `@gdggye/backend-core` (the layering rule
keeps presentation out of the domain layer). This package is framework-free —
no React, no Supabase, no Next — so it's safe to import anywhere.

**Depends on:** `@gdggye/backend-core` (event types only).
