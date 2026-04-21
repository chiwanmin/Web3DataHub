"use client";

import { useState } from "react";
import { TrendingUp, BarChart3, Lightbulb, Sigma } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/ui/MetricCard";
import { Panel } from "@/components/ui/Panel";
import { ChainSelect } from "@/components/ui/ChainSelect";
import { LineTrend } from "@/components/charts/LineTrend";
import { BarBlocks } from "@/components/charts/BarBlocks";
import { EmptyHint } from "@/components/ui/EmptyHint";
import { useLive } from "@/lib/swr";
import { CHAINS } from "@/lib/chains/registry";

interface GasDetail {
  chain: { id: string; name: string; short: string; symbol: string };
  latest: {
    fast: number;
    standard: number;
    slow: number;
    baseFee?: number | null;
    priority?: number | null;
  } | null;
  trend24h: { t: string; v: number }[];
  week: { label: string; value: number }[];
  recommendedWindow: string;
}

export default function GasPage() {
  const [chainId, setChainId] = useState("ethereum");
  const { data, isLoading } = useLive<GasDetail>(`/api/chains/${chainId}/gas`);
  const chain = CHAINS.find((c) => c.id === chainId)!;
  const unit = chain.family === "evm" ? "Gwei" : chain.family === "btc" ? "sat/B" : chain.family === "svm" ? "μLamp" : "Sun";

  return (
    <div>
      <PageHeader
        title="Gas 追踪"
        subtitle={`实时 Gas 费用、24 小时与 7 日趋势、低成本时段推荐`}
        liveLabel="实时更新"
        right={<ChainSelect value={chainId} onChange={setChainId} />}
      />

      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="快速确认 (Fast)"
          value={data?.latest ? data.latest.fast.toFixed(2) : "—"}
          unit={unit}
          tone="brand"
        />
        <MetricCard
          label="标准确认 (Standard)"
          value={data?.latest ? data.latest.standard.toFixed(2) : "—"}
          unit={unit}
          tone="brand"
        />
        <MetricCard
          label="慢速确认 (Slow)"
          value={data?.latest ? data.latest.slow.toFixed(2) : "—"}
          unit={unit}
          tone="brand"
        />
        <MetricCard
          label="基础 / 优先费 (Base/Priority)"
          value={
            data?.latest?.baseFee != null
              ? `${data.latest.baseFee.toFixed(2)} / ${(data.latest.priority ?? 0).toFixed(2)}`
              : "—"
          }
          unit={data?.latest?.baseFee != null ? "Gwei" : undefined}
          tone="brand"
          numClassName="!text-[20px]"
          caption="EIP-1559 实时参数"
        />
      </div>

      <Panel className="mt-5 border-ok/30 bg-gradient-to-br from-ok/[0.06] to-transparent">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-ok/15 text-ok">
            <Lightbulb className="size-5" strokeWidth={1.8} />
          </div>
          <div className="flex-1">
            <div className="text-[12px] text-ok font-semibold uppercase tracking-wider">
              低成本时段推荐
            </div>
            <div className="text-[16px] font-bold text-ink-high mt-1">
              {data?.recommendedWindow ?? "采集中…"}
            </div>
            <div className="text-[12px] text-ink-mid mt-1">
              建议在此时段执行大额归集或批量转账，以获取最佳成本效益。
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-3 gap-4 mt-5">
        <Panel
          className="col-span-2"
          title="24 小时 Gas 趋势"
          icon={<TrendingUp className="size-4 text-brand" strokeWidth={1.8} />}
        >
          {isLoading || !data ? (
            <EmptyHint loading />
          ) : data.trend24h.length === 0 ? (
            <EmptyHint empty />
          ) : (
            <LineTrend
              data={data.trend24h}
              yFormatter={(v) => v.toFixed(0)}
              tooltipLabel={`Standard (${unit})`}
            />
          )}
        </Panel>

        <Panel
          title="7 日 Gas 均值"
          icon={<BarChart3 className="size-4 text-brand" strokeWidth={1.8} />}
        >
          {isLoading || !data ? (
            <EmptyHint loading />
          ) : data.week.length === 0 ? (
            <EmptyHint empty message="累计 7 天数据后显示" />
          ) : (
            <BarBlocks
              data={data.week}
              yFormatter={(v) => v.toFixed(0)}
              tooltipLabel={`日均 (${unit})`}
            />
          )}
        </Panel>
      </div>

      <Panel
        className="mt-5"
        title="归集成本优化预估"
        icon={<Sigma className="size-4 text-brand" strokeWidth={1.8} />}
      >
        <SweepEstimateTable
          standardGas={data?.latest?.standard ?? 0}
          unit={unit}
          chain={chain.name}
          windowText={data?.recommendedWindow ?? "—"}
        />
      </Panel>
    </div>
  );
}

function SweepEstimateTable({
  standardGas,
  unit,
  chain,
  windowText,
}: {
  standardGas: number;
  unit: string;
  chain: string;
  windowText: string;
}) {
  const txGas = 21_000;
  const cases = [10, 50, 200, 1000];
  const rows = cases.map((n) => {
    const totalGas = n * txGas;
    const costStd = standardGas * totalGas;
    const costLow = standardGas * 0.45 * totalGas;
    return {
      n,
      costStd,
      costLow,
      saving: costStd - costLow,
    };
  });

  return (
    <div>
      <div className="text-[12px] text-ink-mid mb-3">
        基于当前 <span className="text-ink-high font-semibold">{chain}</span> Gas 价格
        ({standardGas.toFixed(2)} {unit})，按每笔 21,000 gas 估算；推荐窗口
        <span className="text-ok mx-1">{windowText}</span>
        预计可节省约 55%。
      </div>
      <div className="overflow-hidden rounded-lg ring-1 ring-line-subtle">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-left table-head bg-white/[0.02]">
              <th className="px-4 py-2.5">归集笔数</th>
              <th className="px-4 py-2.5">当前成本</th>
              <th className="px-4 py-2.5">推荐窗口成本</th>
              <th className="px-4 py-2.5">预计节省</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.n} className="border-t border-line-subtle/60">
                <td className="px-4 py-3 num text-ink-high">{r.n.toLocaleString()}</td>
                <td className="px-4 py-3 num text-ink-mid">
                  {fmtBig(r.costStd)} {unit}
                </td>
                <td className="px-4 py-3 num text-ok">{fmtBig(r.costLow)} {unit}</td>
                <td className="px-4 py-3 num text-brand">≈ {fmtBig(r.saving)} {unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function fmtBig(n: number) {
  if (!Number.isFinite(n) || n === 0) return "0";
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(2);
}
