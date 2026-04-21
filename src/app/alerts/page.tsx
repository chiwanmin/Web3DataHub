"use client";

import { useState } from "react";
import {
  ShieldAlert,
  Bell,
  AlertOctagon,
  AlertTriangle,
  Info,
  Megaphone,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/ui/MetricCard";
import { Panel } from "@/components/ui/Panel";
import { EmptyHint } from "@/components/ui/EmptyHint";
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
  const { data, isLoading } = useLive<AlertsResp>("/api/alerts");

  const filtered = data?.items.filter((a) => (tab === "all" ? true : a.severity === tab)) ?? [];

  return (
    <div>
      <PageHeader
        title="安全告警中心"
        subtitle="多链安全告警、确认数建议与 Reorg 历史监控。"
        liveLabel="实时监控"
      />

      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="告警总数"
          value={data?.counts.total ?? "—"}
          tone="brand"
          caption="活跃告警"
        />
        <MetricCard
          label="严重告警"
          value={data?.counts.critical ?? "—"}
          tone="bad"
          caption="需立即处理"
        />
        <MetricCard
          label="警告"
          value={data?.counts.warning ?? "—"}
          tone="warn"
          caption="建议关注"
        />
        <MetricCard
          label="信息"
          value={data?.counts.info ?? "—"}
          tone="info"
          caption="参考信息"
        />
      </div>

      <Panel
        className="mt-6"
        title="告警列表"
        icon={<Bell className="size-4 text-brand" strokeWidth={1.8} />}
        right={
          <div className="flex items-center gap-1 rounded-md bg-bg-panel p-0.5 ring-1 ring-line-subtle">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "px-3 py-1 text-[12px] rounded transition-colors",
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
        {isLoading ? (
          <EmptyHint loading />
        ) : filtered.length === 0 ? (
          <EmptyHint empty message={tab === "all" ? "当前所有链状态正常" : "无该级别告警"} />
        ) : (
          <div className="space-y-2.5">
            {filtered.map((a) => (
              <AlertItemRow key={a.id} a={a} />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function AlertItemRow({ a }: { a: AlertItem }) {
  const palette = SEVERITY[a.severity];
  const Icon = palette.icon;
  const dueAt =
    a.rule === "hardfork_due" && a.meta && typeof a.meta === "object"
      ? null
      : null;

  const ageMin = Math.max(1, Math.round((Date.now() - new Date(a.triggeredAt).getTime()) / 60000));
  const ageText = ageMin < 60 ? `${ageMin} 分钟前` : ageMin < 1440 ? `${Math.round(ageMin / 60)} 小时前` : `${Math.round(ageMin / 1440)} 天前`;

  return (
    <div
      className={cn(
        "rounded-lg ring-1 px-4 py-3.5 transition-colors hover:bg-white/[0.02]",
        palette.ring,
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 flex size-7 items-center justify-center rounded-md", palette.iconWrap)}>
          <Icon className="size-4" strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 justify-between">
            <div className="text-[13px] font-bold text-ink-high">{a.title}</div>
            <span className={cn("pill ring-1", palette.pill)}>{palette.label}</span>
          </div>
          <div className="text-[12px] text-ink-mid mt-1.5">{a.body}</div>
          <div className="mt-2 flex items-center gap-3 text-[10px] uppercase tracking-wider">
            <span className="rounded bg-white/[0.03] px-1.5 py-0.5 text-ink-low ring-1 ring-line-subtle">
              {a.chainName}
            </span>
            <span className="text-ink-low">{ageText}</span>
            {dueAt}
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
    ring: "ring-crit/30 bg-crit/[0.04]",
    iconWrap: "bg-crit/15 text-crit",
    pill: "bg-crit/15 text-crit ring-crit/30",
  },
  warning: {
    label: "警告",
    icon: AlertTriangle,
    ring: "ring-warn/30 bg-warn/[0.03]",
    iconWrap: "bg-warn/15 text-warn",
    pill: "bg-warn/15 text-warn ring-warn/30",
  },
  info: {
    label: "信息",
    icon: Info,
    ring: "ring-info/25 bg-info/[0.03]",
    iconWrap: "bg-info/15 text-info",
    pill: "bg-info/15 text-info ring-info/30",
  },
} as const;

// keep imports tree-shakable
void Megaphone;
void ShieldAlert;
