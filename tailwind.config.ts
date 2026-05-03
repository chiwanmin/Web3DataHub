import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          base: "var(--bg-base, #090d13)",
          surface: "var(--bg-surface, #0e131c)",
          panel: "var(--bg-panel, #131924)",
          elevated: "var(--bg-elevated, #18202e)",
        },
        line: {
          subtle: "var(--line-subtle, rgba(138,153,172,0.08))",
          base: "var(--line-base, rgba(138,153,172,0.14))",
          strong: "var(--line-strong, rgba(94,158,255,0.2))",
        },
        ink: {
          high: "var(--ink-high, #e8eef4)",
          mid: "var(--ink-mid, #8a99ac)",
          low: "var(--ink-low, #59687d)",
          faint: "var(--ink-faint, #374357)",
        },
        brand: {
          DEFAULT: "var(--brand, #5e9eff)",
          soft: "var(--brand-soft, rgba(94,158,255,0.1))",
          glow: "var(--brand-glow, rgba(94,158,255,0.2))",
        },
        ok: "var(--ok, #3da580)",
        warn: "var(--warn, #c99540)",
        bad: "var(--bad, #c05a6e)",
        crit: "var(--crit, #d4485a)",
        info: "var(--info, #5e9eff)",
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
        ],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        glow: "0 0 18px rgba(94,158,255,0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
