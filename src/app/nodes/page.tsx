"use client";

import {
  Database,
  Calendar,
  Users,
  AlertTriangle,
  RefreshCw,
  Clock3,
  GitCommit,
  CircleDot,
  Star,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/ui/MetricCard";
import { Panel } from "@/components/ui/Panel";
import { ChainIcon } from "@/components/ui/ChainIcon";
import { EmptyHint } from "@/components/ui/EmptyHint";
import { useLive } from "@/lib/swr";
import { cn } from "@/lib/cn";

interface NodesResp {
  total: number;
  needUpdate: number;
  upToDate: number;
  hardForkPending: number;
  rows: Array<{
    chainId: string;
    name: string;
    color: string;
    client: string;
    currentVer: string;
    latestVer: string;
    releaseDate: string | null;
    isHardFork: boolean;
    status: "current" | "outdated" | "unknown";
  }>;
}

interface UpgradeItem {
  id: string;
  chainId: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  status: string;
  scheduledAt: string | null;
  walletImpact: string | null;
}

interface CommunityRow {
  chainId: string;
  name: string;
  color: string;
  stars: number;
  weeklyCommits: number;
  openIssues: number;
  activeDevs: number;
}

const SEVERITY_BADGE: Record<UpgradeItem["severity"], { label: string; cls: string }> = {
  critical: { label: "CRITICAL 影响", cls: "bg-crit/15 text-crit ring-crit/30" },
  high: { label: "HIGH 影响", cls: "bg-warn/15 text-warn ring-warn/30" },
  medium: { label: "MEDIUM 影响", cls: "bg-info/15 text-info ring-info/30" },
  low: { label: "LOW 影响", cls: "bg-ok/15 text-ok ring-ok/30" },
};

export default function NodesPage() {
  const { data: nodes, isLoading: l1 } = useLive<NodesResp>("/api/nodes");
  const { data: upgrades, isLoading: l2 } = useLive<UpgradeItem[]>("/api/nodes/upgrades");
  const { data: community, isLoading: l3 } = useLive<CommunityRow[]>("/api/nodes/community");

  return (
    <div>
      <PageHeader
        title="节点注册中心"
        subtitle="全链节点版本、网络升级时间线与社区健康度 · 实时监控"
        liveLabel="实时更新"
      />

      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="总链数"
          value={nodes?.total ?? "—"}
          tone="brand"
          caption="监控中"
        />
        <MetricCard
          label="需更新"
          value={nodes?.needUpdate ?? "—"}
          tone="warn"
          caption="节点需升级"
        />
        <MetricCard
          label="已最新"
          value={nodes?.upToDate ?? "—"}
          tone="ok"
          caption="版本已同步"
        />
        <MetricCard
          label="硬分叉待升级"
          value={nodes?.hardForkPending ?? "—"}
          tone="bad"
          caption="强制升级"
        />
      </div>

      <Panel
        className="mt-6"
        title="全链节点版本"
        icon={<Database className="size-4 text-brand" strokeWidth={1.8} />}
        bodyClassName="p-0"
      >
        {l1 || !nodes ? (
          <EmptyHint loading />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left table-head bg-white/[0.02]">
                  <th className="px-5 py-3">网络</th>
                  <th className="px-5 py-3">客户端</th>
                  <th className="px-5 py-3">当前版本</th>
                  <th className="px-5 py-3">最新版本</th>
                  <th className="px-5 py-3">状态</th>
                  <th className="px-5 py-3">发布日期</th>
                  <th className="px-5 py-3">硬分叉</th>
                </tr>
              </thead>
              <tbody>
                {nodes.rows.map((r) => (
                  <tr key={r.chainId} className="border-t border-line-subtle/60 hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <ChainIcon short={r.chainId.slice(0, 3).toUpperCase()} color={r.color} size={22} />
                        <span className="text-[13px] font-medium text-ink-high">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-ink-mid">{r.client}</td>
                    <td className={cn(
                      "px-5 py-3.5 num",
                      r.status === "current" ? "text-ok" : r.status === "outdated" ? "text-warn" : "text-ink-low",
                    )}>
                      {r.currentVer}
                    </td>
                    <td className="px-5 py-3.5 num text-ok">{r.latestVer}</td>
                    <td className="px-5 py-3.5">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="px-5 py-3.5 num text-ink-low">
                      {r.releaseDate ? new Date(r.releaseDate).toISOString().slice(0, 10) : "—"}
                    </td>
                    <td className={cn(
                      "px-5 py-3.5 num",
                      r.isHardFork ? "text-crit font-semibold" : "text-ink-low",
                    )}>
                      {r.isHardFork ? "是" : "否"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel
        className="mt-6"
        title="网络升级时间线"
        icon={<Calendar className="size-4 text-brand" strokeWidth={1.8} />}
      >
        {l2 ? (
          <EmptyHint loading />
        ) : !upgrades || upgrades.length === 0 ? (
          <EmptyHint empty />
        ) : (
          <div className="space-y-3">
            {upgrades.map((u) => (
              <UpgradeCard key={u.id} u={u} />
            ))}
          </div>
        )}
      </Panel>

      <Panel
        className="mt-6"
        title="社区健康度 (GitHub Metrics)"
        icon={<Users className="size-4 text-brand" strokeWidth={1.8} />}
      >
        {l3 ? (
          <EmptyHint loading />
        ) : !community || community.length === 0 ? (
          <EmptyHint empty />
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {community.map((c) => (
              <CommunityCard key={c.chainId} c={c} />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function StatusPill({ status }: { status: "current" | "outdated" | "unknown" }) {
  if (status === "current")
    return (
      <span className="pill bg-ok/10 text-ok ring-1 ring-ok/30">
        <CircleDot className="size-3" /> 已最新
      </span>
    );
  if (status === "outdated")
    return (
      <span className="pill bg-warn/10 text-warn ring-1 ring-warn/30">
        <RefreshCw className="size-3" /> 需更新
      </span>
    );
  return (
    <span className="pill bg-ink-faint/30 text-ink-low ring-1 ring-line-base">
      未知
    </span>
  );
}

function UpgradeCard({ u }: { u: UpgradeItem }) {
  const sev = SEVERITY_BADGE[u.severity] ?? SEVERITY_BADGE.medium;
  const date = u.scheduledAt ? new Date(u.scheduledAt) : null;
  return (
    <div className="rounded-lg ring-1 ring-line-subtle bg-bg-panel/40 px-5 py-4 hover:ring-line-strong transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-[14px] font-bold text-ink-high">
            <RefreshCw className="size-3.5 text-brand" />
            {u.chainId.toUpperCase()} — {u.title}
          </div>
          <p className="text-[12px] text-ink-mid mt-1.5">{u.description}</p>
          {u.walletImpact ? (
            <div className="mt-3 rounded-md bg-white/[0.02] ring-1 ring-line-subtle px-3 py-2.5">
              <div className="text-[10px] uppercase tracking-wider text-ink-low">钱包团队运维影响</div>
              <div className="text-[12px] text-ink-mid mt-1">{u.walletImpact}</div>
            </div>
          ) : null}
          <div className="mt-3 flex items-center gap-4 text-[11px] text-ink-low">
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {date ? date.toISOString().slice(0, 10) : "TBD"}
            </span>
            <span className="flex items-center gap-1">
              <Clock3 className="size-3" />
              ETA: {date ? `${Math.ceil((date.getTime() - Date.now()) / 86400000)} 天` : "TBD"}
            </span>
          </div>
        </div>
        <span className={cn("pill ring-1 shrink-0", sev.cls)}>{sev.label}</span>
      </div>
    </div>
  );
}

function CommunityCard({ c }: { c: CommunityRow }) {
  return (
    <div className="rounded-lg ring-1 ring-line-subtle bg-bg-panel/40 px-5 py-4">
      <div className="flex items-center gap-2.5">
        <ChainIcon short={c.chainId.slice(0, 3).toUpperCase()} color={c.color} size={22} />
        <div>
          <div className="text-[13px] font-bold text-ink-high">{c.name}</div>
          <div className="text-[10px] uppercase tracking-wider text-ink-low">
            GitHub Repo Health
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2.5 text-[12px]">
        <Row icon={<Star className="size-3.5" />} label="Stars" value={fmtK(c.stars)} />
        <Row icon={<GitCommit className="size-3.5" />} label="周提交" value={c.weeklyCommits} />
        <Row icon={<AlertTriangle className="size-3.5" />} label="开放 Issue" value={fmtK(c.openIssues)} />
        <Row icon={<Users className="size-3.5" />} label="活跃开发者" value={c.activeDevs} />
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-t border-line-subtle/60 first:border-t-0 pt-2.5 first:pt-0">
      <span className="flex items-center gap-1.5 text-ink-mid">
        <span className="text-ink-low">{icon}</span>
        {label}
      </span>
      <span className="num text-ink-high font-semibold">{value}</span>
    </div>
  );
}

function fmtK(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}
