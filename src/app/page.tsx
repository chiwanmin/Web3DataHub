"use client";

import { Layers } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/ui/MetricCard";
import { Panel } from "@/components/ui/Panel";
import { ChainRow } from "@/components/cards/ChainRow";
import { EmptyHint } from "@/components/ui/EmptyHint";
import { useLive } from "@/lib/swr";

interface OverviewResp {
  total: number;
  healthy: number;
  warning: number;
  critical: number;
  rows: Array<{
    id: string;
    name: string;
    short: string;
    symbol: string;
    consensus: string;
    family: string;
    color: string;
    height: number | null;
    avgBlockTime: number | null;
    gasUsedRatio: number | null;
    status: "ok" | "warn" | "bad" | "stale";
    health: { score: number; level: "ok" | "warn" | "bad" };
  }>;
}

export default function Page() {
  const { data, isLoading } = useLive<OverviewResp>("/api/overview");

  return (
    <div>
      <PageHeader
        title="系统概览"
        subtitle="多区块链网络的实时监控与状态汇总。"
      />

      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="监控链数量"
          value={data?.total ?? "—"}
          tone="brand"
          caption="活跃中"
          captionTone="brand"
        />
        <MetricCard
          label="系统健康度"
          value={data?.healthy ?? "—"}
          tone="ok"
          caption="正常"
        />
        <MetricCard
          label="警告项目"
          value={data?.warning ?? "—"}
          tone="warn"
          caption="建议关注"
        />
        <MetricCard
          label="严重问题"
          value={data?.critical ?? "—"}
          tone="bad"
          caption="需要立即处理"
        />
      </div>

      <Panel
        className="mt-6"
        title="网络注册中心"
        icon={<Layers className="size-4 text-brand" strokeWidth={1.8} />}
        bodyClassName="p-0"
      >
        {isLoading || !data ? (
          <EmptyHint loading />
        ) : data.rows.length === 0 ? (
          <EmptyHint empty />
        ) : (
          <div>
            {data.rows.map((row) => (
              <ChainRow key={row.id} row={row} />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
