# CLAUDE.md — GDG Guayaquil Platform

> Drop this file at the root of the repo. Claude Code reads it on every session to keep context. Update it as decisions change.

## Project context

A digital platform for **GDG Guayaquil** with two purposes:

- **Public community presence** (`gdggye.org`)
- **Private event engagement & operations** for flagship events (`2026.bwai.gdggye.org`, `2026.devfest.gdggye.org`, etc.)

**Architecture pillars:** monorepo, multiple Next.js apps per event-year, one shared design system, one central backend (Option A), one auth/profile system, one gamification engine, one admin platform.

## Phase map

| Phase | Focus                                | Status                          | Notes                                                                                                                                                                                                                                                                                              |
| ----- | ------------------------------------ | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | Foundation + public platform         | ✅ Shipped                      | This file (below).                                                                                                                                                                                                                                                                                 |
| **2** | Auth + attendee gamification         | ✅ Shipped                      | Google + email/password auth, consents, QR scans, per-event leaderboard. Detailed spec: **`CLAUDE-phase2.md`**.                                                                                                                                                                                    |
| **3** | Pre-checkin workflow                 | 🟡 Shipped except notifications | Attendee form + admin approve/reject review are live. Attendee **notifications are deferred** — tracked in `docs/backlog.md` (needs decision #4).                                                                                                                                                  |
| **4** | Full admin suite                     | 🟡 Partial                      | Shipped: event CRUD + status, speakers/sponsors (global + per-event), agenda, activities, pre-checkin review. Remaining: attendee/registration mgmt, points-adjustment UI, scan monitoring, role mgmt, event overview. Scope spec: **`CLAUDE-phase4.md`** (reporting/exports deferred to Phase 6). |
| **5** | Networking + badges                  | ⬜ Not started                  | Scan model scaffolds an `attendee` target (0 pts today); no badges/achievements yet.                                                                                                                                                                                                               |
| **6** | Reports + global ranking + hardening | ⬜ Not started                  | Leaderboard is per-event only; no cross-event ranking, reports, or hardening pass.                                                                                                                                                                                                                 |

> Phases 1–3 are largely built (see **Status** above); 4 is a partial; 5–6 are not started. When working on Phase 2, read **`CLAUDE-phase2.md`** for the full spec, and `PHASE2-REMAINING.md` for the short punch-list of what's left. When working on Phase 4, read **`CLAUDE-phase4.md`** for the full scope, sprint order, and migration/RLS shape. This file (`CLAUDE.md`) remains the source of truth for locked decisions and architectural rules that apply across **all** phases.

> **Outstanding non-phase work** (design-adoption remnants, shared-package consolidation, cleanups) is tracked in **`docs/backlog.md`**. The visual language it draws on is documented in **`docs/design-system.md`**.

---

## Locked decisions

These are settled. Do not relitigate without explicit instruction.

| Decision                  | Choice                                                                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend framework        | **Next.js 14+** (App Router, RSC)                                                                                                                 |
| Backend strategy          | **Option A**: Next.js Route Handlers as thin adapters; all business logic in `packages/backend-core`                                              |
| Database / Auth / Storage | **Supabase** (Postgres + Auth + Storage + Realtime + Edge Functions)                                                                              |
| Monorepo tool             | **npm workspaces + Turborepo**                                                                                                                    |
| Language                  | **TypeScript** everywhere, `strict: true`                                                                                                         |
| Styling                   | **Tailwind CSS + CSS variables** for theming                                                                                                      |
| Component library         | **shadcn/ui** installed into `packages/ui-kit/` (single source of truth, all apps import from it)                                                 |
| Auth provider             | **Google OAuth via Supabase Auth** (primary) + **email + password** (fallback) — both paths bootstrap through the same `signInBootstrap` use-case |
| Deployment                | **Vercel** for Next apps, **Supabase Cloud** for backend                                                                                          |
| Package manager           | **npm** (workspaces)                                                                                                                              |
| Node version              | 20 LTS                                                                                                                                            |

---

## THE Option A discipline rule (most important rule)

**Route handlers contain ZERO business logic.** They:

1. Parse the request
2. Call a use-case from `@gdggye/backend-core`
3. Serialize the response

If you find yourself writing `if`/`else` branches or domain rules in a route handler, **STOP** and move it to a use-case in `backend-core`.

**The test:**

```bash
grep -r "supabase\|@supabase" packages/backend-core/src   # must return ZERO matches
grep -r "from 'next"        packages/backend-core/src     # must return ZERO matches
```

Domain and application layers must have **zero Supabase imports** and **zero Next.js imports**. That's what lets us extract Option A → Option B (separate backend service) later without rewriting business logic.

---

## Other architectural rules

1. **Apps own presentation; packages own shared capability.**
2. **Components consume semantic tokens, never hardcoded colors.** Use `var(--color-primary)`, never `#1a73e8`.
3. **Every event can have its own theme, but not its own design system.**
4. **Gamification rules are server-authorized, never client-trusted.** (Phase 2+)
5. **RLS-first.** No table ships without Row Level Security policies.
6. **Server-only secrets** are imported with `import 'server-only'` so leaks fail the build.
7. **Public, private attendee, and admin experiences must remain clearly separated.**
8. **shadcn lives only in `packages/ui-kit/`.** Apps never run `npx shadcn add`. They import from `@gdggye/ui-kit`. shadcn components are themed exclusively through CSS variables driven by the theme engine — no hardcoded colors inside shadcn components.
9. **Visual language follows the Event-First design system** — see **`docs/design-system.md`** (accent panels, badge cards, ticker, loudness budget, dark-mode token swap). Read it before designing or restyling any public-facing page. Admin stays in the quiet register.

---

## Phase 1 scope (THIS phase only)

Build the foundation and the public marketing site. **No auth, no scanner, no admin yet.**

### What ships in Phase 1

- Monorepo with npm workspaces + Turborepo
- `design-tokens`, `theme-engine`, `themes` (gdggye-core only), `ui-kit` (shadcn-based) packages
- `backend-core` package: domain layer + first use cases for events
- `supabase-adapters` package: event repository implementations
- `i18n` package (es/en)
- `types` package: generated Supabase types + shared domain types
- `web-main` Next.js app: `/`, `/about`, `/events`, `/events/[slug]`
- Supabase project: `events` and `event_content` tables, public-read RLS
- PWA manifest and service worker (cached shell)
- CI: typecheck, lint, build, Supabase type-generation drift check

### What does NOT ship in Phase 1

- ❌ Google sign-in (Phase 2)
- ❌ Profile, consent, `/my-*` routes (Phase 2)
- ❌ Scanner, QR, points, leaderboard (Phase 2)
- ❌ Pre-checkin (Phase 3)
- ❌ Full admin app (Phase 4 — minimum slice in Phase 2)
- ❌ Event-year apps like `web-bwai-2026` (Phase 2)
- ❌ Badges, networking scans (Phase 5)
- ❌ Reports, global ranking (Phase 6)

If tempted to add anything from this list, **STOP and ask the user.**

---

## Monorepo structure

```
gdggye-platform/
├── apps/
│   └── web-main/                    # Phase 1: public site
├── packages/
│   ├── ui-kit/                      # shadcn/ui components + custom patterns
│   │   ├── components.json          # shadcn config (lives here, not in apps)
│   │   └── src/
│   │       ├── components/ui/       # shadcn primitives (Button, Card, Dialog, ...)
│   │       └── patterns/            # custom patterns (Hero, EventCard, SponsorWall)
│   ├── design-tokens/               # foundations + semantic tokens (drives shadcn theme)
│   ├── theme-engine/                # ThemeProvider, CSS variable injection
│   ├── themes/                      # theme objects (Phase 1: gdggye-core only)
│   ├── backend-core/                # domain + application layers (NO Supabase)
│   ├── supabase-adapters/           # repository implementations
│   ├── api-client/                  # typed fetch wrappers
│   ├── i18n/                        # es/en
│   ├── types/                       # generated Supabase types + shared
│   ├── utils/
│   └── config/                      # shared tsconfig, eslint, tailwind preset
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── functions/                   # Edge Functions — SCHEDULED JOBS ONLY (Phase 3+), never business logic
├── .github/workflows/ci.yml
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
└── CLAUDE.md
```

---

## Implementation order for Claude Code

Work in this order. Do not skip ahead.

### Step 1 — Repo bootstrap

1. `npm init -y`, set `"workspaces": ["apps/*", "packages/*"]` in root `package.json`
2. Add Turborepo: `npm install -D turbo` and create `turbo.json` with `typecheck`, `lint`, `build`, `dev` pipelines
3. Create `packages/config/` with `tsconfig.base.json`, ESLint config, Prettier config, Tailwind preset
4. Add Husky + lint-staged
5. Verify: `npm run typecheck` passes on empty workspace

> **npm workspaces note:** internal packages reference each other with `"@gdggye/foo": "*"` in `dependencies`. Run `npm install` from the root — never inside individual workspaces.

### Step 2 — Supabase setup

1. `npx supabase init`
2. Create migration `0001_events_and_content.sql` (schema below)
3. Add RLS policies (public read for `status in ('published','live','closed')`)
4. `npx supabase start`
5. `npx supabase gen types typescript --local > packages/types/src/database.ts`

### Step 3 — Design tokens + theme engine

1. `packages/design-tokens/` — foundations (colors, spacing, radius, shadows, typography, motion, breakpoints) + semantic tokens
2. `packages/theme-engine/` — `ThemeProvider`, `createCssVariables`, `useTheme`
3. `packages/themes/` — `gdggye-core.ts`

### Step 4 — ui-kit (shadcn/ui in `packages/ui-kit/`)

**Important:** shadcn lives in **one place** — `packages/ui-kit/`. Do **not** run `npx shadcn add` inside any app. Apps consume components via `import { Button } from '@gdggye/ui-kit'`.

1. In `packages/ui-kit/`:
   - `npx shadcn@latest init` — choose New York style, CSS variables for colors, base color slate (will be overridden by our themes)
   - This creates `components.json` and `src/lib/utils.ts` (the `cn()` helper)
2. Wire shadcn's CSS variables to **our** semantic tokens from `design-tokens` so themes drive shadcn (see "shadcn ↔ theme integration" below)
3. Add Phase 1 primitives:
   ```bash
   npx shadcn@latest add button card input label badge avatar tabs dialog \
     sheet dropdown-menu tooltip toast separator skeleton
   ```
4. Re-export everything from `packages/ui-kit/src/index.ts`:
   ```ts
   export * from "./components/ui/button";
   export * from "./components/ui/card";
   // ...etc
   ```
5. Build custom **patterns** on top (these are ours, not shadcn): `Hero`, `EventCard`, `SponsorWall`, `FaqItem`, `Footer`
6. **Defer until later phases:** Scanner\*, LeaderboardCard, PersonalQrCard, PdfPreviewFrame, AdminSidebar, MyPointsSummary, MyBadgeList, RankChangeChip, ScanResultSheet

### Step 5 — backend-core

1. `domain/entities/Event.ts`, `domain/entities/EventContent.ts`
2. `application/ports/EventRepository.ts`, `application/ports/EventContentRepository.ts`
3. `application/use-cases/events/getPublishedEvents.ts`
4. `application/use-cases/events/getEventBySlug.ts`
5. `application/use-cases/events/getEventContent.ts`
6. Unit tests with in-memory repos (no Supabase)

### Step 6 — supabase-adapters

1. `client/createServerClient.ts`, `client/createBrowserClient.ts`
2. `repositories/SupabaseEventRepository.ts` implementing `EventRepository`
3. `repositories/SupabaseEventContentRepository.ts`

### Step 7 — web-main app

1. Next.js 14 App Router scaffold; `'server-only'` enforced on infra imports
2. Theme provider in root layout
3. i18n middleware (es default, en via `?lang=en` or subpath)
4. Pages: `/`, `/about`, `/events`, `/events/[slug]`
5. Route handlers: `app/api/events/route.ts`, `app/api/events/[slug]/route.ts`, `app/api/events/[slug]/content/route.ts`
6. PWA: `manifest.json`, service worker, install prompt

### Step 8 — CI

GitHub Actions: install → typecheck → lint → build → Supabase type drift check (regenerate types and fail if diff).

---

## Phase 1 Supabase schema

`supabase/migrations/0001_events_and_content.sql`:

```sql
create type event_type    as enum ('devfest', 'build_with_ai', 'google_io');
create type event_status  as enum ('draft', 'published', 'live', 'closed');
create type language_mode as enum ('es', 'en', 'bilingual');

create table public.events (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text unique not null,
  name                  text not null,
  type                  event_type not null,
  year                  integer not null,
  status                event_status not null default 'draft',
  language_mode         language_mode not null default 'bilingual',
  start_at              timestamptz not null,
  end_at                timestamptz not null,
  timezone              text not null default 'America/Guayaquil',
  venue_name            text,
  venue_address         text,
  venue_map_url         text,
  ticket_url            text,
  pre_checkin_deadline  timestamptz,
  leaderboard_enabled   boolean not null default true,
  theme_key             text not null default 'gdggye-core',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index events_status_idx on public.events(status);
create index events_year_idx   on public.events(year);

create table public.event_content (
  event_id    uuid primary key references public.events(id) on delete cascade,
  hero        jsonb not null default '{}'::jsonb,
  agenda      jsonb not null default '[]'::jsonb,
  speakers    jsonb not null default '[]'::jsonb,
  sponsors    jsonb not null default '[]'::jsonb,
  gallery     jsonb not null default '[]'::jsonb,
  faq         jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now()
);

-- RLS
alter table public.events        enable row level security;
alter table public.event_content enable row level security;

create policy "events_public_read" on public.events
  for select using (status in ('published', 'live', 'closed'));

create policy "event_content_public_read" on public.event_content
  for select using (
    exists (
      select 1 from public.events e
      where e.id = event_content.event_id
        and e.status in ('published', 'live', 'closed')
    )
  );

-- updated_at trigger
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger events_updated_at        before update on public.events
  for each row execute function public.handle_updated_at();
create trigger event_content_updated_at before update on public.event_content
  for each row execute function public.handle_updated_at();
```

---

## Reference: backend-core use-case pattern

```ts
// packages/backend-core/src/application/use-cases/events/getEventBySlug.ts
import type { Event } from "../../../domain/entities/Event";
import type { EventRepository } from "../../ports/EventRepository";

export interface GetEventBySlugInput {
  slug: string;
}
export interface GetEventBySlugDeps {
  eventRepo: EventRepository;
}

export async function getEventBySlug(
  input: GetEventBySlugInput,
  deps: GetEventBySlugDeps,
): Promise<Event | null> {
  const event = await deps.eventRepo.findBySlug(input.slug);
  if (!event) return null;
  if (event.status === "draft") return null; // domain rule: drafts never leave
  return event;
}
```

## Reference: route handler pattern (Option A)

```ts
// apps/web-main/app/api/events/[slug]/route.ts
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getEventBySlug } from "@gdggye/backend-core/events";
import {
  createSupabaseServerClient,
  SupabaseEventRepository,
} from "@gdggye/supabase-adapters";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const supabase = createSupabaseServerClient();
  const eventRepo = new SupabaseEventRepository(supabase);

  const event = await getEventBySlug({ slug: params.slug }, { eventRepo });

  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ event });
}
```

> No business logic in the handler. Adding `if (event.year < 2024) ...` here would violate the rule — that condition belongs in the use-case or domain layer.

## shadcn ↔ theme integration

shadcn ships with its own CSS variable convention (`--background`, `--foreground`, `--primary`, etc. defined in `globals.css`). Our **theme engine drives those variables** — shadcn doesn't know it's being themed, it just reads the variables.

**The mapping (in `packages/ui-kit/src/styles/globals.css`):**

```css
:root {
  /* shadcn variables — these get overwritten at runtime by ThemeProvider */
  --background: var(--color-background);
  --foreground: var(--color-text-primary);
  --card: var(--color-surface);
  --card-foreground: var(--color-text-primary);
  --primary: var(--color-primary);
  --primary-foreground: #ffffff;
  --secondary: var(--color-secondary);
  --muted: var(--color-surface-alt);
  --muted-foreground: var(--color-text-secondary);
  --border: var(--color-border);
  --input: var(--color-border);
  --ring: var(--color-primary);
  --destructive: var(--color-danger);
  --radius: var(--radius-card);
}
```

**The flow:**

1. `ThemeProvider` (from `theme-engine`) injects `--color-primary`, `--color-surface`, etc. on `:root` based on the active theme.
2. shadcn's variables (`--primary`, `--background`, etc.) reference our semantic tokens.
3. shadcn components consume their own variables — and automatically pick up our theme.

**Result:** swapping themes between event-year apps changes shadcn's appearance with zero shadcn-specific work. Rule 3 ("components consume semantic tokens, not hardcoded colors") still holds.

> **Do not** edit shadcn components to hardcode colors or replace `bg-primary` with custom hex values. If a component needs a different look per theme, that goes through the token system.

---

```ts
// packages/design-tokens/src/foundations/spacing.ts
export const spacing = {
  0: "0px",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
  20: "80px",
} as const;
```

```ts
// packages/design-tokens/src/semantic/tokens.ts
export const semanticTokenNames = [
  "--color-primary",
  "--color-secondary",
  "--color-accent",
  "--color-background",
  "--color-surface",
  "--color-surface-alt",
  "--color-text-primary",
  "--color-text-secondary",
  "--color-border",
  "--color-success",
  "--color-warning",
  "--color-danger",
  "--color-info",
  "--gradient-hero",
  "--gradient-accent",
  "--radius-button",
  "--radius-card",
  "--radius-input",
  "--font-heading",
  "--font-body",
] as const;
```

## Reference: theme object

```ts
// packages/themes/src/gdggye-core.ts
import type { AppTheme } from "@gdggye/theme-engine";

export const gdggyeCore: AppTheme = {
  name: "gdggye-core",
  colors: {
    primary: "#1a73e8",
    secondary: "#34a853",
    accent: "#fbbc04",
    background: "#ffffff",
    surface: "#f8f9fa",
    surfaceAlt: "#e8eaed",
    textPrimary: "#202124",
    textSecondary: "#5f6368",
    border: "#dadce0",
    success: "#188038",
    warning: "#f9ab00",
    danger: "#d93025",
    info: "#1967d2",
  },
  gradients: {
    hero: "linear-gradient(135deg, #1a73e8 0%, #34a853 100%)",
    accent: "linear-gradient(90deg, #fbbc04 0%, #ea4335 100%)",
  },
  radius: { button: "14px", card: "20px", input: "10px" },
  typography: {
    headingFont: '"Google Sans", system-ui, sans-serif',
    bodyFont: '"Roboto", system-ui, sans-serif',
  },
  imagery: { heroStyle: "community" },
};
```

---

## Phase 1 acceptance criteria

Phase 1 is done **only** when all of these are true:

- [ ] `npm install` from clean clone succeeds
- [ ] `npm run typecheck` passes across all packages and apps
- [ ] `npm run lint` passes
- [ ] `npm run build` produces a deployable `web-main` build
- [ ] `npx supabase start` brings up local DB with seed events
- [ ] `grep -r "supabase\|@supabase" packages/backend-core/src` → **zero matches**
- [ ] `grep -r "from 'next" packages/backend-core/src` → **zero matches**
- [ ] `/` shows the homepage with at least one upcoming event from Supabase
- [ ] `/events/[slug]` renders the event detail page from real DB content
- [ ] `?lang=en` switches copy to English
- [ ] Lighthouse PWA audit passes (installable, offline shell loads)
- [ ] Theme can be swapped by changing one import in the root layout
- [ ] Every backend-core use-case has a unit test using an in-memory repo
- [ ] shadcn is installed in `packages/ui-kit/` only — `find apps -name components.json` returns nothing

---

## Commands cheat sheet

```bash
npm install                                # install everything (run at root)
npm run typecheck                          # type check all packages and apps
npm run lint                               # lint all
npm run build                              # build all
npm run dev --workspace=web-main           # run web-main locally
npx supabase start                         # local Supabase (db, auth, storage)
npx supabase stop
npm run supabase:types                     # regenerate database.ts from local schema
npx supabase migration new <name>          # add a new migration

# shadcn — ALWAYS run from packages/ui-kit/, never from an app
cd packages/ui-kit && npx shadcn@latest add <component>
```

---

## Open decisions for the user

Surface these and ask before assuming.

1. **Bingo / games mechanic** — undefined. Blueprint specifies QR scans → points → leaderboard. If a bingo-card mechanic is wanted on top, the data model needs `Challenge` and `ChallengeCard` entities and Phase 2 grows. Confirm before scoping Phase 2.
2. **Hosting** — assumed Vercel + Supabase Cloud. Confirm.
3. **Domain strategy** — confirm `gdggye.org` and `2026.<event>.gdggye.org` patterns are owned and DNS configurable.
4. **Email / notifications provider** — Resend, Postmark, or Supabase native? **Pre-checkin notifications are deferred until this is decided** (tracked in `docs/backlog.md`); Phase 3 otherwise ships without them.
5. **Image hosting** — Supabase Storage + Next Image, or a separate CDN (Cloudinary, imgix)?

---

## How Claude Code should work in this repo

1. **Read this file first** at the start of every session.
2. When asked to implement something, **check which phase it belongs to.** If outside Phase 1, ask before proceeding.
3. When uncertain about an architectural choice, refer to **Locked decisions** and **Architectural rules** above. Do not relitigate.
4. Use **conventional commits**: `feat(ui-kit): add Button component`, `chore(repo): bootstrap turborepo`.
5. Every new package needs a **README** explaining its purpose and dependencies.
6. Every new use-case in `backend-core` needs a **unit test** using in-memory repos.
7. Run `npm run typecheck` **before** declaring any task done.
8. If the user asks for something contradicting a locked decision, **flag it** before changing course.
