import { LiveBadge } from "./LiveBadge";

export function PageHeader({
  title,
  subtitle,
  right,
  liveLabel,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  liveLabel?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-ink-high leading-none">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-[14px] text-ink-mid mt-1.5">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-3 pt-0.5">
        {right}
        <LiveBadge label={liveLabel ?? "实时状态"} />
      </div>
    </div>
  );
}
