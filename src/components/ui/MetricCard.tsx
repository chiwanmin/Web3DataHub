import { cn } from "@/lib/cn";

export type MetricTone = "brand" | "ok" | "warn" | "bad" | "info" | "neutral";

const toneText: Record<MetricTone, string> = {
  brand: "text-brand",
  ok: "text-ok",
  warn: "text-warn",
  bad: "text-bad",
  info: "text-info",
  neutral: "text-ink-high",
};

export function MetricCard({
  label,
  value,
  unit,
  caption,
  tone = "neutral",
  captionTone,
  numClassName,
}: {
  label: string;
  value: React.ReactNode;
  unit?: React.ReactNode;
  caption?: React.ReactNode;
  tone?: MetricTone;
  captionTone?: MetricTone;
  numClassName?: string;
}) {
  const ct = captionTone ?? tone;
  return (
    <div className="metric-card">
      <div className="text-[12px] text-ink-low uppercase tracking-[0.1em] font-medium">{label}</div>
      <div className={cn("mt-2 num text-[34px] font-bold leading-none flex items-baseline gap-1", toneText[tone], numClassName)}>
        <span>{value}</span>
        {unit ? <span className="text-[14px] text-ink-low font-normal">{unit}</span> : null}
      </div>
      {caption ? (
        <div className="mt-2 text-[13px] text-ink-mid">{caption}</div>
      ) : null}
    </div>
  );
}
