import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#3d4a35",
          100: "#48563e",
          300: "#a6924f",
          400: "#c9b467",
          500: "#e8d17a",
          600: "#e8d17a",
          700: "#f2e0a0",
        },
        ledger: {
          paper: "#2b3a34",
          paperMuted: "#3d4f47",
          surface: "#34453e",
          rule: "#eef0e64d",
          ruleSoft: "#eef0e626",
          ink: "#eef0e6",
          inkSoft: "#c3cdc6",
          inkFaint: "#93a89d",
          brass: "#e8d17a",
          brassLight: "#4a4527",
        },
      },
      fontFamily: {
        hand: ["var(--font-chalk-hand)", "cursive"],
        sans: ["var(--font-chalk-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-chalk-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
