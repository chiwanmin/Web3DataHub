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
import { useTheme } from "@/components/providers/ThemeProvider";
import { chartTooltipStyle } from "./tooltip";

export function HBarCompare({
  data,
  height = 260,
}: {
  data: { name: string; value: number; color: string }[];
  height?: number;
}) {
  const { theme } = useTheme();
  const tooltip = chartTooltipStyle(theme);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 12, left: 4, bottom: 0 }}
      >
        <CartesianGrid stroke="rgba(138,153,172,0.07)" horizontal={false} />
        <XAxis
          type="number"
          stroke="rgba(138,153,172,0.5)"
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          stroke="rgba(138,153,172,0.65)"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={88}
        />
        <Tooltip
          cursor={{ fill: "rgba(94,158,255,0.05)" }}
          contentStyle={tooltip}
          formatter={(v: number) => [v, "Avg TX"]}
        />
        <Bar dataKey="value" radius={[0, 3, 3, 0]} maxBarSize={16}>
          {data.map((d, i) => (
            <Cell key={`hbc-${i}`} fill={d.color} fillOpacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
