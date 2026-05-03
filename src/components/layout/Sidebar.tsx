"use client";

import { useState } from "react";
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
  Menu,
  X,
} from "lucide-react";
import useSWR from "swr";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "@/components/providers/ThemeToggle";

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
  const [open, setOpen] = useState(false);
  const { data } = useSWR<{ counts: { total: number; critical: number } }>(
    "/api/alerts",
    fetcher,
    { refreshInterval: 30_000 },
  );
  const alertBadge = data?.counts.critical || 0;

  const navContent = (
    <nav className="mt-6 flex-1 space-y-0.5">
      {NAV.map(({ href, label, Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        const isAlerts = href === "/alerts";
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              "nav-item",
              active && "nav-item-active",
            )}
          >
            <Icon className="size-[15px]" strokeWidth={1.8} />
            <span>{label}</span>
            {isAlerts && alertBadge > 0 ? (
              <span className="ml-auto rounded bg-crit/15 text-crit px-1.5 py-0.5 text-[12px] font-bold num">
                {alertBadge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 flex items-center justify-center size-9 rounded-lg bg-bg-surface border border-line-subtle text-ink-mid hover:text-ink-high"
        aria-label="打开菜单"
      >
        <Menu className="size-4" strokeWidth={1.8} />
      </button>

      {open ? (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[200px] border-r border-line-subtle bg-bg-surface px-3 pt-4 pb-5 flex flex-col transition-transform duration-200",
          "lg:z-30 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-[18px] text-brand" strokeWidth={2} />
            <div className="leading-tight">
              <div className="text-[17px] font-bold text-ink-high">Web3View</div>
              <div className="text-[12px] uppercase tracking-[0.15em] text-ink-low">
                Console
              </div>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden flex items-center justify-center size-7 rounded text-ink-mid hover:text-ink-high"
            aria-label="关闭菜单"
          >
            <X className="size-4" strokeWidth={1.8} />
          </button>
        </div>

        {navContent}

        <div className="flex items-center justify-between px-2">
          <div className="text-[12px] text-ink-faint">
            <div>v0.1.0</div>
          </div>
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}
