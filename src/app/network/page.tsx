"use client";

import { useState } from "react";
import {
  Activity,
  BarChart3,
  GaugeCircle,
  Info,
  Code2,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/ui/MetricCard";
import { Panel } from "@/components/ui/Panel";
import { ChainSelect } from "@/components/ui/ChainSelect";
import { LineTrend } from "@/components/charts/LineTrend";
import { BarBlocks } from "@/components/charts/BarBlocks";
import { HBarCompare } from "@/components/charts/HBarCompare";
import { Gauge } from "@/components/charts/Gauge";
import { EmptyHint } from "@/components/ui/EmptyHint";
import { useLive } from "@/lib/swr";

interface LoadDetail {
  chain: { id: string; name: string; family: string };
  avgTx: number;
  gasUsedRatio: number | null;
  avgSize: number | null;
  pendingPool: number | null;
  tps: number;
  txTrend: { t: string; v: number }[];
  gasTrend: { t: string; v: number }[];
  recentBars: { label: string; value: number }[];
  compare: { chainId: string; name: string; color: string; avgTx: number }[];
}

const RPC_REFERENCE = [
  {
    method: "eth_getBlockByNumber",
    params: '("latest", false)',
    use: "区块头 + txCount，不含交易详情",
    weight: "极轻",
  },
  {
    method: "eth_gasPrice",
    params: "()",
    use: "当前推荐 Gas 价格",
    weight: "极轻",
  },
  {
    method: "eth_feeHistory",
    params: "(10, latest, [25,50,75])",
    use: "最近 10 块的费用分位数分布",
    weight: "轻",
  },
  {
    method: "getblockcount / getblockheader",
    params: "(BTC)",
    use: "Bitcoin 区块高度与 nTx",
    weight: "极轻",
  },
  {
    method: "getRecentPerformanceSamples",
    params: "(SOL, 1)",
    use: "Solana 内置 TPS 采样",
    weight: "极轻",
  },
];

export default function NetworkPage() {
  const [chainId, setChainId] = useState("ethereum");
  const { data, isLoading } = useLive<LoadDetail>(`/api/chains/${chainId}/load`);

  return (
    <div>
      <PageHeader
        title="网络负载分析"
        subtitle="基于区块头的链上负载与拥堵监控 · 无需解析交易内容"
        liveLabel="实时更新"
        right={<ChainSelect value={chainId} onChange={setChainId} />}
      />

      <Panel className="mb-5 border-info/30 bg-gradient-to-br from-info/[0.06] to-transparent" bodyClassName="p-4 px-5">
        <div className="flex items-start gap-3 text-[12px] text-ink-mid">
          <Info className="size-4 text-info shrink-0 mt-0.5" />
          <span>
            数据源：<span className="text-ink-high font-semibold">区块头 (Block Header)</span> —
            所有指标均通过 <code className="px-1.5 py-0.5 rounded bg-white/5 text-brand text-[11px]">eth_getBlockByNumber(N, false)</code> 等轻量级调用采集，
            旨在提供低延迟的系统级洞察。
          </span>
        </div>
      </Panel>

      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="每块交易数 (Avg)"
          value={data?.avgTx ?? "—"}
          tone="brand"
          caption="平均每个区块包含的交易量"
        />
        <MetricCard
          label="Gas 使用率"
          value={data?.gasUsedRatio != null ? `${Math.round(data.gasUsedRatio * 100)}%` : "N/A"}
          tone="brand"
          caption="15.3M / 30.0M"
        />
        <MetricCard
          label="平均区块大小"
          value={data?.avgSize ?? "—"}
          unit={data?.avgSize != null ? "KB" : undefined}
          tone="brand"
          caption="区块头大小数据节字节"
        />
        <MetricCard
          label="待确认交易池"
          value={data?.pendingPool != null ? fmtNum(data.pendingPool) : "—"}
          tone="brand"
          caption="Mempool 待挖打包队列深度"
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mt-5">
        <Panel
          className="col-span-2"
          title="网络拥堵指数"
          icon={<GaugeCircle className="size-4 text-brand" strokeWidth={1.8} />}
        >
          <Gauge
            value={data?.gasUsedRatio ?? 0}
            label="基于 gasUsed/gasLimit 指标"
          />
        </Panel>

        <Panel
          title="推算 TPS (Derived)"
          icon={<Activity className="size-4 text-brand" strokeWidth={1.8} />}
        >
          <div className="flex flex-col items-start py-2">
            <div className="num text-[40px] font-bold text-brand leading-none">
              {data?.tps ?? "—"}
            </div>
            <div className="text-[11px] text-ink-low mt-3">
              基于每块交易数 / 平均出块时间
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-5">
        <Panel
          title="最近 10 个区块分布"
          icon={<BarChart3 className="size-4 text-brand" strokeWidth={1.8} />}
        >
          {isLoading || !data ? (
            <EmptyHint loading />
          ) : data.recentBars.length === 0 ? (
            <EmptyHint empty />
          ) : (
            <BarBlocks data={data.recentBars} tooltipLabel="TX 数" />
          )}
        </Panel>

        <Panel
          title="主流网络每块交易数对比"
          icon={<TrendingUp className="size-4 text-brand" strokeWidth={1.8} />}
        >
          {isLoading || !data ? (
            <EmptyHint loading />
          ) : data.compare.length === 0 ? (
            <EmptyHint empty />
          ) : (
            <HBarCompare
              data={data.compare.map((c) => ({
                name: c.name,
                value: c.avgTx,
                color: c.color,
              }))}
            />
          )}
        </Panel>
      </div>

      <Panel
        className="mt-5"
        title="24 小时交易趋势 (每区块)"
        icon={<TrendingUp className="size-4 text-brand" strokeWidth={1.8} />}
      >
        {isLoading || !data ? (
          <EmptyHint loading />
        ) : data.txTrend.length === 0 ? (
          <EmptyHint empty />
        ) : (
          <LineTrend
            data={data.txTrend}
            yFormatter={(v) => v.toFixed(0)}
            tooltipLabel="TX 数"
            height={200}
          />
        )}
      </Panel>

      <Panel
        className="mt-5"
        title="24 小时 Gas 使用率趋势 (EVM)"
        icon={<Activity className="size-4 text-brand" strokeWidth={1.8} />}
      >
        {isLoading || !data ? (
          <EmptyHint loading />
        ) : data.gasTrend.length === 0 ? (
          <EmptyHint empty message="非 EVM 链或数据采集中" />
        ) : (
          <LineTrend
            data={data.gasTrend.map((p) => ({ t: p.t, v: p.v * 100 }))}
            yFormatter={(v) => `${v.toFixed(0)}%`}
            tooltipLabel="Gas 使用率"
            height={200}
          />
        )}
      </Panel>

      <Panel
        className="mt-5"
        title="数据采集协议 — 轻量级 RPC 调用参考"
        icon={<Code2 className="size-4 text-brand" strokeWidth={1.8} />}
      >
        <div className="overflow-hidden rounded-lg ring-1 ring-line-subtle">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left table-head bg-white/[0.02]">
                <th className="px-4 py-2.5">RPC 方法</th>
                <th className="px-4 py-2.5">参数</th>
                <th className="px-4 py-2.5">采集要点</th>
                <th className="px-4 py-2.5">性能影响</th>
              </tr>
            </thead>
            <tbody>
              {RPC_REFERENCE.map((r) => (
                <tr key={r.method + r.params} className="border-t border-line-subtle/60">
                  <td className="px-4 py-3 font-mono text-brand">{r.method}</td>
                  <td className="px-4 py-3 font-mono text-ink-mid">{r.params}</td>
                  <td className="px-4 py-3 text-ink-mid">{r.use}</td>
                  <td className="px-4 py-3 text-ok font-medium">{r.weight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}
