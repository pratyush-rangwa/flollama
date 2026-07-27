/**
 * Single source of truth for design tokens, ported from
 * next/src/styles/_variables.scss with one deliberate override: dark
 * background is #141414 (Figma), not the web's #1c1c1c.
 *
 * NativeWind can't import this file directly (tailwind.config.js is loaded
 * outside the RN/TS bundler pipeline) so tailwind.config.js mirrors these
 * values by hand — keep the two in sync. Anything that isn't reachable via
 * NativeWind className (SVG `fill`, native Modal/BottomSheet backgrounds,
 * RefreshControl tint, etc.) should read from here directly.
 */

export type ThemeMode = "light" | "dark";

export type ThemeColors = {
  text: string;
  secondaryText: string;
  tertiaryText: string;
  background: string;
  primary: string;
  secondary: string;
  tertiary: string;
  accent: string;
  stroke: string;
  logicon: string;
  dangerous: string;
  dangerousText: string;
  popupBackground: string;
  hoverBackground: string;
  bgBlur: string;
};

export const colors: Record<ThemeMode, ThemeColors> = {
  light: {
    text: "#1c1c1c",
    secondaryText: "rgba(28,28,28,0.6)",
    tertiaryText: "rgba(0,0,0,0.4)",
    background: "#f5f5f5",
    primary: "#121212",
    secondary: "#e4eef1",
    tertiary: "#eaf0f5",
    accent: "#5354a2",
    stroke: "rgba(28,28,28,0.1)",
    logicon: "#3d3d3d",
    dangerous: "#ba1c1c",
    dangerousText: "#dc2828",
    popupBackground: "#f1f5f9",
    hoverBackground: "#eaf0f5",
    bgBlur: "rgba(0,0,0,0.2)",
  },
  dark: {
    text: "#e6e6e6",
    secondaryText: "rgba(255,255,255,0.6)",
    tertiaryText: "rgba(255,255,255,0.4)",
    // OVERRIDE — web uses #1c1c1c, mobile uses #141414 per Figma login screen
    background: "#141414",
    primary: "#f0f8ff",
    secondary: "#292929",
    tertiary: "#2e2e2e",
    accent: "#c6c7f8",
    stroke: "rgba(255,255,255,0.1)",
    logicon: "#c2c2c2",
    dangerous: "#811d1d",
    dangerousText: "#ba1c1c",
    popupBackground: "#292929",
    hoverBackground: "#333333",
    bgBlur: "rgba(255,255,255,0.1)",
  },
};

export const typography = {
  fontFamilies: {
    primary: "Inter",
    secondary: "Poppins",
    logo: "Ubuntu",
  },
  scale: {
    h1: { size: 48, weight: "700", lineHeight: 56 },
    h2: { size: 40, weight: "700", lineHeight: 48 },
    h3: { size: 32, weight: "700", lineHeight: 40 },
    h4: { size: 28, weight: "700", lineHeight: 34 },
    h5: { size: 24, weight: "500", lineHeight: 30 },
    bodyXlg: { size: 24, weight: "400", lineHeight: 32 },
    bodyLg: { size: 20, weight: "500", lineHeight: 28 },
    body: { size: 18, weight: "400", lineHeight: 26 },
    bodySmall: { size: 16, weight: "400", lineHeight: 22 },
    caption: { size: 14, weight: "300", lineHeight: 20 },
    label: { size: 12, weight: "300", lineHeight: 16 },
    logo: { size: 48, weight: "500", family: "Ubuntu", lineHeight: 56 },
    logoSmall: { size: 28, weight: "400", family: "Ubuntu", lineHeight: 34 },
  },
} as const;

export const radii = {
  button: 8,
  pill: 16,
  sidebar: 6,
  sheet: 12,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export function getColors(mode: ThemeMode): ThemeColors {
  return colors[mode];
}
