import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#070b12",
          surface: "#0c1320",
          panel: "#101a2a",
          elevated: "#13202f",
        },
        line: {
          subtle: "rgba(34,211,238,0.08)",
          base: "rgba(148,163,184,0.12)",
          strong: "rgba(34,211,238,0.25)",
        },
        ink: {
          high: "#e6f1ff",
          mid: "#9ab0c6",
          low: "#5a6f86",
          faint: "#3b4a5c",
        },
        brand: {
          DEFAULT: "#22d3ee",
          soft: "rgba(34,211,238,0.12)",
          glow: "rgba(34,211,238,0.35)",
        },
        ok: "#34d399",
        warn: "#fbbf24",
        bad: "#fb7185",
        crit: "#f43f5e",
        info: "#60a5fa",
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
        panel: "0 1px 0 rgba(255,255,255,0.03) inset, 0 0 0 1px rgba(34,211,238,0.06)",
        glow: "0 0 24px rgba(34,211,238,0.18)",
      },
      backgroundImage: {
        "panel-grad":
          "linear-gradient(180deg, rgba(34,211,238,0.04) 0%, rgba(34,211,238,0) 60%)",
        "metric-grad":
          "linear-gradient(180deg, rgba(34,211,238,0.06) 0%, rgba(34,211,238,0) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
