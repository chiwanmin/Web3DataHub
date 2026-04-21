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
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold text-[10px] tracking-tight",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${color}33, ${color}11)`,
        color,
        boxShadow: `inset 0 0 0 1px ${color}55`,
      }}
    >
      {short.slice(0, 3)}
    </span>
  );
}
