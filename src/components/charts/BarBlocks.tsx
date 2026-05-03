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

export function BarBlocks({
  data,
  color = "#5e9eff",
  height = 220,
  yFormatter = (v: number) => String(v),
  tooltipLabel = "value",
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  yFormatter?: (v: number) => string;
  tooltipLabel?: string;
}) {
  const { theme } = useTheme();
  const tooltip = chartTooltipStyle(theme);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="rgba(138,153,172,0.07)" vertical={false} />
        <XAxis
          dataKey="label"
          stroke="rgba(138,153,172,0.5)"
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="rgba(138,153,172,0.5)"
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          width={36}
          tickFormatter={yFormatter}
        />
        <Tooltip
          cursor={{ fill: "rgba(94,158,255,0.05)" }}
          contentStyle={tooltip}
          formatter={(v: number) => [yFormatter(v), tooltipLabel]}
        />
        <Bar dataKey="value" radius={[2, 2, 0, 0]} maxBarSize={24}>
          {data.map((_, i) => (
            <Cell key={`bc-${i}`} fill={color} fillOpacity={0.55 + (i / data.length) * 0.45} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
