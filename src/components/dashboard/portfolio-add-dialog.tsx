"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, X, Plus, Loader2 } from "lucide-react";
import { StockLogo } from "@/components/ui/stock-logo";
import { Badge } from "@/components/ui/badge";
import { exchangeFlag } from "@/lib/utils";
import { getLogoUrl } from "@/lib/logo";
import { useLanguage } from "@/lib/i18n/context";
import type { SearchResult } from "@/types";

interface Props {
  onClose: () => void;
  onAdded: () => void;
  portfolioId?: string;
}

export function PortfolioAddDialog({ onClose, onAdded, portfolioId }: Props) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [shares, setShares] = useState("");
  const [avgCost, setAvgCost] = useState("");
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handleAdd = async () => {
    if (!selected) return;
    setAdding(selected.id);
    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockId: selected.id,
          symbol: selected.symbol,
          shares: shares ? parseFloat(shares) : undefined,
          avgCost: avgCost ? parseFloat(avgCost) : undefined,
          portfolioId: portfolioId ?? undefined,
        }),
      });
      if (res.ok) {
        const item = await res.json();
        // Auto-record buy transaction if shares + avg cost were entered
        const sharesNum = shares ? parseFloat(shares) : 0;
        const priceNum = avgCost ? parseFloat(avgCost) : 0;
        if (sharesNum > 0 && priceNum > 0) {
          fetch("/api/portfolio/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              portfolioId: item.portfolioId,
              stockId: selected.id,
              symbol: selected.symbol,
              type: "buy",
              shares: sharesNum,
              price: priceNum,
            }),
          }).catch(() => {});
        }
        onAdded();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add");
      }
    } catch {
      alert("Failed to add stock");
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-[15%] z-50 w-full max-w-lg -translate-x-1/2">
        <div className="mx-4 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground">{t("dashboard.addStock")}</h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          {selected ? (
            /* Selected stock — enter details */
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <StockLogo
                  symbol={selected.symbol}
                  logoUrl={selected.logoUrl || getLogoUrl(selected.symbol, selected.exchange)}
                  exchange={selected.exchange}
                  size={36}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">{selected.symbol}</span>
                    <Badge variant="outline" className="text-xs">
                      {exchangeFlag(selected.exchange)} {selected.exchange}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{selected.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t("dashboard.shares")} (optional)</label>
                  <input
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    type="number"
                    step="any"
                    placeholder="100"
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t("dashboard.avgCost")} (optional)</label>
                  <input
                    value={avgCost}
                    onChange={(e) => setAvgCost(e.target.value)}
                    type="number"
                    step="any"
                    placeholder="50.00"
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelected(null)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm hover:bg-muted transition-colors"
                >
                  {t("dashboard.back")}
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!!adding}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {t("dashboard.addStock")}
                </button>
              </div>
            </div>
          ) : (
            /* Search for stock */
            <>
              <div className="flex items-center border-b border-border px-4">
                <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by ticker or company name..."
                  className="flex h-12 w-full bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
              <div className="max-h-64 overflow-y-auto p-2">
                {loading && (
                  <div className="py-4 text-center text-sm text-muted-foreground animate-pulse">{t("dashboard.searching")}</div>
                )}
                {!loading && results.length > 0 && results.map((stock) => {
                  const logo = stock.logoUrl || getLogoUrl(stock.symbol, stock.exchange);
                  return (
                    <button
                      key={stock.id}
                      onClick={() => setSelected(stock)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <StockLogo symbol={stock.symbol} logoUrl={logo} exchange={stock.exchange} size={28} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-sm">{stock.symbol}</span>
                          <Badge variant="outline" className="text-xs py-0 px-1.5">
                            {exchangeFlag(stock.exchange)} {stock.exchange}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{stock.name}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{stock.sector}</span>
                    </button>
                  );
                })}
                {!loading && query.length > 0 && results.length === 0 && (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    {t("dashboard.noStocksFound")}
                  </div>
                )}
                {!loading && query.length === 0 && (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    {t("dashboard.searchStockHint")}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
