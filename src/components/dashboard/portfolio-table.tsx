"use client";

import { Pencil, Trash2, Check, X, AlertTriangle, TrendingDown } from "lucide-react";
import Link from "next/link";
import { cn, formatNumber, formatPercent } from "@/lib/utils";
import { StockLogo } from "@/components/ui/stock-logo";

interface PortfolioItem {
  id: string;
  stockId: string;
  symbol: string;
  addedAt: string;
  stock: {
    id: string;
    symbol: string;
    name: string;
    sector: string;
    logoUrl: string | null;
    exchange: string;
  } | null;
  quote: {
    price: number | null;
    change: number | null;
    changePercent: number | null;
    pe: number | null;
    marketCap: number | null;
    currency: string;
  } | null;
  shares: number | null;
  avgCost: number | null;
  notes: string | null;
  alertTarget?: number | null;
}

interface Props {
  items: PortfolioItem[];
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
  onSell: (item: PortfolioItem) => void;
  editingId: string | null;
  editShares: string;
  editCost: string;
  setEditShares: (v: string) => void;
  setEditCost: (v: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

export function PortfolioTable({
  items,
  onEdit,
  onRemove,
  onSell,
  editingId,
  editShares,
  editCost,
  setEditShares,
  setEditCost,
  onSaveEdit,
  onCancelEdit,
}: Props) {
  if (items.length === 0) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <p className="text-muted-foreground text-sm">
          No stocks in this portfolio yet. Add your first stock to get started.
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
              <th className="text-right px-4 py-3 font-medium">Shares</th>
              <th className="text-right px-4 py-3 font-medium">Avg Cost</th>
              <th className="text-right px-4 py-3 font-medium">Current Price</th>
              <th className="text-right px-4 py-3 font-medium">P/L</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const price = item.quote?.price ?? 0;
              const shares = item.shares ?? 0;
              const avgCost = item.avgCost ?? 0;
              const pl = shares > 0 && avgCost > 0 ? (price - avgCost) * shares : null;
              const plPct = avgCost > 0 ? ((price - avgCost) / avgCost) * 100 : null;
              const changePct = item.quote?.changePercent;
              const isEditing = editingId === item.id;
              const alertReached =
                item.alertTarget != null &&
                price > 0 &&
                price >= item.alertTarget;

              return (
                <tr
                  key={item.id}
                  className={cn(
                    "border-b border-border/50 hover:bg-muted/30 transition-colors",
                    alertReached && "bg-gold-500/5 border-l-2 border-l-gold-400"
                  )}
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
                      {alertReached && (
                        <AlertTriangle className="w-4 h-4 text-gold-400 shrink-0" />
                      )}
                    </div>
                  </td>

                  {/* Shares */}
                  <td className="px-4 py-3 text-right">
                    {isEditing ? (
                      <input
                        value={editShares}
                        onChange={(e) => setEditShares(e.target.value)}
                        type="number"
                        step="any"
                        className="w-20 bg-muted border border-border rounded-lg px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                      />
                    ) : (
                      <span className="text-foreground">
                        {shares > 0 ? formatNumber(shares, { compact: false }) : "—"}
                      </span>
                    )}
                  </td>

                  {/* Avg Cost */}
                  <td className="px-4 py-3 text-right">
                    {isEditing ? (
                      <input
                        value={editCost}
                        onChange={(e) => setEditCost(e.target.value)}
                        type="number"
                        step="any"
                        className="w-20 bg-muted border border-border rounded-lg px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                      />
                    ) : (
                      <span className="text-foreground">
                        {avgCost > 0 ? formatNumber(avgCost, { compact: false }) : "—"}
                      </span>
                    )}
                  </td>

                  {/* Current Price */}
                  <td className="px-4 py-3 text-right">
                    <div>
                      <span className="text-foreground font-medium">
                        {price > 0 ? formatNumber(price, { compact: false }) : "—"}
                      </span>
                      {changePct != null && (
                        <span
                          className={cn(
                            "block text-xs font-medium",
                            changePct >= 0 ? "text-emerald-400" : "text-red-400"
                          )}
                        >
                          {formatPercent(changePct)}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* P/L */}
                  <td className="px-4 py-3 text-right">
                    {pl != null ? (
                      <div>
                        <span
                          className={cn(
                            "font-medium",
                            pl >= 0 ? "text-emerald-400" : "text-red-400"
                          )}
                        >
                          {formatNumber(pl, { compact: false })}
                        </span>
                        {plPct != null && (
                          <span
                            className={cn(
                              "block text-xs",
                              plPct >= 0 ? "text-emerald-400" : "text-red-400"
                            )}
                          >
                            {formatPercent(plPct)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={onSaveEdit}
                          className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                          title="Save"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={onCancelEdit}
                          className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onSell(item)}
                          disabled={!item.shares || item.shares <= 0}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Sell"
                        >
                          <TrendingDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEdit(item.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onRemove(item.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
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
