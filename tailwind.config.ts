import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#e2ebe4",
          100: "#cddfd2",
          400: "#5c8d72",
          500: "#2c6b50",
          600: "#1f5c43",
          700: "#163f2e",
        },
        ledger: {
          paper: "#eff1e5",
          paperMuted: "#e2e6d5",
          rule: "#c3d0bb",
          ruleSoft: "#d7ddc9",
          ink: "#1c241f",
          inkSoft: "#5c6357",
          inkFaint: "#8d9285",
          brass: "#9c7a2c",
          brassLight: "#f1e9d3",
        },
      },
      fontFamily: {
        serif: ["var(--font-ledger-serif)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
