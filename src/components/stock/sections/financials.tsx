"use client";
import { BarChart3 } from "lucide-react";
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { SectionHeader } from "./core-business";
import { parseFinancials } from "@/lib/utils";

interface Props {
  raw: string | null | undefined;
}

const CHART_TOOLTIP_STYLE = {
  contentStyle: { background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" },
  itemStyle: { color: "#e2e8f0" },
  labelStyle: { color: "#94a3b8" },
};

export function FinancialsSection({ raw }: Props) {
  const data = parseFinancials(raw);
  if (!data) return null;

  const unitLabel = data.unit === "billion" ? "B" : "M";
  const currencyLabel = data.currency || "THB";

  // Build chart data arrays
  const revenueData = data.years.map((y, i) => ({
    year: y,
    revenue: data.revenue[i] || 0,
    netProfit: data.netProfit[i] || 0,
  }));

  const expenseData = data.years.map((y, i) => ({
    year: y,
    opex: data.operatingExpenses[i] || 0,
  }));

  const balanceData = data.years.map((y, i) => ({
    year: y,
    cash: data.cashOnHand[i] || 0,
    debt: data.totalDebt[i] || 0,
  }));

  const dividendData = data.years.map((y, i) => ({
    year: y,
    yield: data.dividendYield[i] || 0,
  }));

  return (
    <section id="financials" className="scroll-mt-24">
      <SectionHeader icon={<BarChart3 className="w-5 h-5 text-gold-400" />} title="งบการเงิน / Financial Statements" />
      <div className="space-y-6">
        {/* Revenue & Profit Chart */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Revenue & Net Profit ({unitLabel} {currencyLabel})</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="netProfit" name="Net Profit" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* OpEx Chart */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Operating Expenses ({unitLabel} {currencyLabel})</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={expenseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} />
                <Tooltip {...CHART_TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="opex" name="OpEx" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Dividend Yield */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Dividend Yield (%)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dividendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} />
                <Tooltip {...CHART_TOOLTIP_STYLE} />
                <Bar dataKey="yield" name="Dividend Yield %" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cash vs Debt */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Cash on Hand vs Total Debt ({unitLabel} {currencyLabel})</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={balanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Area type="monotone" dataKey="cash" name="Cash" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
              <Area type="monotone" dataKey="debt" name="Debt" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Key Takeaway Ratios */}
        {data.keyTakeawayRatios && data.keyTakeawayRatios.length > 0 && (
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Key Takeaway Ratios</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.keyTakeawayRatios.map((r, i) => (
                <div key={i} className="glass-card p-4 bg-muted/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{r.name}</span>
                    <span className="text-lg font-bold font-mono text-gold-400">{r.value}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{r.explanation}</p>
                  <p className="text-xs text-emerald-400/80 italic">{r.relevance}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {data.summary && (
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-2">Financial Summary</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{data.summary}</p>
          </div>
        )}
      </div>
    </section>
  );
}
