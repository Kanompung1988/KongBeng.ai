"use client";

import {
  Wallet,
  TrendingUp,
  TrendingDown,
  BarChart3,
  DollarSign,
} from "lucide-react";
import { cn, formatNumber, formatPercent } from "@/lib/utils";

interface Props {
  totalValue: number | null;
  totalCost: number | null;
  totalPL: number | null;
  totalPLPct: number | null;
  dailyPL: number | null;
  dailyPLPct: number | null;
  stockCount: number;
  displayCurrency: string;
}

interface CardDef {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  colorClass: string;
}

export function PortfolioSummaryCards({
  totalValue,
  totalCost,
  totalPL,
  totalPLPct,
  dailyPL,
  dailyPLPct,
  stockCount,
  displayCurrency,
}: Props) {
  const plPositive = (totalPL ?? 0) >= 0;
  const dailyPositive = (dailyPL ?? 0) >= 0;

  const cards: CardDef[] = [
    {
      label: "Total Value",
      value: formatNumber(totalValue, { currency: displayCurrency, compact: false }),
      icon: <Wallet className="w-5 h-5" />,
      colorClass: "text-emerald-400",
    },
    {
      label: "Daily P/L",
      value: formatNumber(dailyPL, { compact: false }),
      sub: formatPercent(dailyPLPct),
      icon: dailyPositive ? (
        <TrendingUp className="w-5 h-5" />
      ) : (
        <TrendingDown className="w-5 h-5" />
      ),
      colorClass: dailyPositive ? "text-emerald-400" : "text-red-400",
    },
    {
      label: "Total P/L",
      value: formatNumber(totalPL, { compact: false }),
      sub: formatPercent(totalPLPct),
      icon: plPositive ? (
        <TrendingUp className="w-5 h-5" />
      ) : (
        <TrendingDown className="w-5 h-5" />
      ),
      colorClass: plPositive ? "text-emerald-400" : "text-red-400",
    },
    {
      label: "Stocks",
      value: String(stockCount),
      icon: <BarChart3 className="w-5 h-5" />,
      colorClass: "text-blue-400",
    },
    {
      label: "Total Cost",
      value: formatNumber(totalCost, { currency: displayCurrency, compact: false }),
      icon: <DollarSign className="w-5 h-5" />,
      colorClass: "text-muted-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="glass-card rounded-xl p-4 flex flex-col gap-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              {card.label}
            </span>
            <span className={cn("opacity-60", card.colorClass)}>
              {card.icon}
            </span>
          </div>
          <div className={cn("text-xl font-bold tracking-tight", card.colorClass)}>
            {card.value}
          </div>
          {card.sub && (
            <span className={cn("text-xs font-medium", card.colorClass)}>
              {card.sub}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
