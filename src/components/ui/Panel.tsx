import { cn } from "@/lib/cn";

export function Panel({
  title,
  icon,
  right,
  className,
  bodyClassName,
  children,
}: {
  title?: React.ReactNode;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("panel", className)}>
      {(title || right) && (
        <header className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-line-subtle">
          <div className="flex items-center gap-2 text-[14px] font-semibold text-ink-high">
            {icon}
            <span>{title}</span>
          </div>
          {right}
        </header>
      )}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}
