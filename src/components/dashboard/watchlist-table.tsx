"use client";

import { Trash2, Plus } from "lucide-react";
import Link from "next/link";
import { cn, formatNumber, formatPercent } from "@/lib/utils";
import { StockLogo } from "@/components/ui/stock-logo";

interface WatchlistItem {
  id: string;
  symbol: string;
  stock: {
    id: string;
    symbol: string;
    name: string;
    logoUrl: string | null;
    exchange: string;
  } | null;
  quote: {
    price: number | null;
    change: number | null;
    changePercent: number | null;
    marketCap: number | null;
    currency: string;
  } | null;
}

interface Props {
  items: WatchlistItem[];
  onRemove: (id: string) => void;
  onAddToPortfolio: (symbol: string, stockId: string) => void;
}

export function WatchlistTable({ items, onRemove, onAddToPortfolio }: Props) {
  if (items.length === 0) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <p className="text-muted-foreground text-sm">
          Your watchlist is empty. Add stocks you want to track.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-xs">
              <th className="text-left px-4 py-3 font-medium">Stock</th>
              <th className="text-right px-4 py-3 font-medium">Price</th>
              <th className="text-right px-4 py-3 font-medium">Change %</th>
              <th className="text-right px-4 py-3 font-medium">24h Change</th>
              <th className="text-right px-4 py-3 font-medium">Market Cap</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const price = item.quote?.price ?? 0;
              const change = item.quote?.change ?? 0;
              const changePct = item.quote?.changePercent ?? 0;
              const marketCap = item.quote?.marketCap;
              const positive = change >= 0;

              return (
                <tr
                  key={item.id}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                >
                  {/* Stock */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <StockLogo
                        symbol={item.symbol}
                        logoUrl={item.stock?.logoUrl ?? null}
                        exchange={item.stock?.exchange}
                        size={32}
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/stock/${item.symbol}`}
                          className="font-mono font-semibold text-foreground hover:text-emerald-400 transition-colors"
                        >
                          {item.symbol}
                        </Link>
                        <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                          {item.stock?.name ?? item.symbol}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3 text-right">
                    <span className="text-foreground font-medium">
                      {price > 0 ? formatNumber(price, { compact: false }) : "—"}
                    </span>
                  </td>

                  {/* Change % */}
                  <td className="px-4 py-3 text-right">
                    <span
                      className={cn(
                        "font-medium",
                        positive ? "text-emerald-400" : "text-red-400"
                      )}
                    >
                      {formatPercent(changePct)}
                    </span>
                  </td>

                  {/* 24h Change */}
                  <td className="px-4 py-3 text-right">
                    <span
                      className={cn(
                        "font-medium",
                        positive ? "text-emerald-400" : "text-red-400"
                      )}
                    >
                      {change !== 0
                        ? `${positive ? "+" : ""}${formatNumber(change, { compact: false })}`
                        : "—"}
                    </span>
                  </td>

                  {/* Market Cap */}
                  <td className="px-4 py-3 text-right">
                    <span className="text-foreground">
                      {marketCap ? formatNumber(marketCap) : "—"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() =>
                          onAddToPortfolio(item.symbol, item.stock?.id ?? "")
                        }
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                        title="Add to Portfolio"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onRemove(item.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
