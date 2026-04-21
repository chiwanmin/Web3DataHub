import { ChainIcon } from "@/components/ui/ChainIcon";
import { cn } from "@/lib/cn";

interface Row {
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
}

const STATUS_TEXT: Record<Row["status"], string> = {
  ok: "活跃",
  warn: "畅通",
  bad: "异常",
  stale: "采集中",
};
const STATUS_TONE: Record<Row["status"], string> = {
  ok: "text-ok",
  warn: "text-warn",
  bad: "text-bad",
  stale: "text-ink-low",
};

export function ChainRow({ row }: { row: Row }) {
  return (
    <div className="grid grid-cols-12 items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors border-b border-line-subtle/60 last:border-b-0">
      <div className="col-span-3 flex items-center gap-3 min-w-0">
        <ChainIcon short={row.short} color={row.color} />
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-ink-high truncate">{row.name}</div>
          <div className="text-[11px] text-ink-low uppercase tracking-wider">
            {row.symbol} · {row.consensus}
          </div>
        </div>
      </div>

      <Cell label="HEIGHT" value={fmtHeight(row.height)} />
      <Cell label="AVG BLOCK TIME" value={fmtTime(row.avgBlockTime)} />
      <Cell label="GAS USED" value={fmtRatio(row.gasUsedRatio)} />

      <div className="col-span-2 flex flex-col gap-0.5">
        <div className="table-head">STATUS</div>
        <div className={cn("text-[13px] font-medium num", STATUS_TONE[row.status])}>
          {STATUS_TEXT[row.status]}
        </div>
      </div>

      <div className="col-span-1 text-right">
        <div className={cn(
          "num text-[22px] font-bold leading-none",
          row.health.level === "ok" && "text-ok",
          row.health.level === "warn" && "text-warn",
          row.health.level === "bad" && "text-bad",
        )}>
          {row.health.score}
        </div>
        <div className="text-[10px] text-ink-low uppercase tracking-wider mt-1">
          Health Index
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="col-span-2 flex flex-col gap-0.5">
      <div className="table-head">{label}</div>
      <div className="num text-[13px] text-ink-high">{value}</div>
    </div>
  );
}

function fmtHeight(h: number | null) {
  if (h == null) return "—";
  if (h >= 1e6) return `${(h / 1e6).toFixed(2)}M`;
  if (h >= 1e3) return `${(h / 1e3).toFixed(1)}K`;
  return String(h);
}
function fmtTime(t: number | null) {
  if (t == null) return "—";
  if (t < 1) return `${(t * 1000).toFixed(0)}ms`;
  return `${t.toFixed(2)}s`;
}
function fmtRatio(r: number | null) {
  if (r == null) return "N/A";
  return `${Math.round(r * 100)}%`;
}
