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
    <div className="flex items-start justify-between gap-4 mb-7">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-ink-high leading-none">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-[13px] text-ink-mid mt-2">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-3 pt-1">
        {right}
        <LiveBadge label={liveLabel ?? "实时状态"} />
      </div>
    </div>
  );
}
