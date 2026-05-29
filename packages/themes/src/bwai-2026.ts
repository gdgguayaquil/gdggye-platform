import {
  gdgCore,
  gdgHalftone,
  gdgPastel,
  gdgGrayscale,
  shadowsDark,
  shadowsLight,
} from "@gdggye/design-tokens";
import type { AppTheme } from "@gdggye/theme-engine";

// bwai-2026 — the Build with AI 2026 event theme. Same foundation values as
// gdggye-core; presentation tuned for an AI/cloud-leaning event:
//
//  - Blue stays primary (BWAI is the "blue" event accent in the data).
//  - Surface gets a hint of blue in light mode so chips and cards inherit
//    the event vibe without overriding component colors.
//  - Dark mode leans harder into halftones than gdggye-core for an
//    "operator-room" look during live event use (high contrast on phone
//    screens in a dim auditorium).

export const bwai2026Light: AppTheme = {
  name: "bwai-2026",
  primaryKey: "blue",
  colors: {
    bg: "#ffffff",
    surface: "#f3f7fb", // off-white with a blue cast
    surfaceAlt: "#e6edf5",
    border: "#d4dde8",
    borderStrong: "#aebccd",

    text: gdgGrayscale.black02,
    textMuted: "#54627a",
    textSubtle: "#8694aa",

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

export const bwai2026Dark: AppTheme = {
  name: "bwai-2026-dark",
  primaryKey: "blue",
  colors: {
    bg: "#0e1320", // deep blue-black for the auditorium
    surface: "#161d2e",
    surfaceAlt: "#1f2740",
    border: "#2a3450",
    borderStrong: "#3f4c70",

    text: gdgGrayscale.offWhite,
    textMuted: "#b4bdd0",
    textSubtle: "#7a849a",

    blue: gdgHalftone.blue,
    green: gdgHalftone.green,
    yellow: gdgHalftone.yellow,
    red: gdgHalftone.red,

    blueHalf: gdgCore.blue,
    greenHalf: gdgCore.green,
    yellowHalf: gdgCore.yellow,
    redHalf: gdgCore.red,

    blueSoft: "#162741",
    greenSoft: "#163724",
    yellowSoft: "#3a2a0d",
    redSoft: "#3a1922",
  },
  shadows: shadowsDark,
};
