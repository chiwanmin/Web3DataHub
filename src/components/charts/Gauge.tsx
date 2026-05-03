"use client";

import { cn } from "@/lib/cn";

export function Gauge({
  value,
  label,
  hint,
  className,
}: {
  value: number;
  label?: string;
  hint?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(1, value));
  const tone =
    pct < 0.5 ? "ok" : pct < 0.85 ? "warn" : "bad";
  const colorMap = {
    ok: "from-ok to-ok/70",
    warn: "from-warn to-warn/70",
    bad: "from-bad to-bad/70",
  } as const;
  const labelMap = { ok: "畅通", warn: "适中", bad: "拥堵" } as const;

  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <div className="flex items-center justify-between text-[13px] text-ink-low">
          <span>{label}</span>
          <span className="num text-ink-mid">{Math.round(pct * 100)}%</span>
        </div>
      ) : null}
      <div className="h-2.5 rounded-full bg-white/[0.04] overflow-hidden ring-1 ring-line-subtle">
        <div
          className={cn(
            "h-full bg-gradient-to-r transition-all duration-500 rounded-full",
            colorMap[tone],
          )}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[13px]">
        <span className={cn(
          tone === "ok" && "text-ok",
          tone === "warn" && "text-warn",
          tone === "bad" && "text-bad",
        )}>
          {labelMap[tone]} ({Math.round(pct * 100)}%)
        </span>
        {hint ? <span className="text-ink-low">{hint}</span> : null}
      </div>
    </div>
  );
}
