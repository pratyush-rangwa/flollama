// NativeWind can't import src/theme.ts directly (it's loaded by Metro/Node,
// not the RN bundler's TS pipeline), so these values are a literal mirror of
// the `colors` export in src/theme.ts. If you touch one, touch the other.
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        light: {
          text: "#1c1c1c",
          "secondary-text": "rgba(28,28,28,0.6)",
          "tertiary-text": "rgba(0,0,0,0.4)",
          background: "#f5f5f5",
          primary: "#121212",
          secondary: "#e4eef1",
          tertiary: "#eaf0f5",
          accent: "#5354a2",
          stroke: "rgba(28,28,28,0.1)",
          logicon: "#3d3d3d",
          dangerous: "#ba1c1c",
          "dangerous-text": "#dc2828",
          "popup-background": "#f1f5f9",
          "hover-background": "#eaf0f5",
        },
        dark: {
          text: "#e6e6e6",
          "secondary-text": "rgba(255,255,255,0.6)",
          "tertiary-text": "rgba(255,255,255,0.4)",
          // OVERRIDE — web uses #1c1c1c, mobile uses #141414 per Figma
          background: "#141414",
          primary: "#f0f8ff",
          secondary: "#292929",
          tertiary: "#2e2e2e",
          accent: "#c6c7f8",
          stroke: "rgba(255,255,255,0.1)",
          logicon: "#c2c2c2",
          dangerous: "#811d1d",
          "dangerous-text": "#ba1c1c",
          "popup-background": "#292929",
          "hover-background": "#333333",
        },
      },
      fontFamily: {
        inter: ["Inter_400Regular"],
        "inter-medium": ["Inter_500Medium"],
        "inter-semibold": ["Inter_600SemiBold"],
        "inter-bold": ["Inter_700Bold"],
        poppins: ["Poppins_400Regular"],
        "poppins-medium": ["Poppins_500Medium"],
        "poppins-bold": ["Poppins_700Bold"],
        ubuntu: ["Ubuntu_400Regular"],
        "ubuntu-medium": ["Ubuntu_500Medium"],
        "ubuntu-bold": ["Ubuntu_700Bold"],
      },
      borderRadius: {
        button: "8px",
        pill: "16px",
        sidebar: "6px",
        sheet: "12px",
      },
    },
  },
  plugins: [],
};
