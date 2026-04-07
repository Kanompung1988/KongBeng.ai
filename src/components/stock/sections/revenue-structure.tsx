"use client";
// Phase 3 — Prompt 6: Revenue Structure with Recharts Donut
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { SectionHeader } from "./business-overview";
import { parseRevenueStructure, formatNumber } from "@/lib/utils";

interface Props {
  raw: string | null | undefined;
}

const DEFAULT_COLORS = [
  "#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4", "#f97316",
];

export function RevenueStructureSection({ raw }: Props) {
  const data = parseRevenueStructure(raw);
  if (!data || !data.segments?.length) return null;

  const segments = data.segments.map((s, i) => ({
    ...s,
    color: s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  }));

  return (
    <section id="revenueStructure" className="scroll-mt-24">
      <SectionHeader
        icon={<PieChartIcon className="w-5 h-5 text-blue-400" />}
        title="Revenue Structure"
      />
      <div className="glass-card p-6">
        <div className="flex flex-col lg:flex-row gap-8 items-center">
          {/* Donut Chart */}
          <div className="w-full lg:w-72 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segments}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="percentage"
                >
                  {segments.map((s, i) => (
                    <Cell key={i} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(1)}%`, "Share"]}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: "8px",
                    color: "#f8fafc",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Segment Breakdown */}
          <div className="flex-1 w-full space-y-3">
            {segments.map((s) => (
              <div key={s.name} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground font-medium truncate">{s.name}</span>
                    <span className="text-sm font-mono font-semibold text-foreground ml-2 shrink-0">
                      {s.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${s.percentage}%`, backgroundColor: s.color }}
                    />
                  </div>
                  {s.amount && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatNumber(s.amount, { currency: s.currency || data.currency })}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Total */}
            {data.totalRevenue && (
              <div className="pt-3 border-t border-border">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    Total Revenue ({data.fiscalYear})
                  </span>
                  <span className="font-mono font-bold text-foreground">
                    {formatNumber(data.totalRevenue, { currency: data.currency })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {data.note && (
          <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">{data.note}</p>
        )}
      </div>
    </section>
  );
}
