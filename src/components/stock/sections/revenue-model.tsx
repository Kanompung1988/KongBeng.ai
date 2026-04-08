"use client";
import { PieChart as PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { SectionHeader } from "./core-business";
import { parseRevenueModel } from "@/lib/utils";

interface Props {
  raw: string | null | undefined;
}

const DEFAULT_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444"];

export function RevenueModelSection({ raw }: Props) {
  const data = parseRevenueModel(raw);
  if (!data) return null;

  return (
    <section id="revenueModel" className="scroll-mt-24">
      <SectionHeader icon={<PieChartIcon className="w-5 h-5 text-purple-400" />} title="Model รายได้ / Revenue Model & Quality" />
      <div className="glass-card p-6 space-y-6">
        {/* Revenue Types Chart + List */}
        {data.revenueTypes && data.revenueTypes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Donut Chart */}
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={data.revenueTypes}
                    dataKey="percentage"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {data.revenueTypes.map((rt, i) => (
                      <Cell key={i} fill={rt.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                    itemStyle={{ color: "#e2e8f0" }}
                    formatter={(value: number) => `${value}%`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Type Breakdown */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Revenue Types</h3>
              {data.revenueTypes.map((rt, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: rt.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length] }}
                      />
                      <span className="text-sm font-medium text-foreground">{rt.type}</span>
                    </div>
                    <span className="text-sm font-mono text-purple-400">{rt.percentage}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-5">{rt.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quality Summary */}
        {data.qualitySummary && (
          <div className="pt-4 border-t border-border/50">
            <h3 className="text-sm font-semibold text-foreground mb-2">Revenue Quality</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{data.qualitySummary}</p>
          </div>
        )}

        {/* Key Metrics */}
        {data.keyMetrics && data.keyMetrics.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border/50">
            {data.keyMetrics.map((m, i) => (
              <div key={i} className="glass-card p-3 bg-muted/20 text-center">
                <div className="text-lg font-bold text-foreground">{m.value}</div>
                <div className="text-xs text-muted-foreground">{m.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Revenue Evolution */}
        {data.revenueEvolution && (
          <div className="pt-4 border-t border-border/50">
            <h3 className="text-sm font-semibold text-foreground mb-2">Revenue Evolution</h3>
            {data.revenueEvolution.split("\n").filter(Boolean).map((p, i) => (
              <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-2">{p}</p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
