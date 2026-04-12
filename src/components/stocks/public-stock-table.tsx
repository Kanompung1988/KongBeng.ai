"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ChevronDown, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StockLogo } from "@/components/ui/stock-logo";
import { useT, useLanguage } from "@/lib/i18n/context";
import { THAI_INDEXES, US_INDEXES, INDEX_LABELS } from "@/lib/constants/indexes";
import { getLogoUrl } from "@/lib/logo";

interface Stock {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  exchange: string;
  logoUrl: string | null;
  marketIndexes: string[];
  viewCount: number;
}

type FilterTab = "all" | "SET" | "NASDAQ" | "NYSE";
const PAGE_SIZE = 24;

interface Props {
  stocks: Stock[];
}

export function PublicStockTable({ stocks }: Props) {
  const t = useT();
  const { lang } = useLanguage();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [indexFilter, setIndexFilter] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    let list = stocks;

    if (filter !== "all") list = list.filter((s) => s.exchange === filter);

    if (indexFilter) {
      list = list.filter((s) => s.marketIndexes.includes(indexFilter));
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.sector.toLowerCase().includes(q)
      );
    }

    // Sort by viewCount desc, then symbol asc
    return [...list].sort((a, b) => b.viewCount - a.viewCount || a.symbol.localeCompare(b.symbol));
  }, [stocks, search, filter, indexFilter]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const setCount = stocks.filter((s) => s.exchange === "SET").length;
  const nasdaqCount = stocks.filter((s) => s.exchange === "NASDAQ").length;
  const nyseCount = stocks.filter((s) => s.exchange === "NYSE").length;

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: t("trend.allCategories"), count: stocks.length },
    { key: "SET", label: "SET", count: setCount },
    { key: "NASDAQ", label: "NASDAQ", count: nasdaqCount },
    { key: "NYSE", label: "NYSE", count: nyseCount },
  ];

  // Index sub-filters based on selected exchange
  const getSubIndexes = () => {
    if (filter === "SET") return THAI_INDEXES;
    if (filter === "NASDAQ" || filter === "NYSE") return US_INDEXES;
    return [];
  };

  const handleFilterChange = (key: FilterTab) => {
    setFilter(key);
    setIndexFilter(null);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
            {lang === "th" ? "วิเคราะห์หุ้น" : "Stock Analysis"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === "th" ? "วิเคราะห์เชิงลึกโดย Khongbeng Strategist" : "Deep-dive analysis by Khongbeng Strategist"}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }}
            placeholder={lang === "th" ? "ค้นหาหุ้น..." : "Search stocks..."}
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-muted/50 border border-border focus:border-emerald-500/50 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleFilterChange(tab.key)}
            className={`px-4 py-2 text-xs rounded-xl font-medium transition-colors ${
              filter === tab.key
                ? "bg-emerald-500 text-white"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Index sub-filters */}
      {getSubIndexes().length > 0 && (
        <div className="flex gap-1.5 mb-5 flex-wrap">
          <button
            onClick={() => { setIndexFilter(null); setVisibleCount(PAGE_SIZE); }}
            className={`px-2.5 py-1 text-[11px] rounded-lg transition-colors ${
              !indexFilter ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-muted/30 text-muted-foreground border border-transparent hover:text-foreground"
            }`}
          >
            {t("trend.allCategories")}
          </button>
          {getSubIndexes().map((idx) => (
            <button
              key={idx}
              onClick={() => { setIndexFilter(indexFilter === idx ? null : idx); setVisibleCount(PAGE_SIZE); }}
              className={`px-2.5 py-1 text-[11px] rounded-lg transition-colors ${
                indexFilter === idx ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-muted/30 text-muted-foreground border border-transparent hover:text-foreground"
              }`}
            >
              {INDEX_LABELS[idx]?.[lang] || idx}
            </button>
          ))}
        </div>
      )}

      {/* Count */}
      <p className="text-xs text-muted-foreground mb-4">
        {lang === "th"
          ? `แสดง ${visible.length} จาก ${filtered.length} หุ้น`
          : `Showing ${visible.length} of ${filtered.length} stocks`}
      </p>

      {/* Grid cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {visible.map((stock) => (
          <Link
            key={stock.id}
            href={`/stock/${stock.symbol}`}
            className="group glass-card rounded-xl p-4 hover:border-emerald-500/30 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/5"
          >
            <div className="flex items-start gap-3">
              <StockLogo symbol={stock.symbol} logoUrl={stock.logoUrl || getLogoUrl(stock.symbol, stock.exchange)} exchange={stock.exchange} size={36} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-foreground group-hover:text-emerald-400 transition-colors">
                    {stock.symbol}
                  </span>
                  <Badge variant="outline" className="text-[10px] py-0 px-1 shrink-0">
                    {stock.exchange}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{stock.name}</p>
              </div>
            </div>
            {stock.sector && (
              <div className="mt-2.5">
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted/50 text-muted-foreground">
                  {stock.sector}
                </span>
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          {lang === "th" ? "ไม่พบหุ้นที่ค้นหา" : "No stocks found"}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-muted/50 border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-emerald-500/30 transition-all"
          >
            <ChevronDown className="w-4 h-4" />
            {lang === "th"
              ? `โหลดเพิ่ม (${Math.min(PAGE_SIZE, filtered.length - visibleCount)} หุ้น)`
              : `Load More (${Math.min(PAGE_SIZE, filtered.length - visibleCount)} stocks)`}
          </button>
        </div>
      )}
    </div>
  );
}
