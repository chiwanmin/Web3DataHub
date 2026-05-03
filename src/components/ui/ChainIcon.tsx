import { cn } from "@/lib/cn";

export function ChainIcon({
  short,
  color,
  size = 28,
  className,
}: {
  short: string;
  color: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded font-bold text-[12px] tracking-tight bg-white/[0.06]",
        className,
      )}
      style={{
        width: size,
        height: size,
        color,
      }}
    >
      {short.slice(0, 3)}
    </span>
  );
}
