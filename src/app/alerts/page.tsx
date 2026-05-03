"use client";

import { useState } from "react";
import {
  Bell,
  AlertOctagon,
  AlertTriangle,
  Info,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { EmptyHint } from "@/components/ui/EmptyHint";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { SkeletonAlertRow } from "@/components/ui/Skeleton";
import { useLive } from "@/lib/swr";
import { cn } from "@/lib/cn";

interface AlertItem {
  id: string;
  chainId: string;
  chainName: string;
  rule: string;
  severity: "critical" | "warning" | "info";
  title: string;
  body: string;
  triggeredAt: string;
  meta: Record<string, unknown> | null;
}

interface AlertsResp {
  counts: { total: number; critical: number; warning: number; info: number };
  items: AlertItem[];
}

const TABS = [
  { id: "all", label: "全部" },
  { id: "critical", label: "严重" },
  { id: "warning", label: "警告" },
  { id: "info", label: "信息" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AlertsPage() {
  const [tab, setTab] = useState<TabId>("all");
  const { data, isLoading, error } = useLive<AlertsResp>("/api/alerts");

  const filtered = data?.items.filter((a) => (tab === "all" ? true : a.severity === tab)) ?? [];

  return (
    <div>
      <PageHeader
        title="安全告警中心"
        subtitle="多链安全告警、确认数建议与 Reorg 历史监控。"
        liveLabel="实时监控"
      />

      {error ? (
        <ErrorBanner message={error.message} url="/api/alerts" />
      ) : isLoading || !data ? (
        <div className="grid grid-cols-4 gap-3 mb-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="panel p-3">
              <div className="h-3 w-14 bg-white/[0.04] animate-pulse rounded-sm" />
              <div className="mt-1.5 h-8 w-12 bg-white/[0.04] animate-pulse rounded-sm" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <CountBadge label="告警总数" value={data.counts.total} tone="brand" />
          <CountBadge label="严重" value={data.counts.critical} tone="bad" />
          <CountBadge label="警告" value={data.counts.warning} tone="warn" />
          <CountBadge label="信息" value={data.counts.info} tone="info" />
        </div>
      )}

      <Panel
        title="告警列表"
        icon={<Bell className="size-4 text-brand" strokeWidth={1.8} />}
        right={
          <div className="flex items-center gap-0.5 rounded bg-bg-panel p-0.5 ring-1 ring-line-subtle">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "px-2.5 py-1 text-[13px] rounded transition-colors",
                  tab === t.id
                    ? "bg-brand-soft text-brand"
                    : "text-ink-mid hover:text-ink-high",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        }
      >
        {error ? (
          <EmptyHint empty message="数据加载失败，请稍后重试" />
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonAlertRow key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyHint empty message={tab === "all" ? "当前所有链状态正常" : "无该级别告警"} />
        ) : (
          <div className="space-y-2">
            {filtered.map((a) => (
              <AlertItemRow key={a.id} a={a} />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function CountBadge({ label, value, tone }: { label: string; value: number; tone: string }) {
  const colorMap: Record<string, string> = {
    brand: "text-brand",
    ok: "text-ok",
    warn: "text-warn",
    bad: "text-bad",
    info: "text-info",
  };
  return (
    <div className="panel p-3">
      <div className="text-[12px] text-ink-low uppercase tracking-[0.1em] font-medium">{label}</div>
      <div className={`mt-1.5 num text-[26px] font-bold leading-none ${colorMap[tone] ?? "text-ink-high"}`}>
        {value}
      </div>
    </div>
  );
}

function AlertItemRow({ a }: { a: AlertItem }) {
  const palette = SEVERITY[a.severity];
  const Icon = palette.icon;

  const ageMin = Math.max(1, Math.round((Date.now() - new Date(a.triggeredAt).getTime()) / 60000));
  const ageText = ageMin < 60 ? `${ageMin} 分钟前` : ageMin < 1440 ? `${Math.round(ageMin / 60)} 小时前` : `${Math.round(ageMin / 1440)} 天前`;

  return (
    <div
      className={cn(
        "rounded-lg ring-1 px-4 py-3 transition-colors hover:bg-white/[0.02]",
        palette.ring,
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 flex size-6 items-center justify-center rounded", palette.iconWrap)}>
          <Icon className="size-3.5" strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 justify-between">
            <div className="text-[16px] font-bold text-ink-high">{a.title}</div>
            <span className={cn("pill ring-1", palette.pill)}>{palette.label}</span>
          </div>
          <div className="text-[13px] text-ink-mid mt-1">{a.body}</div>
          <div className="mt-2 flex items-center gap-2 text-[12px] uppercase tracking-wider">
            <span className="rounded bg-white/[0.03] px-1.5 py-0.5 text-ink-low ring-1 ring-line-subtle">
              {a.chainName}
            </span>
            <span className="text-ink-low">{ageText}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const SEVERITY = {
  critical: {
    label: "严重",
    icon: AlertOctagon,
    ring: "ring-crit/20 bg-crit/[0.03]",
    iconWrap: "bg-crit/12 text-crit",
    pill: "bg-crit/12 text-crit ring-crit/25",
  },
  warning: {
    label: "警告",
    icon: AlertTriangle,
    ring: "ring-warn/20 bg-warn/[0.02]",
    iconWrap: "bg-warn/12 text-warn",
    pill: "bg-warn/12 text-warn ring-warn/25",
  },
  info: {
    label: "信息",
    icon: Info,
    ring: "ring-info/18 bg-info/[0.02]",
    iconWrap: "bg-info/12 text-info",
    pill: "bg-info/12 text-info ring-info/25",
  },
} as const;
