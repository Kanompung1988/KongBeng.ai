"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, TrendingUp, Clock } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { exchangeFlag } from "@/lib/utils";
import type { SearchResult } from "@/types";

const RECENT_KEY = "khongbeng_recent_searches";

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recent, setRecent] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_KEY);
    if (stored) setRecent(JSON.parse(stored).slice(0, 5));
  }, [open]);

  // Keyboard shortcut Cmd/Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Debounced search
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

  const navigate = (stock: SearchResult) => {
    // Save to recent
    const updated = [stock, ...recent.filter((r) => r.id !== stock.id)].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    setOpen(false);
    router.push(`/stock/${stock.symbol}`);
  };

  return (
    <>
      {/* Search trigger button */}
      <div className="flex justify-center px-4 pb-8">
        <button
          onClick={() => setOpen(true)}
          className="group flex items-center gap-3 w-full max-w-2xl px-5 py-4 rounded-2xl glass-card border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 hover:emerald-glow"
        >
          <Search className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="flex-1 text-left text-muted-foreground group-hover:text-foreground transition-colors">
            Search any stock — CPALL, NVDA, PTT...
          </span>
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-muted border border-border text-xs text-muted-foreground font-mono">
            <span>⌘</span><span>K</span>
          </kbd>
        </button>
      </div>

      {/* Command Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search by ticker or company name..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && (
            <div className="py-4 text-center text-sm text-muted-foreground animate-pulse">
              Searching...
            </div>
          )}

          {!loading && query.length === 0 && recent.length > 0 && (
            <CommandGroup heading="Recent">
              {recent.map((s) => (
                <StockCommandItem key={s.id} stock={s} onSelect={navigate} icon={<Clock className="w-4 h-4 text-muted-foreground" />} />
              ))}
            </CommandGroup>
          )}

          {!loading && results.length > 0 && (
            <CommandGroup heading="Results">
              {results.map((s) => (
                <StockCommandItem key={s.id} stock={s} onSelect={navigate} icon={<TrendingUp className="w-4 h-4 text-emerald-400" />} />
              ))}
            </CommandGroup>
          )}

          {!loading && query.length > 0 && results.length === 0 && (
            <CommandEmpty>No stocks found for &quot;{query}&quot;</CommandEmpty>
          )}

          {recent.length > 0 && results.length > 0 && <CommandSeparator />}
        </CommandList>
      </CommandDialog>
    </>
  );
}

function StockCommandItem({
  stock,
  onSelect,
  icon,
}: {
  stock: SearchResult;
  onSelect: (s: SearchResult) => void;
  icon: React.ReactNode;
}) {
  return (
    <CommandItem
      value={`${stock.symbol} ${stock.name}`}
      onSelect={() => onSelect(stock)}
      onClick={() => onSelect(stock)}
      className="flex items-center gap-3 py-3 cursor-pointer"
    >
      {stock.logoUrl ? (
        <Image
          src={stock.logoUrl}
          alt={stock.symbol}
          width={24}
          height={24}
          className="rounded bg-white p-0.5 shrink-0"
          unoptimized
        />
      ) : (
        icon
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-foreground">{stock.symbol}</span>
          <Badge variant="outline" className="text-xs py-0 px-1.5">
            {exchangeFlag(stock.exchange)} {stock.exchange}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground truncate">{stock.name}</p>
      </div>
      <span className="text-xs text-muted-foreground shrink-0">{stock.sector}</span>
    </CommandItem>
  );
}
