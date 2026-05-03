import { cn } from "@/lib/cn";

const bar = "bg-white/[0.04] animate-pulse rounded-sm";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn(bar, className)} />;
}

export function SkeletonMetricCard() {
  return (
    <div className="metric-card">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-3 h-9 w-20" />
      <Skeleton className="mt-3 h-3 w-20" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-line-subtle/60">
      <Skeleton className="size-7 rounded" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export function SkeletonChart({ height = 220 }: { height?: number }) {
  return (
    <div className="flex items-center justify-center" style={{ height }}>
      <Skeleton className="h-3/4 w-full rounded" />
    </div>
  );
}

export function SkeletonAlertRow() {
  return (
    <div className="rounded-lg ring-1 ring-line-subtle px-4 py-3">
      <div className="flex items-start gap-3">
        <Skeleton className="size-7 rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    </div>
  );
}
