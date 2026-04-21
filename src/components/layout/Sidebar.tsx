"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  Receipt,
  Activity,
  Database,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import useSWR from "swr";
import { cn } from "@/lib/cn";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

const NAV = [
  { href: "/", label: "概览", Icon: LayoutDashboard },
  { href: "/blocks", label: "出块监控", Icon: Layers },
  { href: "/gas", label: "费用追踪", Icon: Receipt },
  { href: "/network", label: "网络负载", Icon: Activity },
  { href: "/nodes", label: "节点注册", Icon: Database },
  { href: "/alerts", label: "安全告警", Icon: ShieldAlert },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data } = useSWR<{ counts: { total: number; critical: number } }>(
    "/api/alerts",
    fetcher,
    { refreshInterval: 30_000 },
  );
  const alertBadge = data?.counts.critical || 0;

  return (
    <aside className="fixed inset-y-0 left-0 w-[220px] z-30 border-r border-line-subtle bg-bg-surface/70 backdrop-blur-xl px-4 pt-5 pb-6 flex flex-col">
      <div className="flex items-center gap-2 px-2">
        <ShieldCheck className="size-5 text-brand" strokeWidth={2.2} />
        <div className="leading-tight">
          <div className="text-[15px] font-bold text-ink-high">Web3View</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-ink-low">
            Management Console
          </div>
        </div>
      </div>

      <nav className="mt-7 flex-1 space-y-0.5">
        {NAV.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          const isAlerts = href === "/alerts";
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "nav-item underline-offset-4",
                active && "nav-item-active",
              )}
            >
              <Icon className="size-[15px]" strokeWidth={1.8} />
              <span className={cn(active && "underline")}>{label}</span>
              {isAlerts && alertBadge > 0 ? (
                <span className="ml-auto rounded-md bg-crit/20 text-crit px-1.5 py-0.5 text-[10px] font-bold num">
                  {alertBadge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="text-[10px] text-ink-faint pl-2.5">
        <div>v0.1.0 · standalone</div>
        <div className="mt-1">© Web3View / JadePool AI Agent</div>
      </div>
    </aside>
  );
}
