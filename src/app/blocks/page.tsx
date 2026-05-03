"use client";

import { useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TrendingUp, BarChart3, GitFork, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { ChainSelect } from "@/components/ui/ChainSelect";
import { LineTrend } from "@/components/charts/LineTrend";
import { BarBlocks } from "@/components/charts/BarBlocks";
import { EmptyHint } from "@/components/ui/EmptyHint";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { SkeletonChart } from "@/components/ui/Skeleton";
import { useLive } from "@/lib/swr";
import { fmtHeight } from "@/lib/format";

interface BlocksDetail {
  chain: { id: string; name: string; short: string; symbol: string; finality: string };
  latestHeight: string | null;
  avgBlockTime: number | null;
  finality: string;
  reorgs24h: number;
  maxReorgDepth: number;
  trend: { t: string; v: number }[];
  recentBars: { label: string; value: number; height: string }[];
  suggestedConfirmations: number;
}

export default function BlocksPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [chainId, setChainId] = useState(searchParams.get("chain") || "ethereum");
  const url = `/api/chains/${chainId}/blocks`;

  const handleChainChange = useCallback(
    (id: string) => {
      setChainId(id);
      const params = new URLSearchParams(searchParams);
      params.set("chain", id);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router],
  );
  const { data, isLoading, error } = useLive<BlocksDetail>(url);

  return (
    <div>
      <PageHeader
        title="出块监控"
        subtitle="实时监控区块链网络的高度、出块间隔及最终性状态。"
        liveLabel="实时更新"
        right={<ChainSelect value={chainId} onChange={handleChainChange} />}
      />

      {error ? (
        <ErrorBanner message={error.message} url={url} />
      ) : isLoading || !data ? (
        <div className="grid grid-cols-4 gap-3 mb-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="panel p-3">
              <div className="h-3 w-16 bg-white/[0.04] animate-pulse rounded-sm" />
              <div className="mt-2 h-8 w-20 bg-white/[0.04] animate-pulse rounded-sm" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <Stat label="区块高度" value={fmtHeight(data.latestHeight)} tone="brand" />
          <Stat
            label="平均出块时间"
            value={data.avgBlockTime != null ? `${data.avgBlockTime.toFixed(2)}s` : "—"}
            tone="ok"
          />
          <Stat label="最终性确认" value={data.finality ?? "—"} tone="ok" />
          <Stat
            label="24h 分叉"
            value={String(data.reorgs24h)}
            tone={data.reorgs24h ? "warn" : "ok"}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel
          className="lg:col-span-2"
          title="出块时间趋势 (24h)"
          icon={<TrendingUp className="size-4 text-brand" strokeWidth={1.8} />}
        >
          {error ? (
            <EmptyHint empty message="加载失败" />
          ) : isLoading || !data ? (
            <SkeletonChart />
          ) : data.trend.length === 0 ? (
            <EmptyHint empty />
          ) : (
            <LineTrend data={data.trend} yFormatter={(v) => `${v.toFixed(1)}s`} tooltipLabel="出块间隔" />
          )}
        </Panel>

        <Panel
          title="最近 10 个区块耗时"
          icon={<BarChart3 className="size-4 text-brand" strokeWidth={1.8} />}
        >
          {error ? (
            <EmptyHint empty message="加载失败" />
          ) : isLoading || !data ? (
            <SkeletonChart />
          ) : data.recentBars.length === 0 ? (
            <EmptyHint empty />
          ) : (
            <BarBlocks
              data={data.recentBars}
              yFormatter={(v) => `${v.toFixed(1)}s`}
              tooltipLabel="耗时"
            />
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <Panel
          title="分叉详情分析"
          icon={<GitFork className="size-4 text-warn" strokeWidth={1.8} />}
        >
          {error ? (
            <EmptyHint empty message="加载失败" />
          ) : !data ? (
            <EmptyHint loading />
          ) : (
            <div className="grid grid-cols-2 gap-6 py-1">
              <DetailStat label="24h 分叉数量" value={data.reorgs24h} />
              <DetailStat label="最大分叉深度" value={data.maxReorgDepth} suffix="Blocks" />
            </div>
          )}
        </Panel>

        <Panel
          title="确认策略建议"
          icon={<ShieldCheck className="size-4 text-ok" strokeWidth={1.8} />}
        >
          {error ? (
            <EmptyHint empty message="加载失败" />
          ) : data ? (
            <div className="space-y-2 text-[14px] text-ink-mid leading-relaxed">
              <p>
                针对 <span className="text-brand font-semibold">{data.chain.name}</span>
                {" "}网络，当前系统配置的确认数为
                <span className="num text-ink-high font-semibold mx-1">
                  {data.suggestedConfirmations}
                </span>
                。
              </p>
              <p>
                为保障资金安全并节省提币时间，链重组风险时建议提升至
                <span className="num text-warn font-semibold mx-1">
                  {Math.round(data.suggestedConfirmations * 1.5)}
                </span>
                。
              </p>
              <p className="pt-1 text-ink-low">
                当前网络安全综合评估状态：
                <span className="text-ok font-medium ml-1">
                  {data.reorgs24h === 0 ? "低风险" : data.reorgs24h < 3 ? "中风险" : "高风险"}
                </span>
              </p>
            </div>
          ) : (
            <EmptyHint loading />
          )}
        </Panel>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  const colorMap: Record<string, string> = {
    brand: "text-brand",
    ok: "text-ok",
    warn: "text-warn",
    bad: "text-bad",
    neutral: "text-ink-high",
  };
  return (
    <div className="panel p-3">
      <div className="text-[12px] text-ink-low uppercase tracking-[0.1em] font-medium">{label}</div>
      <div className={`mt-1.5 num text-[24px] font-bold leading-none ${colorMap[tone] ?? "text-ink-high"}`}>
        {value}
      </div>
    </div>
  );
}

function DetailStat({ label, value, suffix }: { label: string; value: number | string; suffix?: string }) {
  return (
    <div>
      <div className="text-[12px] text-ink-low uppercase tracking-wider">{label}</div>
      <div className="num text-[31px] font-bold text-ink-high mt-1.5 leading-none">
        {value}{suffix ? <span className="text-[16px] text-ink-low font-normal ml-1">{suffix}</span> : null}
      </div>
    </div>
  );
}
