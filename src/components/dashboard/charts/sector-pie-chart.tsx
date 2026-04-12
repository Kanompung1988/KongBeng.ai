"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4", "#f97316"];

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "#1a1a2e",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    fontSize: "12px",
  },
  itemStyle: { color: "#e2e8f0" },
  labelStyle: { color: "#94a3b8" },
};

interface SectorItem {
  sector: string;
  value: number;
  count: number;
}

interface SectorPieChartProps {
  items: SectorItem[];
  className?: string;
}

const RADIAN = Math.PI / 180;

function renderLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}) {
  if (percent < 0.04) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
}

export function SectorPieChart({ items, className }: SectorPieChartProps) {
  if (!items || items.length === 0) {
    return (
      <div className={cn("glass-card rounded-xl p-4", className)}>
        <h3 className="text-sm font-semibold text-slate-300 mb-2">Sector Allocation</h3>
        <div className="flex items-center justify-center h-[300px] text-slate-500 text-sm">
          No sector data available
        </div>
      </div>
    );
  }

  const total = items.reduce((sum, i) => sum + i.value, 0);

  return (
    <div className={cn("glass-card rounded-xl p-4", className)}>
      <h3 className="text-sm font-semibold text-slate-300 mb-2">Sector Allocation</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={items}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={100}
            dataKey="value"
            nameKey="sector"
            labelLine={false}
            label={renderLabel}
            strokeWidth={0}
          >
            {items.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(value: number, _name: string, entry) => {
              const item = entry.payload as SectorItem;
              return [
                `$${value.toLocaleString()} (${((value / total) * 100).toFixed(1)}%) — ${item.count} stock${item.count !== 1 ? "s" : ""}`,
                "Value",
              ];
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 justify-center">
        {items.map((item, idx) => (
          <div key={item.sector} className="flex items-center gap-1.5 text-xs text-slate-400">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
            />
            <span className="text-slate-300 font-medium">{item.sector}</span>
            <span>
              ({((item.value / total) * 100).toFixed(1)}% · {item.count})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
