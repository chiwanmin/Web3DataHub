import type { CSSProperties } from "react";

const light: CSSProperties = {
  background: "#ffffff",
  border: "1px solid rgba(59,125,224,0.25)",
  borderRadius: 6,
  fontSize: 12,
  color: "#131a26",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
};

const dark: CSSProperties = {
  background: "#131924",
  border: "1px solid rgba(94,158,255,0.18)",
  borderRadius: 6,
  fontSize: 12,
  color: "#e8eef4",
};

export function chartTooltipStyle(theme: "light" | "dark"): CSSProperties {
  return theme === "light" ? light : dark;
}
