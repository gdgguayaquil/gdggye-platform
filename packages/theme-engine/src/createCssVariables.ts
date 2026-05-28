import { radius } from "@gdggye/design-tokens";

import type { AppTheme } from "./types";

// Map an AppTheme to the `--c-*`, `--shadow-*`, `--r-*` custom properties
// the rest of the codebase consumes. Returns a flat record of { name: value }.
export function themeToCssVariables(theme: AppTheme): Record<string, string> {
  const { colors, shadows } = theme;
  const primaryKey = theme.primaryKey ?? "blue";
  const primaryColor = colors[primaryKey];
  const primarySoftKey = `${primaryKey}Soft` as const;
  const primarySoftColor = colors[primarySoftKey];

  return {
    // Surfaces / structure
    "--c-bg": colors.bg,
    "--c-surface": colors.surface,
    "--c-surface-alt": colors.surfaceAlt,
    "--c-border": colors.border,
    "--c-border-strong": colors.borderStrong,

    // Text
    "--c-text": colors.text,
    "--c-text-muted": colors.textMuted,
    "--c-text-subtle": colors.textSubtle,

    // Brand — core
    "--c-blue": colors.blue,
    "--c-green": colors.green,
    "--c-yellow": colors.yellow,
    "--c-red": colors.red,

    // Brand — halftones
    "--c-blue-half": colors.blueHalf,
    "--c-green-half": colors.greenHalf,
    "--c-yellow-half": colors.yellowHalf,
    "--c-red-half": colors.redHalf,

    // Brand — pastels
    "--c-blue-soft": colors.blueSoft,
    "--c-green-soft": colors.greenSoft,
    "--c-yellow-soft": colors.yellowSoft,
    "--c-red-soft": colors.redSoft,

    // Semantic aliases
    "--c-primary": primaryColor,
    "--c-primary-soft": primarySoftColor,

    // Shadows
    "--shadow-xs": shadows.xs,
    "--shadow-sm": shadows.sm,
    "--shadow-md": shadows.md,
    "--shadow-lg": shadows.lg,

    // Radii (shared across themes today; theme can override later if needed)
    "--r-xs": radius.xs,
    "--r-sm": radius.sm,
    "--r-md": radius.md,
    "--r-lg": radius.lg,
    "--r-xl": radius.xl,
    "--r-pill": radius.pill,
  };
}

function varsToCss(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");
}

// Build a CSS string with :root (light) and [data-theme="dark"] (dark) blocks.
// Emitted once into a <style> tag at the top of the document, so toggling
// `data-theme` swaps every variable in one paint.
export function createThemeCss(light: AppTheme, dark: AppTheme): string {
  return [
    `:root {\n${varsToCss(themeToCssVariables(light))}\n}`,
    `[data-theme="dark"] {\n${varsToCss(themeToCssVariables(dark))}\n}`,
  ].join("\n\n");
}
