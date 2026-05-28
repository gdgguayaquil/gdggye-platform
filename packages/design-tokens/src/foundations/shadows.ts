// Two shadow scales: warm-cool for light mode, deeper alpha for dark mode.

export const shadowsLight = {
  xs: "0 1px 2px rgba(20, 22, 27, 0.04)",
  sm: "0 2px 4px rgba(20, 22, 27, 0.04), 0 1px 2px rgba(20, 22, 27, 0.06)",
  md: "0 8px 24px rgba(20, 22, 27, 0.06), 0 2px 6px rgba(20, 22, 27, 0.04)",
  lg: "0 24px 48px rgba(20, 22, 27, 0.08), 0 4px 12px rgba(20, 22, 27, 0.04)",
} as const;

export const shadowsDark = {
  xs: "0 1px 2px rgba(0, 0, 0, 0.4)",
  sm: "0 2px 4px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.5)",
  md: "0 8px 24px rgba(0, 0, 0, 0.5), 0 2px 6px rgba(0, 0, 0, 0.4)",
  lg: "0 24px 48px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4)",
} as const;
