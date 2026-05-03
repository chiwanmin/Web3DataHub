export function fmtHeight(h: string | number | null | undefined) {
  if (h == null) return "—";
  const n = typeof h === "string" ? Number(h) : h;
  if (!Number.isFinite(n)) return String(h);
  return n.toLocaleString("en-US");
}

export function fmtTime(t: number | null | undefined) {
  if (t == null) return "—";
  if (t < 1) return `${(t * 1000).toFixed(0)}ms`;
  return `${t.toFixed(2)}s`;
}

export function fmtRatio(r: number | null | undefined) {
  if (r == null) return "N/A";
  return `${Math.round(r * 100)}%`;
}

export function fmtNum(n: number | null | undefined) {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export function fmtBig(n: number) {
  if (!Number.isFinite(n) || n === 0) return "0";
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(2);
}

export function fmtK(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}
