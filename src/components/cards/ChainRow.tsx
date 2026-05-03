import { ChainIcon } from "@/components/ui/ChainIcon";
import { cn } from "@/lib/cn";
import { fmtHeight, fmtTime, fmtRatio } from "@/lib/format";

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
    <div className="grid grid-cols-12 items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors border-b border-line-subtle/60 last:border-b-0">
      <div className="col-span-3 flex items-center gap-2.5 min-w-0">
        <ChainIcon short={row.short} color={row.color} />
        <div className="min-w-0">
          <div className="text-[16px] font-semibold text-ink-high truncate">{row.name}</div>
          <div className="text-[12px] text-ink-low uppercase tracking-wider">
            {row.symbol} · {row.consensus}
          </div>
        </div>
      </div>

      <Cell label="HEIGHT" value={fmtHeight(row.height)} />
      <Cell label="AVG BLOCK TIME" value={fmtTime(row.avgBlockTime)} />
      <Cell label="GAS USED" value={fmtRatio(row.gasUsedRatio)} />

      <div className="col-span-2 flex flex-col gap-0.5">
        <div className="table-head">STATUS</div>
        <div className={cn("text-[14px] font-medium num", STATUS_TONE[row.status])}>
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
        <div className="text-[12px] text-ink-low uppercase tracking-wider mt-0.5">
          Index
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="col-span-2 flex flex-col gap-0.5">
      <div className="table-head">{label}</div>
      <div className="num text-[14px] text-ink-high">{value}</div>
    </div>
  );
}
