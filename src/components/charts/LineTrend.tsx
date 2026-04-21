"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface Point {
  t: string;
  v: number;
}

export function LineTrend({
  data,
  color = "#22d3ee",
  height = 240,
  yFormatter = (v: number) => v.toFixed(1),
  tooltipLabel = "value",
}: {
  data: Point[];
  color?: string;
  height?: number;
  yFormatter?: (v: number) => string;
  tooltipLabel?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.32} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(148,163,184,0.07)" vertical={false} />
        <XAxis
          dataKey="t"
          stroke="rgba(154,176,198,0.55)"
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          minTickGap={32}
          tickFormatter={(v: string) => {
            const d = new Date(v);
            return `${String(d.getHours()).padStart(2, "0")}:${String(
              d.getMinutes(),
            ).padStart(2, "0")}`;
          }}
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
          cursor={{ stroke: "rgba(34,211,238,0.25)", strokeWidth: 1 }}
          contentStyle={{
            background: "#0c1320",
            border: "1px solid rgba(34,211,238,0.25)",
            borderRadius: 8,
            fontSize: 12,
            color: "#e6f1ff",
          }}
          labelFormatter={(v) => new Date(v as string).toLocaleString("zh-CN")}
          formatter={(v: number) => [yFormatter(v), tooltipLabel]}
        />
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2}
          fill={`url(#grad-${color})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
