# GDG Guayaquil — Event-First Design System

**Status:** Adopted. First implemented on the `web-main` homepage (July 2026).
**Applies to:** every public-facing app in the monorepo (`web-main`, event-year
apps like `web-bwai-2026`). The admin app consumes the same tokens but not the
showy elements (see [§9](#9-applying-it-per-app)).

This document describes the visual language so it can be implemented on other
pages and products without re-deriving it. Token _values_ live in code
(`packages/design-tokens`, `packages/themes`) and always win over hex values
quoted here.

---

## 1. Thesis

> **The next event is the hero.** The platform exists to get thousands of
> people hyped about tech events — the design should feel like the event:
> stage screens, attendee credentials, venue signage.

Three vernacular devices carry this:

| Device           | Real-world source                             | Where it shows up                         |
| ---------------- | --------------------------------------------- | ----------------------------------------- |
| **Accent panel** | The stage screen at the venue                 | Page heroes, feature headers              |
| **Badge card**   | The attendee credential (punch slot, lanyard) | Event cards, anything "yours" (QR, stats) |
| **Ticker**       | Venue signage / marquee strips                | Section dividers, live announcements      |

Everything else stays in the quiet editorial register (white/near-black
canvas, 1px borders, mono eyebrows). The loudness is _budgeted_, not spread.

## 2. The loudness budget

**One saturated moment per screen.** A page gets one accent panel — usually
the hero. Badge cards are the exception because their color band is small
relative to the card. If two panels would be visible in the same viewport,
demote one to the quiet register.

Quiet sections are not unstyled sections: they get the full typographic
treatment (display headlines, eyebrows, mono metadata) with color only as
dots, chips, and thin rules.

## 3. Color

All values come from `packages/design-tokens` (foundations) via
`packages/themes` (per-theme mapping) and are injected as CSS variables by
the theme engine. **Components never hardcode brand hex values.**

| Family    | Light value                             | CSS var                                            | Role                                |
| --------- | --------------------------------------- | -------------------------------------------------- | ----------------------------------- |
| Core      | `#4285f4` `#34a853` `#f9ab00` `#ea4335` | `--c-{blue,green,yellow,red}`                      | Saturated surfaces, dots, rules     |
| Halftone  | `#57caff` `#5cdb6d` `#ffd427` `#ff7daf` | `--c-*-half`                                       | Bright pops on dark/colored grounds |
| Soft      | `#c3ecf6` `#ccf6c5` `#ffe7a5` `#f8d8d8` | `--c-*-soft`                                       | Chip fills, subtle tints            |
| Grayscale | bg / surface / border / text ramps      | `--c-bg`, `--c-surface`, `--c-border`, `--c-text…` | Everything quiet                    |

**Dark mode is a token swap, never a component decision.** Dark themes map
`--c-<color>` to the halftone and `--c-<color>-half` back to the core value.
Consequence worth memorizing:

- Want a surface that stays **core-saturated in both themes** (panels, badge
  bands)? Use `--c-<color>` in light and override to `--c-<color>-half` under
  `[data-theme="dark"]`. The `.accent-panel-*` classes already do this.
- Want a **bright pop on a colored/dark ground** in both themes? Use
  `--c-<color>-half` (halftone in light, core in dark). The ticker dots and
  `.panel-pop` already do this.

**Event accent** is presentation derived from event type
(`eventAccent()` in `@gdggye/event-presentation`):
Build with AI → blue, I/O Extended → yellow, DevFest → green, generic
community events → red.

## 4. Typography

Three roles, already wired via `next/font` variables:

| Role    | Face                  | CSS var                 | Usage                                                                                                 |
| ------- | --------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------- |
| Display | **Space Grotesk** 600 | `--font-space-grotesk`  | Headlines, giant dates, buttons on panels. Tight tracking (−0.02 to −0.04em), tight leading (0.9–1.1) |
| Body    | **Inter**             | `--font-inter`          | Running text, 15–19px, line-height ~1.55                                                              |
| Utility | **JetBrains Mono**    | `--font-jetbrains-mono` | Eyebrows, chips, metadata, countdown digits (always `tabular-nums`)                                   |

Scale in practice (all `clamp()`, no fixed breakpoint jumps):

- Hero headline: `clamp(48px, 8.5vw, 110px)`
- Giant hero date: `clamp(88px, 11vw, 148px)`
- Section title: `clamp(28px, 4vw, 44px)` (via `SectionHeader`) up to `clamp(34px, 5vw, 58px)` for hero-adjacent sections
- Badge-card day number: `84px` fixed (card width is bounded)
- Eyebrow: 12px mono, uppercase, `letter-spacing: 0.08–0.12em`

**Go bigger than feels safe on display type.** The scale is the showiness;
the palette discipline is what keeps it clean.

## 5. Components

Pattern utility classes live in `packages/ui-kit/src/styles/patterns.css`
(imported by each app's `globals.css`). Shared React pieces (`Countdown`) and
pure helpers (`@gdggye/event-presentation`) are in packages too; app-specific
pieces (`EventCard`, `Ticker`) still live under `apps/*/components/` until a
second app needs them. See [§10](#10-implementation-backlog).

### 5.1 Accent panel (`.accent-panel-{blue|green|yellow|red}`)

A full-saturation rounded surface (radius 28px) in the event's accent color.

- Ink is baked into the class: **white on blue/green/red, `#1e1e1e` on
  yellow** — never set text color manually inside a panel; use `currentColor`
  and opacity.
- Highlight color inside a panel: `.panel-pop` (halftone yellow; inherits ink
  on yellow panels).
- Buttons on a panel: `.panel-btn.panel-btn-solid` (white pill, dark on
  yellow) and `.panel-btn.panel-btn-ghost` (2px `currentColor` outline).
- Optional "stage grid" backdrop: 44px CSS grid lines at
  `color-mix(in srgb, currentColor 8%, transparent)`, masked with a radial
  gradient so it fades out (see `FeaturedHero` in `home-view.tsx`).
- Countdown on a panel: `<Countdown variant="panel" labels={…} />` from
  `@gdggye/ui-kit` — translucent `currentColor` cells, works on any accent.
  Pass localized unit labels (e.g. `COPY[lang].eventDetail.countdown`); the
  component holds no i18n itself.

**Hero recipe** (see `FeaturedHero`): eyebrow with pulsing dot → headline with
`.panel-pop` year → summary → CTAs → giant date + countdown + mono
venue/time/free line in the second column.

### 5.2 Badge card (`EventCard`)

The event card styled as an attendee credential:

1. **Punch slot** — `.badge-slot`, a pill in `var(--c-bg)` centered at the
   top so it reads as a hole punched through the card.
2. **Color band** — `.accent-panel-*` with the giant day number and
   `MONTH · YEAR` mono line, centered.
3. **Body** — type chip (`.chip .chip-{accent}`), name, summary.
4. **Tear line** — `border-t border-dashed` above the meta row.
5. **Meta row** — mono venue (left) + accent RSVP link (right,
   `.accent-ink-{accent}` for contrast-safe accent text on the page ground).

Hover: lift −6px with a −0.5° rotation and a soft shadow — the "picked up a
badge" gesture. Keep cards equal-height (`flex h-full flex-col`, summary gets
`flex-1`).

### 5.3 Ticker (`.ticker`)

Inverted marquee strip (`--c-text` ground, `--c-bg` ink — flips automatically
per theme).

- Content: event names + dates and community facts. Everything in the ticker
  **must also exist elsewhere on the page** — the strip is `aria-hidden`.
- Structure: two identical copies of the sequence inside `.ticker-track`;
  the animation translates −50% for a seamless loop. Duplicate the item list
  enough times that one copy is wider than any viewport.
- Dots between items use `--c-*-half`.
- Pauses on hover; the global reduced-motion block stops it entirely.

### 5.4 Quiet-register pieces

- **Eyebrow** (`.eyebrow`): mono, uppercase, letterspaced; every section
  starts with one. Encode something true (a calendar year, a location), not
  decoration.
- **Chips** (`.chip .chip-*`): soft fill + derived ink (halftone ink in dark).
- **Stats strip**: 3-up grid, giant display numbers, eyebrow labels, 1px
  column rules.
- **Pillar dots**: 12px color dots instead of numbered markers — use numbers
  only when order genuinely carries information.
- **Four-color rule**: the 6px blue/red/yellow/green segmented bar. Use as a
  top border on the final CTA band — at most once per page.

## 6. Motion

Allowed set — anything beyond this list needs a reason:

| Motion           | Spec                                                            |
| ---------------- | --------------------------------------------------------------- |
| Page fade-in     | `.fade-in`, 320ms, once                                         |
| Pulsing live dot | `.dot-pulse`, 1.6–1.8s loop, only next to "live/next" claims    |
| Ticker marquee   | 36s linear loop, pause on hover                                 |
| Card hover       | translate/rotate/shadow, 150–200ms ease                         |
| Countdown        | 1s tick via `useSyncExternalStore` (no per-render `Date.now()`) |

`prefers-reduced-motion` is already handled globally in `globals.css` — never
add an animation outside that safety net.

## 7. Time-dependent rendering

React's purity lint forbids `Date.now()` inside component render. Patterns:

- Selection logic ("which event is next?") lives in plain lib functions:
  `pickFeaturedEvent()`, `isUpcomingEvent()` in `@gdggye/event-presentation`.
- Live-updating UI subscribes to a clock via `useSyncExternalStore`
  (see `countdown.tsx`).
- Never render a countdown to a past date (a row of zeros); gate it with
  `isUpcomingEvent`.

## 8. Accessibility floor

- Ink pairs on accent panels are fixed by the classes (§5.1); don't invent
  new combinations. Small accent-colored text on the page ground uses
  `.accent-ink-*`, never raw `--c-yellow`/`--c-red` in light mode.
- Decorative elements (`.badge-slot`, grid overlays, ticker, color rules) get
  `aria-hidden="true"`.
- Focus: global `:focus-visible` outline is defined in `globals.css`; custom
  interactive elements must not suppress it.
- Countdown containers: `role="timer"` with a label naming the event.
- Every fact in a decorative element also exists as real text on the page.

## 9. Applying it per app

**`web-main` — done:** homepage; `/events/[slug]` (accent-panel hero with
panel-variant countdown gated by `isUpcomingEvent`, numbered section eyebrows
dropped); `/events` list (calendar rows kept as the quiet register, day
numbers switched to `.accent-ink-*` so yellow/red stay legible in both themes).
Remaining: auth/profile pages — quiet register only, at most a four-color rule.

**Event-year apps — `web-bwai-2026` done:** event home hero (accent panel +
countdown); `my-qr` (credential badge card); `leaderboard` / `my-stats`
(accent-panel headers, quiet rows). Remaining / future:

- Ticker → live announcements during the event ("Track 2 starts 14:00").
- `scanner`, `pre-checkin`, auth pages — quiet register; a panel header where
  a page has a clear hero stat.
- These apps run their own theme (`bwai-2026`); everything here works
  unmodified because it's token-driven.

**`web-admin`.** Tokens yes, showy elements no. No accent panels, no ticker,
no badge cards — admin stays in the quiet register so operational UI reads
instantly (architectural rule 7: experiences stay clearly separated). Chips,
eyebrows and the mono utility register are fine.

## 10. Implementation backlog

The utilities were built app-local first. To reuse across apps, in order:

1. ~~**Promote CSS utilities to a shared layer**~~ — **Done.** The pattern
   utilities (`.accent-panel-*`, `.panel-btn*`, `.panel-pop`, `.badge-slot`,
   `.accent-ink-*`, `.ticker*`, with their `[data-theme="dark"]` overrides)
   live in `packages/ui-kit/src/styles/patterns.css`. Each app's `globals.css`
   pulls them in with `@import "../../../packages/ui-kit/src/styles/patterns.css";`
   right after `@import "tailwindcss";`. Add that one line to any new app.
2. **Promote React pieces to `ui-kit`** — `Countdown` is **done**: it lives in
   `@gdggye/ui-kit` as a presentational component taking a `labels` prop (i18n
   stays in the app). Still app-local until a second app needs them: `EventCard`
   (badge card) and `Ticker` — when promoted, `Ticker` should take
   `items: { accent, label }[]`, and an `AccentPanel` wrapper is worth
   extracting at the same time.
3. ~~**Share presentation helpers**~~ — **Done.** `eventAccent`,
   `eventTypeLabel`, `isUpcomingEvent`, `pickFeaturedEvent`, `isPreCheckinClosed`,
   `shortVenue`, `eventSummary` live in `@gdggye/event-presentation` (pure,
   framework-free). Both apps import from there; no app-local copies remain.
4. Copy for new surfaces goes in `packages/i18n/src/copy.ts` (es + en, same
   shape both languages).

## 11. Do / Don't

### Do

- Spend the color budget on one panel per screen.
- Use `clamp()` display sizes; let type be the spectacle.
- Derive every color from `--c-*` tokens; let dark mode come for free.
- Write copy that ties form to meaning ("Tu credencial te espera" over badge
  cards).

### Don't

- Put two accent panels in one viewport.
- Hardcode brand hex values in components (derived inks live only in the
  shared CSS utilities).
- Set text color manually inside a panel — inherit the panel's ink.
- Add motion outside the allowed set, or any motion without the
  reduced-motion block covering it.
- Use numbered markers (01/02/03) unless the content is genuinely sequential.
- Bring panels/tickers/badges into `web-admin`.
