// Official GDG palette — core, halftones, pastels, and grayscale.
// These are foundation values; themes pick which subset maps to which
// semantic role (primary, surface, etc.) via the theme-engine.

export const gdgCore = {
  blue: "#4285f4",
  green: "#34a853",
  yellow: "#f9ab00",
  red: "#ea4335",
} as const;

export const gdgHalftone = {
  blue: "#57caff",
  green: "#5cdb6d",
  yellow: "#ffd427",
  red: "#ff7daf",
} as const;

export const gdgPastel = {
  blue: "#c3ecf6",
  green: "#ccf6c5",
  yellow: "#ffe7a5",
  red: "#f8d8d8",
} as const;

export const gdgGrayscale = {
  offWhite: "#f0f0f0",
  black02: "#1e1e1e",
} as const;
