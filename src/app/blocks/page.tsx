"use client";

import { useState } from "react";
import { TrendingUp, BarChart3, GitFork, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/ui/MetricCard";
import { Panel } from "@/components/ui/Panel";
import { ChainSelect } from "@/components/ui/ChainSelect";
import { LineTrend } from "@/components/charts/LineTrend";
import { BarBlocks } from "@/components/charts/BarBlocks";
import { EmptyHint } from "@/components/ui/EmptyHint";
import { useLive } from "@/lib/swr";

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
  const [chainId, setChainId] = useState("ethereum");
  const { data, isLoading } = useLive<BlocksDetail>(`/api/chains/${chainId}/blocks`);

  return (
    <div>
      <PageHeader
        title="出块监控"
        subtitle="实时监控区块链网络的高度、出块间隔及最终性状态。"
        liveLabel="实时更新"
      />

      <div className="mb-5">
        <ChainSelect value={chainId} onChange={setChainId} />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="当前区块高度"
          value={fmtHeight(data?.latestHeight)}
          tone="brand"
          caption="最新高度"
          captionTone="brand"
        />
        <MetricCard
          label="平均出块时间"
          value={data?.avgBlockTime != null ? data.avgBlockTime.toFixed(2) : "—"}
          unit={data?.avgBlockTime != null ? "s" : undefined}
          tone="ok"
          caption="24h 平均值"
        />
        <MetricCard
          label="最终性确认时间"
          value={data?.finality ?? "—"}
          tone="ok"
          caption="链安全且活跃"
          numClassName="!text-[20px]"
        />
        <MetricCard
          label="24h 分叉检测"
          value={data?.reorgs24h ?? "—"}
          tone={data?.reorgs24h ? "warn" : "neutral"}
          caption={data?.reorgs24h ? "需关注" : "链稳定运行"}
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mt-5">
        <Panel
          className="col-span-2"
          title="出块时间趋势 (24h)"
          icon={<TrendingUp className="size-4 text-brand" strokeWidth={1.8} />}
        >
          {isLoading || !data ? (
            <EmptyHint loading />
          ) : data.trend.length === 0 ? (
            <EmptyHint empty />
          ) : (
            <LineTrend data={data.trend} yFormatter={(v) => `${v.toFixed(1)}s`} tooltipLabel="出块间隔" />
          )}
        </Panel>

        <Panel
          title={`最近 10 个区块耗时`}
          icon={<BarChart3 className="size-4 text-brand" strokeWidth={1.8} />}
        >
          {isLoading || !data ? (
            <EmptyHint loading />
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

      <div className="grid grid-cols-2 gap-4 mt-5">
        <Panel
          title="分叉详情分析"
          icon={<GitFork className="size-4 text-warn" strokeWidth={1.8} />}
        >
          <div className="grid grid-cols-2 gap-6 py-2">
            <Stat label="24h 分叉数量" value={data?.reorgs24h ?? 0} />
            <Stat
              label="最大分叉深度"
              value={data?.maxReorgDepth ?? 0}
              suffix="Blocks"
            />
          </div>
        </Panel>

        <Panel
          title="确认策略建议"
          icon={<ShieldCheck className="size-4 text-ok" strokeWidth={1.8} />}
        >
          {data ? (
            <div className="space-y-2 text-[13px] text-ink-mid leading-relaxed">
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

function Stat({ label, value, suffix }: { label: string; value: number | string; suffix?: string }) {
  return (
    <div>
      <div className="text-[11px] text-ink-low uppercase tracking-wider">{label}</div>
      <div className="num text-[28px] font-bold text-ink-high mt-2 leading-none">
        {value}{suffix ? <span className="text-[14px] text-ink-low font-normal ml-1">{suffix}</span> : null}
      </div>
    </div>
  );
}

function fmtHeight(s: string | null | undefined) {
  if (!s) return "—";
  const n = Number(s);
  if (!Number.isFinite(n)) return s;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return s;
}
