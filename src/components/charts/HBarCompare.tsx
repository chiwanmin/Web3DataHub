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

export function HBarCompare({
  data,
  height = 280,
}: {
  data: { name: string; value: number; color: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
      >
        <CartesianGrid stroke="rgba(148,163,184,0.07)" horizontal={false} />
        <XAxis
          type="number"
          stroke="rgba(154,176,198,0.55)"
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          stroke="rgba(154,176,198,0.7)"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={92}
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
          formatter={(v: number) => [v, "Avg TX"]}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
