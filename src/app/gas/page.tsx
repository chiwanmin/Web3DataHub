"use client";

import { useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TrendingUp, BarChart3, Lightbulb, Sigma } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { ChainSelect } from "@/components/ui/ChainSelect";
import { LineTrend } from "@/components/charts/LineTrend";
import { BarBlocks } from "@/components/charts/BarBlocks";
import { EmptyHint } from "@/components/ui/EmptyHint";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { SkeletonChart } from "@/components/ui/Skeleton";
import { useLive } from "@/lib/swr";
import { fmtBig } from "@/lib/format";
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const [chainId, setChainId] = useState(searchParams.get("chain") || "ethereum");
  const url = `/api/chains/${chainId}/gas`;

  const handleChainChange = useCallback(
    (id: string) => {
      setChainId(id);
      const params = new URLSearchParams(searchParams);
      params.set("chain", id);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router],
  );
  const { data, isLoading, error } = useLive<GasDetail>(url);
  const chain = CHAINS.find((c) => c.id === chainId)!;
  const unit = chain.family === "evm" ? "Gwei" : chain.family === "btc" ? "sat/B" : chain.family === "svm" ? "μLamp" : "Sun";

  return (
    <div>
      <PageHeader
        title="Gas 追踪"
        subtitle="实时 Gas 费用、24 小时趋势与低成本时段推荐"
        liveLabel="实时更新"
        right={<ChainSelect value={chainId} onChange={handleChainChange} />}
      />

      {!error && data?.recommendedWindow ? (
        <div className="flex items-center gap-3 rounded-lg border border-ok/20 bg-ok/[0.04] px-4 py-3 mb-5">
          <div className="flex size-9 items-center justify-center rounded bg-ok/12 text-ok shrink-0">
            <Lightbulb className="size-4" strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] text-ok font-semibold uppercase tracking-wider">
              低成本时段推荐
            </div>
            <div className="text-[18px] font-bold text-ink-high mt-0.5">
              {data.recommendedWindow}
            </div>
            <div className="text-[13px] text-ink-mid mt-0.5 truncate">
              建议在此时段执行大额归集或批量转账，以获取最佳成本效益。
            </div>
          </div>
        </div>
      ) : null}

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
          <PriceBadge label="快速 Fast" value={data.latest?.fast ?? null} unit={unit} />
          <PriceBadge label="标准 Standard" value={data.latest?.standard ?? null} unit={unit} />
          <PriceBadge label="慢速 Slow" value={data.latest?.slow ?? null} unit={unit} />
          <PriceBadge
            label="Base / Priority"
            value={data.latest?.baseFee != null ? `${data.latest.baseFee.toFixed(2)} / ${(data.latest.priority ?? 0).toFixed(2)}` : null}
            unit={data.latest?.baseFee != null ? "Gwei" : undefined}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel
          className="lg:col-span-2"
          title="24 小时 Gas 趋势"
          icon={<TrendingUp className="size-4 text-brand" strokeWidth={1.8} />}
        >
          {error ? (
            <EmptyHint empty message="加载失败" />
          ) : isLoading || !data ? (
            <SkeletonChart />
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
          {error ? (
            <EmptyHint empty message="加载失败" />
          ) : isLoading || !data ? (
            <SkeletonChart />
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
        className="mt-4"
        title="归集成本优化预估"
        icon={<Sigma className="size-4 text-brand" strokeWidth={1.8} />}
      >
        {error ? (
          <EmptyHint empty message="加载失败" />
        ) : (
          <SweepEstimateTable
            standardGas={data?.latest?.standard ?? 0}
            unit={unit}
            chain={chain.name}
            windowText={data?.recommendedWindow ?? "—"}
          />
        )}
      </Panel>
    </div>
  );
}

function PriceBadge({ label, value, unit }: { label: string; value: number | string | null; unit?: string }) {
  return (
    <div className="panel p-3">
      <div className="text-[12px] text-ink-low uppercase tracking-[0.1em] font-medium">{label}</div>
      <div className="mt-1.5 num text-[24px] font-bold text-ink-high leading-none">
        {value != null ? value : "—"}
        {unit && value != null ? <span className="text-[13px] text-ink-low font-normal ml-1">{unit}</span> : null}
      </div>
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
    return { n, costStd, costLow, saving: costStd - costLow };
  });

  return (
    <div>
      <div className="text-[14px] text-ink-mid mb-3">
        基于当前 <span className="text-ink-high font-semibold">{chain}</span> Gas 价格
        ({standardGas.toFixed(2)} {unit})，按每笔 21,000 gas 估算；推荐窗口
        <span className="text-ok mx-1">{windowText}</span>
        预计可节省约 55%。
      </div>
      <div className="overflow-hidden rounded-lg ring-1 ring-line-subtle">
        <table className="w-full text-[14px]">
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
                <td className="px-4 py-2.5 num text-ink-high">{r.n.toLocaleString()}</td>
                <td className="px-4 py-2.5 num text-ink-mid">
                  {fmtBig(r.costStd)} {unit}
                </td>
                <td className="px-4 py-2.5 num text-ok">{fmtBig(r.costLow)} {unit}</td>
                <td className="px-4 py-2.5 num text-brand">≈ {fmtBig(r.saving)} {unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
