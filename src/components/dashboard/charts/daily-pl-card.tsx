"use client";

import { cn } from "@/lib/utils";

interface DailyPLItem {
  symbol: string;
  dailyChange: number;
  dailyChangePct: number;
  shares: number;
}

interface DailyPLCardProps {
  items: DailyPLItem[];
  className?: string;
}

export function DailyPLCard({ items, className }: DailyPLCardProps) {
  if (!items || items.length === 0) {
    return (
      <div className={cn("glass-card rounded-xl p-4", className)}>
        <h3 className="text-sm font-semibold text-slate-300 mb-2">Today&apos;s P/L</h3>
        <div className="flex items-center justify-center h-24 text-slate-500 text-sm">
          No data available
        </div>
      </div>
    );
  }

  // Compute per-stock impact (price change * shares) and sort by absolute impact descending
  const withImpact = items
    .map((item) => ({
      ...item,
      impact: item.dailyChange * item.shares,
    }))
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  const totalPL = withImpact.reduce((sum, i) => sum + i.impact, 0);
  const isPositive = totalPL >= 0;

  return (
    <div className={cn("glass-card rounded-xl p-4", className)}>
      <h3 className="text-sm font-semibold text-slate-300 mb-3">Today&apos;s P/L</h3>

      {/* Total P/L */}
      <div className="mb-4">
        <span
          className={cn(
            "text-2xl font-bold tracking-tight",
            isPositive ? "text-emerald-400" : "text-red-400"
          )}
        >
          {isPositive ? "+" : ""}
          ${Math.abs(totalPL).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
        {totalPL < 0 && (
          <span className="text-2xl font-bold text-red-400">
            {/* negative sign already in formatted string when totalPL < 0 — handled by ternary above */}
          </span>
        )}
      </div>

      {/* Per-stock breakdown */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {withImpact.map((item) => {
          const impactPositive = item.impact >= 0;
          return (
            <div
              key={item.symbol}
              className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-200">{item.symbol}</span>
                <span className="text-xs text-slate-500">{item.shares} shares</span>
              </div>
              <div className="flex items-center gap-3 text-right">
                <span
                  className={cn(
                    "text-xs font-medium",
                    impactPositive ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  {impactPositive ? "+" : ""}
                  {item.dailyChangePct.toFixed(2)}%
                </span>
                <span
                  className={cn(
                    "text-sm font-semibold min-w-[80px] text-right",
                    impactPositive ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  {impactPositive ? "+" : ""}$
                  {Math.abs(item.impact).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
