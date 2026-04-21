"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

export function BarBlocks({
  data,
  color = "#22d3ee",
  height = 240,
  yFormatter = (v: number) => String(v),
  tooltipLabel = "value",
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  yFormatter?: (v: number) => string;
  tooltipLabel?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="rgba(148,163,184,0.07)" vertical={false} />
        <XAxis
          dataKey="label"
          stroke="rgba(154,176,198,0.55)"
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="rgba(154,176,198,0.55)"
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          width={40}
          tickFormatter={yFormatter}
        />
        <Tooltip
          cursor={{ fill: "rgba(34,211,238,0.06)" }}
          contentStyle={{
            background: "#0c1320",
            border: "1px solid rgba(34,211,238,0.25)",
            borderRadius: 8,
            fontSize: 12,
            color: "#e6f1ff",
          }}
          formatter={(v: number) => [yFormatter(v), tooltipLabel]}
        />
        <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={28}>
          {data.map((_, i) => (
            <Cell key={i} fill={color} fillOpacity={0.65 + (i / data.length) * 0.35} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
