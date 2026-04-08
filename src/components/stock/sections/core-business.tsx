"use client";
import { Building2 } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { parseCoreBusiness } from "@/lib/utils";

// Shared SectionHeader (re-exported for all sections)
export function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
        {icon}
      </div>
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
    </div>
  );
}

interface Props {
  raw: string | null | undefined;
}

export function CoreBusinessSection({ raw }: Props) {
  const data = parseCoreBusiness(raw);
  if (!data) return null;

  return (
    <section id="coreBusiness" className="scroll-mt-24">
      <SectionHeader icon={<Building2 className="w-5 h-5 text-emerald-400" />} title="ธุรกิจหลัก / Core Business" />
      <div className="glass-card p-6 space-y-6">
        {/* Summary */}
        <div className="space-y-3">
          {data.summary.split("\n").filter(Boolean).map((p, i) => (
            <p key={i} className="text-muted-foreground leading-relaxed">{p}</p>
          ))}
        </div>

        {/* Business Units Pie Chart + Breakdown */}
        {data.businessUnits && data.businessUnits.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/50">
            {/* Pie Chart */}
            <div className="flex flex-col items-center">
              <h3 className="text-sm font-semibold text-foreground mb-4">Revenue by Business Unit</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.businessUnits}
                    dataKey="revenuePercentage"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {data.businessUnits.map((bu, i) => (
                      <Cell key={i} fill={bu.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                    itemStyle={{ color: "#e2e8f0" }}
                    formatter={(value: number) => `${value}%`}
                  />
                </PieChart>
              </ResponsiveContainer>
              {data.totalRevenue && (
                <p className="text-xs text-muted-foreground mt-2">
                  Total Revenue: {data.totalRevenue} ({data.fiscalYear})
                </p>
              )}
            </div>

            {/* BU Breakdown List */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Business Units</h3>
              {data.businessUnits.map((bu, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: bu.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length] }}
                      />
                      <span className="text-sm font-medium text-foreground">{bu.name}</span>
                    </div>
                    <span className="text-sm font-mono text-emerald-400">{bu.revenuePercentage}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-muted/50 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${bu.revenuePercentage}%`,
                        backgroundColor: bu.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
                      }}
                    />
                  </div>
                  {bu.description && (
                    <p className="text-xs text-muted-foreground pl-5">{bu.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

const DEFAULT_COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4", "#f97316"];
