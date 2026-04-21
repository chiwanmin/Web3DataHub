import { cn } from "@/lib/cn";

export function Gauge({
  value,
  label,
  hint,
  className,
}: {
  /** 0..1 */
  value: number;
  label?: string;
  hint?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(1, value));
  const tone =
    pct < 0.5 ? "ok" : pct < 0.85 ? "warn" : "bad";
  const colorMap = {
    ok: "from-ok to-ok/60",
    warn: "from-warn to-warn/60",
    bad: "from-bad to-bad/60",
  } as const;
  const labelMap = { ok: "畅通", warn: "适中", bad: "拥堵" } as const;

  return (
    <div className={cn("space-y-2.5", className)}>
      {label ? (
        <div className="flex items-center justify-between text-[11px] text-ink-low">
          <span>{label}</span>
          <span className="num text-ink-mid">{Math.round(pct * 100)}%</span>
        </div>
      ) : null}
      <div className="h-3 rounded-full bg-white/[0.04] overflow-hidden ring-1 ring-line-subtle">
        <div
          className={cn(
            "h-full bg-gradient-to-r transition-all duration-500 rounded-full",
            colorMap[tone],
          )}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px]">
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
