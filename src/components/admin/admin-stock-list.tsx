"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Pencil, Trash2, Eye, EyeOff, Search, Cpu, Filter } from "lucide-react";
import { deleteStockAction, togglePublishAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { exchangeFlag } from "@/lib/utils";

interface StockRow {
  id: string; symbol: string; name: string; sector: string;
  exchange: string; isPublished: boolean; viewCount: number; updatedAt: Date;
  hasAI: boolean;
}

type FilterTab = "all" | "thai" | "us" | "noai" | "draft";

export function AdminStockList({ stocks }: { stocks: StockRow[] }) {
  const { toast } = useToast();
  const [rows, setRows] = useState(stocks);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");

  const filtered = useMemo(() => {
    let result = rows;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.sector.toLowerCase().includes(q));
    }
    switch (filter) {
      case "thai": result = result.filter(s => s.exchange === "SET"); break;
      case "us": result = result.filter(s => s.exchange !== "SET"); break;
      case "noai": result = result.filter(s => !s.hasAI); break;
      case "draft": result = result.filter(s => !s.isPublished); break;
    }
    return result;
  }, [rows, search, filter]);

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

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: rows.length },
    { key: "thai", label: "TH Thai", count: rows.filter(s => s.exchange === "SET").length },
    { key: "us", label: "US", count: rows.filter(s => s.exchange !== "SET").length },
    { key: "noai", label: "No AI", count: rows.filter(s => !s.hasAI).length },
    { key: "draft", label: "Drafts", count: rows.filter(s => !s.isPublished).length },
  ];

  return (
    <div className="glass-card overflow-hidden">
      {/* Header with Search & Filters */}
      <div className="px-5 py-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="font-semibold text-foreground">Stocks ({filtered.length})</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search symbol, name, sector..."
              className="pl-9 pr-4 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500/50 w-64"
            />
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-muted-foreground mr-1" />
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                filter === tab.key
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground border border-transparent"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Symbol</th>
              <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider hidden sm:table-cell">Exchange</th>
              <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider hidden md:table-cell">Sector</th>
              <th className="text-center px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">AI</th>
              <th className="text-center px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Status</th>
              <th className="text-center px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider hidden lg:table-cell">Views</th>
              <th className="text-right px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((stock) => (
              <tr key={stock.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors group">
                <td className="px-5 py-3">
                  <Link href={`/admin/stocks/${stock.id}/edit`} className="block">
                    <div className="font-mono font-bold text-foreground group-hover:text-emerald-400 transition-colors">{stock.symbol}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-48">{stock.name}</div>
                  </Link>
                </td>
                <td className="px-5 py-3 hidden sm:table-cell">
                  <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-muted/50 text-muted-foreground">
                    {exchangeFlag(stock.exchange)} {stock.exchange}
                  </span>
                </td>
                <td className="px-5 py-3 hidden md:table-cell">
                  <span className="text-xs text-muted-foreground">{stock.sector}</span>
                </td>
                <td className="px-5 py-3 text-center">
                  {stock.hasAI ? (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-cyan-500/15 text-cyan-400">
                      <Cpu className="w-3 h-3" /> Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
                      Empty
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-center">
                  <button
                    onClick={() => handleToggle(stock.id, stock.symbol, stock.isPublished)}
                    className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-colors ${
                      stock.isPublished
                        ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                        : "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25"
                    }`}
                  >
                    {stock.isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {stock.isPublished ? "Live" : "Draft"}
                  </button>
                </td>
                <td className="px-5 py-3 hidden lg:table-cell text-center">
                  <span className="text-xs text-muted-foreground font-mono">{stock.viewCount.toLocaleString()}</span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <Link
                      href={`/admin/stocks/${stock.id}/edit`}
                      className="p-2 rounded-lg hover:bg-emerald-500/10 transition-colors text-muted-foreground hover:text-emerald-400"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(stock.id, stock.symbol)}
                      className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No stocks found matching your search.
        </div>
      )}
    </div>
  );
}
