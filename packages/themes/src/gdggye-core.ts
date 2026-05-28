import {
  gdgCore,
  gdgHalftone,
  gdgPastel,
  gdgGrayscale,
  shadowsDark,
  shadowsLight,
} from "@gdggye/design-tokens";
import type { AppTheme } from "@gdggye/theme-engine";

// gdggye-core — the default theme for gdggye.org and event microsites.
//
// Light: warm whites, GDG core colors lead.
// Dark: Black 02 as page, halftones lead (brighter on black), and the
// "soft" pastels become deep tints of the core so chips still read.

export const gdggyeCoreLight: AppTheme = {
  name: "gdggye-core",
  primaryKey: "blue",
  colors: {
    bg: "#ffffff",
    surface: gdgGrayscale.offWhite, // #f0f0f0
    surfaceAlt: "#e4e4e4",
    border: "#d8d8d8",
    borderStrong: "#b8b8b8",

    text: gdgGrayscale.black02, // #1e1e1e
    textMuted: "#5a5a5a",
    textSubtle: "#8a8a8a",

    blue: gdgCore.blue,
    green: gdgCore.green,
    yellow: gdgCore.yellow,
    red: gdgCore.red,

    blueHalf: gdgHalftone.blue,
    greenHalf: gdgHalftone.green,
    yellowHalf: gdgHalftone.yellow,
    redHalf: gdgHalftone.red,

    blueSoft: gdgPastel.blue,
    greenSoft: gdgPastel.green,
    yellowSoft: gdgPastel.yellow,
    redSoft: gdgPastel.red,
  },
  shadows: shadowsLight,
};

export const gdggyeCoreDark: AppTheme = {
  name: "gdggye-core-dark",
  primaryKey: "blue",
  colors: {
    bg: gdgGrayscale.black02, // #1e1e1e
    surface: "#262626",
    surfaceAlt: "#303030",
    border: "#3a3a3a",
    borderStrong: "#525252",

    text: gdgGrayscale.offWhite, // #f0f0f0
    textMuted: "#a8a8a8",
    textSubtle: "#757575",

    // Halftones lead in dark — brighter, more legible on black.
    blue: gdgHalftone.blue,
    green: gdgHalftone.green,
    yellow: gdgHalftone.yellow,
    red: gdgHalftone.red,

    // The core values become the "half" step in dark.
    blueHalf: gdgCore.blue,
    greenHalf: gdgCore.green,
    yellowHalf: gdgCore.yellow,
    redHalf: gdgCore.red,

    // "Soft" in dark = deep tint of the core.
    blueSoft: "#1a2f4a",
    greenSoft: "#1c3a22",
    yellowSoft: "#3a2e10",
    redSoft: "#3a1c25",
  },
  shadows: shadowsDark,
};
