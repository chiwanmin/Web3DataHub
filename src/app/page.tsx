"use client";

import { Layers } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/ui/MetricCard";
import { Panel } from "@/components/ui/Panel";
import { ChainRow } from "@/components/cards/ChainRow";
import { EmptyHint } from "@/components/ui/EmptyHint";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { SkeletonMetricCard, SkeletonRow } from "@/components/ui/Skeleton";
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
  const { data, isLoading, error } = useLive<OverviewResp>("/api/overview");

  return (
    <div>
      <PageHeader
        title="系统概览"
        subtitle="多区块链网络的实时监控与状态汇总。"
      />

      {error ? (
        <ErrorBanner message={error.message} url="/api/overview" />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {isLoading || !data ? (
            <>
              <SkeletonMetricCard />
              <SkeletonMetricCard />
              <SkeletonMetricCard />
              <SkeletonMetricCard />
            </>
          ) : (
            <>
              <MetricCard
                label="监控链数量"
                value={data.total}
                tone="brand"
                caption="活跃中"
              />
              <MetricCard
                label="系统健康度"
                value={data.healthy}
                tone="ok"
                caption="正常"
              />
              <MetricCard
                label="警告项目"
                value={data.warning}
                tone="warn"
                caption="建议关注"
              />
              <MetricCard
                label="严重问题"
                value={data.critical}
                tone="bad"
                caption="需要立即处理"
              />
            </>
          )}
        </div>
      )}

      <Panel
        className="mt-5"
        title="网络注册中心"
        icon={<Layers className="size-4 text-brand" strokeWidth={1.8} />}
        bodyClassName="p-0"
      >
        {error ? (
          <EmptyHint empty message="数据加载失败，请稍后重试" />
        ) : isLoading || !data ? (
          <div>
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
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
