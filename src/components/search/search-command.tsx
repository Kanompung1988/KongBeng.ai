"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Clock, X } from "lucide-react";
import { useSearchStore } from "@/lib/stores/search-store";
import { Badge } from "@/components/ui/badge";
import { StockLogo } from "@/components/ui/stock-logo";
import { exchangeFlag } from "@/lib/utils";
import { getLogoUrl } from "@/lib/logo";
import type { SearchResult } from "@/types";

const RECENT_KEY = "khongbeng_recent_searches";

export function SearchCommand() {
  const { open, setOpen } = useSearchStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recent, setRecent] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    if (open) {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) setRecent(JSON.parse(stored).slice(0, 5));
      setQuery("");
      setResults([]);
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keyboard shortcut Cmd/Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!useSearchStore.getState().open);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [setOpen]);

  // Debounced search
  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
      setSelectedIdx(0);
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

  const items = query.length > 0 ? results : recent;

  const navigate = useCallback((stock: SearchResult) => {
    const updated = [stock, ...recent.filter((r) => r.id !== stock.id)].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    setOpen(false);
    router.push(`/stock/${stock.symbol}`);
  }, [recent, router, setOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && items[selectedIdx]) {
      e.preventDefault();
      navigate(items[selectedIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }, [items, selectedIdx, navigate, setOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-[20%] z-50 w-full max-w-2xl -translate-x-1/2">
        <div className="mx-4 overflow-hidden rounded-xl border border-border bg-popover shadow-2xl">
          {/* Search input */}
          <div className="flex items-center border-b border-border px-4">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by ticker or company name..."
              className="flex h-12 w-full bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button onClick={() => setOpen(false)} className="ml-2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto p-2">
            {loading && (
              <div className="py-4 text-center text-sm text-muted-foreground animate-pulse">
                Searching...
              </div>
            )}

            {!loading && items.length > 0 && (
              <div>
                <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  {query.length > 0 ? "Results" : "Recent"}
                </p>
                {items.map((stock, idx) => {
                  const logo = stock.logoUrl || getLogoUrl(stock.symbol, stock.exchange);
                  return (
                    <button
                      key={stock.id}
                      onClick={() => navigate(stock)}
                      onMouseEnter={() => setSelectedIdx(idx)}
                      className={`flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition-colors cursor-pointer ${
                        idx === selectedIdx
                          ? "bg-muted text-foreground"
                          : "text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <StockLogo symbol={stock.symbol} logoUrl={logo} exchange={stock.exchange} size={24} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">{stock.symbol}</span>
                          <Badge variant="outline" className="text-xs py-0 px-1.5">
                            {exchangeFlag(stock.exchange)} {stock.exchange}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{stock.name}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{stock.sector}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {!loading && query.length > 0 && results.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No stocks found for &quot;{query}&quot;
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SearchTrigger() {
  const { setOpen } = useSearchStore();
  return (
    <div className="flex justify-center px-4 pb-8">
      <button
        onClick={() => setOpen(true)}
        className="group flex items-center gap-3 w-full max-w-2xl px-5 py-4 rounded-2xl glass-card border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 hover:emerald-glow"
      >
        <Search className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        <span className="flex-1 text-left text-muted-foreground group-hover:text-foreground transition-colors">
          Search any stock -- CPALL, NVDA, PTT...
        </span>
        <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-muted border border-border text-xs text-muted-foreground font-mono">
          Ctrl+K
        </kbd>
      </button>
    </div>
  );
}
