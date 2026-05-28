// Shape of a theme. Two of these (light + dark) drive the GDG site.
// New themes only need to fill these slots; the theme-engine handles the
// CSS variable emission. Foundation values (spacing, radius scale, font
// stacks) come from @gdggye/design-tokens directly, so themes don't carry
// them.

export interface ThemeColors {
  // Surfaces / structure
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  borderStrong: string;

  // Text
  text: string;
  textMuted: string;
  textSubtle: string;

  // Brand — core
  blue: string;
  green: string;
  yellow: string;
  red: string;

  // Brand — halftones (hover / secondary moments)
  blueHalf: string;
  greenHalf: string;
  yellowHalf: string;
  redHalf: string;

  // Brand — pastels (soft fills, chips, blocks)
  blueSoft: string;
  greenSoft: string;
  yellowSoft: string;
  redSoft: string;
}

export interface ThemeShadows {
  xs: string;
  sm: string;
  md: string;
  lg: string;
}

export interface AppTheme {
  name: string;
  colors: ThemeColors;
  shadows: ThemeShadows;
  // primary is a semantic alias — defaults to colors.blue if not set
  primaryKey?: keyof Pick<ThemeColors, "blue" | "green" | "yellow" | "red">;
}
