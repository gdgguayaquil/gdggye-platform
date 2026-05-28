// Canonical names of the CSS custom properties that themes set on :root.
// Components consume these via `var(--c-…)`. Listing them here gives us a
// single source of truth: if it's not in this list, a theme isn't expected
// to provide it, and a component shouldn't read it.

export const SEMANTIC_TOKEN_NAMES = [
  // Surfaces / structure
  "--c-bg",
  "--c-surface",
  "--c-surface-alt",
  "--c-border",
  "--c-border-strong",

  // Text
  "--c-text",
  "--c-text-muted",
  "--c-text-subtle",

  // Brand — core
  "--c-blue",
  "--c-green",
  "--c-yellow",
  "--c-red",

  // Brand — halftones (hover/secondary)
  "--c-blue-half",
  "--c-green-half",
  "--c-yellow-half",
  "--c-red-half",

  // Brand — pastels (soft fills, chips, blocks)
  "--c-blue-soft",
  "--c-green-soft",
  "--c-yellow-soft",
  "--c-red-soft",

  // Semantic aliases
  "--c-primary",
  "--c-primary-soft",

  // Shadows
  "--shadow-xs",
  "--shadow-sm",
  "--shadow-md",
  "--shadow-lg",

  // Radii
  "--r-xs",
  "--r-sm",
  "--r-md",
  "--r-lg",
  "--r-xl",
  "--r-pill",
] as const;

export type SemanticTokenName = (typeof SEMANTIC_TOKEN_NAMES)[number];
