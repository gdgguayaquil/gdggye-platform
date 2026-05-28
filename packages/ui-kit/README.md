# @gdggye/ui-kit

Shared design-system primitives for GDG Guayaquil apps. shadcn-style components themed via the GDG token system (CSS variables in `apps/*/app/globals.css`).

## Phase 1 primitives

- `Button` — primary / secondary / ghost / outline, three sizes
- `Badge` — colored chip variants matching event accents
- `Card` — surface with subtle border + hover
- `Input` — pill text input

## Conventions

- shadcn lives **only** in this package. Apps consume via `import { Button } from "@gdggye/ui-kit"`. Do not run `npx shadcn add` inside any app.
- Components consume semantic tokens (`var(--c-text)`, `var(--c-primary)`, etc.) — never hardcoded colors.
