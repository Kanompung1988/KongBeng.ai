"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { TrendingUp } from "lucide-react";
import { exchangeFlag } from "@/lib/utils";
import { useT } from "@/lib/i18n/context";

interface StockCard {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  exchange: string;
  logoUrl?: string | null;
}

interface Props {
  thaiStocks: StockCard[];
  usStocks: StockCard[];
}

export function FeaturedStocks({ thaiStocks, usStocks }: Props) {
  const [tab, setTab] = useState<"th" | "us">("th");
  const t = useT();
  const stocks = tab === "th" ? thaiStocks : usStocks;

  if (thaiStocks.length === 0 && usStocks.length === 0) return null;

  return (
    <section id="featured" className="px-6 py-16 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h2 className="text-2xl font-bold text-foreground">{t("featured.title")}</h2>
          </div>
          <p className="text-muted-foreground mt-1">{t("featured.subtitle")}</p>
        </div>
      </div>

      {/* Market Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setTab("th")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === "th"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "glass-card text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>🇹🇭</span>
          <span>{t("featured.thaiStocks")} ({thaiStocks.length})</span>
        </button>
        <button
          onClick={() => setTab("us")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === "us"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "glass-card text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>🇺🇸</span>
          <span>{t("featured.usStocks")} ({usStocks.length})</span>
        </button>
      </div>

      {/* Stock Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {stocks.map((stock) => (
          <Link
            key={stock.id}
            href={`/stock/${stock.symbol}`}
            className="glass-card-premium p-4 transition-all duration-300 group block"
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              {stock.logoUrl ? (
                <Image
                  src={stock.logoUrl}
                  alt={stock.symbol}
                  width={32}
                  height={32}
                  className="rounded-md bg-white p-0.5"
                  unoptimized
                />
              ) : (
                <div className="w-8 h-8 rounded-md bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">
                  {stock.symbol.slice(0, 2)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-lg text-foreground group-hover:text-emerald-400 transition-colors">
                    {stock.symbol}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {exchangeFlag(stock.exchange)} {stock.exchange}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1 mb-3">{stock.name}</p>
            <span className="text-xs text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-md">
              {stock.sector}
            </span>
          </Link>
        ))}
      </div>

      {stocks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("featured.noStocks")}</p>
        </div>
      )}
    </section>
  );
}
