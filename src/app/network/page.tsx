"use client";

import { useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  GaugeCircle,
  Info,
  Code2,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { ChainSelect } from "@/components/ui/ChainSelect";
import { LineTrend } from "@/components/charts/LineTrend";
import { BarBlocks } from "@/components/charts/BarBlocks";
import { HBarCompare } from "@/components/charts/HBarCompare";
import { Gauge } from "@/components/charts/Gauge";
import { EmptyHint } from "@/components/ui/EmptyHint";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { SkeletonChart } from "@/components/ui/Skeleton";
import { useLive } from "@/lib/swr";
import { fmtNum } from "@/lib/format";

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
  { method: "eth_getBlockByNumber", params: '("latest", false)', use: "区块头 + txCount，不含交易详情", weight: "极轻" },
  { method: "eth_gasPrice", params: "()", use: "当前推荐 Gas 价格", weight: "极轻" },
  { method: "eth_feeHistory", params: "(10, latest, [25,50,75])", use: "最近 10 块的费用分位数分布", weight: "轻" },
  { method: "getblockcount / getblockheader", params: "(BTC)", use: "Bitcoin 区块高度与 nTx", weight: "极轻" },
  { method: "getRecentPerformanceSamples", params: "(SOL, 1)", use: "Solana 内置 TPS 采样", weight: "极轻" },
];

export default function NetworkPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [chainId, setChainId] = useState(searchParams.get("chain") || "ethereum");
  const url = `/api/chains/${chainId}/load`;

  const handleChainChange = useCallback(
    (id: string) => {
      setChainId(id);
      const params = new URLSearchParams(searchParams);
      params.set("chain", id);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router],
  );
  const { data, isLoading, error } = useLive<LoadDetail>(url);

  return (
    <div>
      <PageHeader
        title="网络负载分析"
        subtitle="基于区块头的链上负载与拥堵监控 · 无需解析交易内容"
        liveLabel="实时更新"
        right={<ChainSelect value={chainId} onChange={handleChainChange} />}
      />

      <div className="flex items-start gap-3 rounded-lg border border-info/20 bg-info/[0.03] px-4 py-3 mb-5 text-[13px] text-ink-mid">
        <Info className="size-4 text-info shrink-0 mt-0.5" />
        <span>
          数据源：<span className="text-ink-high font-semibold">区块头 (Block Header)</span> —
          所有指标均通过 <code className="px-1 py-0.5 rounded bg-white/[0.04] text-brand text-[12px]">eth_getBlockByNumber(N, false)</code> 等轻量级调用采集，
          旨在提供低延迟的系统级洞察。
        </span>
      </div>

      {error ? (
        <ErrorBanner message={error.message} url={url} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
          <Panel
            title="网络拥堵指数"
            icon={<GaugeCircle className="size-4 text-brand" strokeWidth={1.8} />}
          >
            {isLoading || !data ? (
              <div className="space-y-2">
                <div className="h-3 w-full bg-white/[0.04] animate-pulse rounded-sm" />
                <div className="h-3 w-full bg-white/[0.04] animate-pulse rounded-sm" />
              </div>
            ) : (
              <Gauge value={data.gasUsedRatio ?? 0} label="基于 gasUsed/gasLimit 指标" />
            )}
          </Panel>

          <div className="space-y-4">
            {isLoading || !data ? (
              <>
                <div className="panel p-3">
                  <div className="h-3 w-20 bg-white/[0.04] animate-pulse rounded-sm" />
                  <div className="mt-2 h-8 w-24 bg-white/[0.04] animate-pulse rounded-sm" />
                </div>
                <div className="panel p-3">
                  <div className="h-3 w-20 bg-white/[0.04] animate-pulse rounded-sm" />
                  <div className="mt-2 h-8 w-24 bg-white/[0.04] animate-pulse rounded-sm" />
                </div>
              </>
            ) : (
              <>
                <div className="panel p-3">
                  <div className="text-[12px] text-ink-low uppercase tracking-[0.1em] font-medium">推导 TPS</div>
                  <div className="num text-[34px] font-bold text-brand leading-none mt-1.5">
                    {data.tps ?? "—"}
                  </div>
                </div>
                <div className="panel p-3">
                  <div className="text-[12px] text-ink-low uppercase tracking-[0.1em] font-medium">待确认交易池</div>
                  <div className="num text-[34px] font-bold text-ink-high leading-none mt-1.5">
                    {fmtNum(data.pendingPool)}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="space-y-4">
            {isLoading || !data ? (
              <>
                <div className="panel p-3">
                  <div className="h-3 w-20 bg-white/[0.04] animate-pulse rounded-sm" />
                  <div className="mt-2 h-8 w-20 bg-white/[0.04] animate-pulse rounded-sm" />
                </div>
                <div className="panel p-3">
                  <div className="h-3 w-20 bg-white/[0.04] animate-pulse rounded-sm" />
                  <div className="mt-2 h-8 w-20 bg-white/[0.04] animate-pulse rounded-sm" />
                </div>
              </>
            ) : (
              <>
                <div className="panel p-3">
                  <div className="text-[12px] text-ink-low uppercase tracking-[0.1em] font-medium">每块交易数</div>
                  <div className="num text-[34px] font-bold text-ink-high leading-none mt-1.5">
                    {data.avgTx}
                  </div>
                </div>
                <div className="panel p-3">
                  <div className="text-[12px] text-ink-low uppercase tracking-[0.1em] font-medium">Gas 使用率</div>
                  <div className="num text-[34px] font-bold text-ink-high leading-none mt-1.5">
                    {data.gasUsedRatio != null ? `${Math.round(data.gasUsedRatio * 100)}%` : "N/A"}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel
          title="最近 10 个区块分布"
          icon={<BarChart3 className="size-4 text-brand" strokeWidth={1.8} />}
        >
          {error ? (
            <EmptyHint empty message="加载失败" />
          ) : isLoading || !data ? (
            <SkeletonChart />
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
          {error ? (
            <EmptyHint empty message="加载失败" />
          ) : isLoading || !data ? (
            <SkeletonChart height={260} />
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
        className="mt-4"
        title="24 小时交易趋势 (每区块)"
        icon={<TrendingUp className="size-4 text-brand" strokeWidth={1.8} />}
      >
        {error ? (
          <EmptyHint empty message="加载失败" />
        ) : isLoading || !data ? (
          <SkeletonChart height={200} />
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
        className="mt-4"
        title="24 小时 Gas 使用率趋势 (EVM)"
        icon={<Activity className="size-4 text-brand" strokeWidth={1.8} />}
      >
        {error ? (
          <EmptyHint empty message="加载失败" />
        ) : isLoading || !data ? (
          <SkeletonChart height={200} />
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
        className="mt-4"
        title="数据采集协议 — 轻量级 RPC 调用参考"
        icon={<Code2 className="size-4 text-brand" strokeWidth={1.8} />}
      >
        <div className="overflow-hidden rounded-lg ring-1 ring-line-subtle">
          <table className="w-full text-[14px]">
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
                  <td className="px-4 py-2.5 font-mono text-brand">{r.method}</td>
                  <td className="px-4 py-2.5 font-mono text-ink-mid">{r.params}</td>
                  <td className="px-4 py-2.5 text-ink-mid">{r.use}</td>
                  <td className="px-4 py-2.5 text-ok font-medium">{r.weight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
