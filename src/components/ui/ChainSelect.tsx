"use client";

import { CHAINS } from "@/lib/chains/registry";
import { ChevronDown } from "lucide-react";

export function ChainSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="relative inline-flex">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-bg-surface border border-line-subtle rounded-md pl-3 pr-8 py-1.5 text-[12px] text-ink-high focus:outline-none focus:ring-1 focus:ring-brand/40 hover:border-line-strong"
      >
        {CHAINS.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.symbol})
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-ink-low" />
    </div>
  );
}
