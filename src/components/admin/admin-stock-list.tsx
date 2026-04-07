"use client";
import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { parseStrategistVerdict, scoreToColor, ratingToBadgeClass } from "@/lib/utils";
import { deleteStockAction, togglePublishAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";

interface StockRow {
  id: string; symbol: string; name: string; sector: string;
  isPublished: boolean; viewCount: number; updatedAt: Date;
  strategistVerdict: string | null;
}

export function AdminStockList({ stocks }: { stocks: StockRow[] }) {
  const { toast } = useToast();
  const [rows, setRows] = useState(stocks);

  const handleDelete = async (id: string, symbol: string) => {
    if (!confirm(`Delete ${symbol}? This cannot be undone.`)) return;
    await deleteStockAction(id);
    setRows((r) => r.filter((s) => s.id !== id));
    toast({ title: `${symbol} deleted` });
  };

  const handleToggle = async (id: string, symbol: string, current: boolean) => {
    await togglePublishAction(id, !current);
    setRows((r) => r.map((s) => s.id === id ? { ...s, isPublished: !current } : s));
    toast({ title: `${symbol} ${!current ? "published" : "unpublished"}` });
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="font-semibold text-foreground">All Stocks ({rows.length})</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-muted-foreground font-medium">Symbol</th>
              <th className="text-left px-5 py-3 text-muted-foreground font-medium hidden sm:table-cell">Sector</th>
              <th className="text-left px-5 py-3 text-muted-foreground font-medium hidden md:table-cell">Score</th>
              <th className="text-left px-5 py-3 text-muted-foreground font-medium">Status</th>
              <th className="text-left px-5 py-3 text-muted-foreground font-medium hidden lg:table-cell">Views</th>
              <th className="text-right px-5 py-3 text-muted-foreground font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((stock) => {
              const verdict = parseStrategistVerdict(stock.strategistVerdict);
              return (
                <tr key={stock.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-mono font-semibold text-foreground">{stock.symbol}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-40">{stock.name}</div>
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    <span className="text-muted-foreground text-xs">{stock.sector}</span>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    {verdict ? (
                      <div className="flex items-center gap-2">
                        <span className={`font-bold font-mono ${scoreToColor(verdict.score)}`}>{verdict.score}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded border ${ratingToBadgeClass(verdict.rating)}`}>{verdict.rating}</span>
                      </div>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleToggle(stock.id, stock.symbol, stock.isPublished)}
                      className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors ${
                        stock.isPublished
                          ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {stock.isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {stock.isPublished ? "Live" : "Draft"}
                    </button>
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell text-muted-foreground">
                    {stock.viewCount.toLocaleString()}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Link
                        href={`/admin/stocks/${stock.id}/edit`}
                        className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(stock.id, stock.symbol)}
                        className="p-1.5 rounded-md hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
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
