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
const toneDot: Record<MetricTone, string> = {
  brand: "bg-brand",
  ok: "bg-ok",
  warn: "bg-warn",
  bad: "bg-bad",
  info: "bg-info",
  neutral: "bg-ink-low",
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
      <div className="text-[11px] text-ink-low uppercase tracking-wider">{label}</div>
      <div className={cn("mt-3 num text-[34px] font-bold leading-none flex items-baseline gap-1.5", toneText[tone], numClassName)}>
        <span>{value}</span>
        {unit ? <span className="text-[14px] text-ink-low font-normal">{unit}</span> : null}
      </div>
      {caption ? (
        <div className="mt-3 flex items-center gap-1.5 text-[11px]">
          <span className={cn("inline-block size-1.5 rounded-full", toneDot[ct])} />
          <span className={cn(toneText[ct])}>{caption}</span>
        </div>
      ) : null}
    </div>
  );
}
