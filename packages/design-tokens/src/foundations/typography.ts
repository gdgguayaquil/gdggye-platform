// Font stacks. The CSS variables `--font-inter`, `--font-space-grotesk`,
// `--font-jetbrains-mono` are populated by next/font in the consuming app —
// these stacks reference them and fall back to system fonts.

export const fontStacks = {
  display: "var(--font-space-grotesk), system-ui, -apple-system, sans-serif",
  body: "var(--font-inter), system-ui, -apple-system, sans-serif",
  mono: "var(--font-jetbrains-mono), ui-monospace, monospace",
} as const;
