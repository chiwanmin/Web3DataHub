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
import { useTheme } from "@/components/providers/ThemeProvider";
import { chartTooltipStyle } from "./tooltip";

interface Point {
  t: string;
  v: number;
}

export function LineTrend({
  data,
  color = "#5e9eff",
  height = 220,
  yFormatter = (v: number) => v.toFixed(1),
  tooltipLabel = "value",
}: {
  data: Point[];
  color?: string;
  height?: number;
  yFormatter?: (v: number) => string;
  tooltipLabel?: string;
}) {
  const { theme } = useTheme();
  const tooltip = chartTooltipStyle(theme);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="rgba(138,153,172,0.07)" vertical={false} />
        <XAxis
          dataKey="t"
          stroke="rgba(138,153,172,0.5)"
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
          stroke="rgba(138,153,172,0.5)"
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          width={36}
          tickFormatter={yFormatter}
        />
        <Tooltip
          cursor={{ stroke: "rgba(94,158,255,0.18)", strokeWidth: 1 }}
          contentStyle={tooltip}
          labelFormatter={(v) => new Date(v as string).toLocaleString("zh-CN")}
          formatter={(v: number) => [yFormatter(v), tooltipLabel]}
        />
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          fill={color}
          fillOpacity={0.08}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
