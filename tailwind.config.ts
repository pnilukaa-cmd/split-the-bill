import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "var(--brand-50)",
          100: "var(--brand-100)",
          300: "var(--brand-300)",
          400: "var(--brand-400)",
          500: "var(--brand-500)",
          600: "var(--brand-600)",
          700: "var(--brand-700)",
          // Text color for content sitting on a brand-fill background (buttons,
          // active chips). Fixed rather than themed: brand-500/600 stays a
          // similar mid-light gold in both themes, so dark ink keeps working.
          ink: "#2b3a34",
        },
        ledger: {
          paper: "var(--ledger-paper)",
          paperMuted: "var(--ledger-paper-muted)",
          surface: "var(--ledger-surface)",
          rule: "var(--ledger-rule)",
          ruleSoft: "var(--ledger-rule-soft)",
          ink: "var(--ledger-ink)",
          inkSoft: "var(--ledger-ink-soft)",
          inkFaint: "var(--ledger-ink-faint)",
          brass: "var(--ledger-brass)",
          // Dedicated text/link accent, separate from the brand-* fill scale —
          // brand-600/700 stay light-gold for button fills in both themes, which
          // reads fine as a background but fails contrast as text on a light page.
          accent: "var(--ledger-accent)",
          negative: "var(--ledger-negative)",
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
