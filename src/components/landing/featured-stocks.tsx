"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { exchangeFlag } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/context";
import { StockLogo } from "@/components/ui/stock-logo";

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

// Normalize similar sector names into canonical keys
const SECTOR_NORMALIZE: Record<string, string> = {
  "Finance": "Financials",
  "Financial Services": "Financials",
  "Healthcare": "Health Care",
  "Industrial": "Industrials",
  "Consumer": "Consumer Staples",
  "Consumer Defensive": "Consumer Staples",
  "Consumer Cyclical": "Consumer Discretionary",
  "Telecom": "Communication Services",
  "Services": "Industrials",
  "Food&Beverage": "Consumer Staples",
  "Transport": "Industrials",
};

// Bilingual sector labels
const SECTOR_LABELS: Record<string, { th: string; en: string }> = {
  "Energy": { th: "พลังงาน", en: "Energy" },
  "Financials": { th: "การเงิน", en: "Financials" },
  "Technology": { th: "เทคโนโลยี", en: "Technology" },
  "Information Technology": { th: "เทคโนโลยีสารสนเทศ", en: "Information Technology" },
  "Health Care": { th: "สุขภาพ", en: "Health Care" },
  "Industrials": { th: "อุตสาหกรรม", en: "Industrials" },
  "Consumer Discretionary": { th: "สินค้าฟุ่มเฟือย", en: "Consumer Discretionary" },
  "Consumer Staples": { th: "สินค้าอุปโภคบริโภค", en: "Consumer Staples" },
  "Real Estate": { th: "อสังหาริมทรัพย์", en: "Real Estate" },
  "Materials": { th: "วัสดุ", en: "Materials" },
  "Basic Materials": { th: "วัตถุดิบ", en: "Basic Materials" },
  "Utilities": { th: "สาธารณูปโภค", en: "Utilities" },
  "Communication Services": { th: "สื่อสาร", en: "Communication Services" },
};

function normalizeSector(sector: string): string {
  return SECTOR_NORMALIZE[sector] || sector;
}

function getSectorLabel(sector: string, lang: "th" | "en"): string {
  return SECTOR_LABELS[sector]?.[lang] || sector;
}

export function FeaturedStocks({ thaiStocks, usStocks }: Props) {
  const [tab, setTab] = useState<"th" | "us">("th");
  const [activeSector, setActiveSector] = useState<string | null>(null);
  const { lang, t } = useLanguage();
  const stocks = tab === "th" ? thaiStocks : usStocks;

  // Group stocks by normalized sector
  const { sectors, grouped } = useMemo(() => {
    const map: Record<string, StockCard[]> = {};
    for (const stock of stocks) {
      const key = normalizeSector(stock.sector);
      if (!map[key]) map[key] = [];
      map[key].push(stock);
    }
    // Sort sectors by count descending
    const sorted = Object.keys(map).sort((a, b) => map[b].length - map[a].length);
    return { sectors: sorted, grouped: map };
  }, [stocks]);

  const displayStocks = activeSector ? (grouped[activeSector] || []) : stocks;

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
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => { setTab("th"); setActiveSector(null); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === "th"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "glass-card text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>TH</span>
          <span>{t("featured.thaiStocks")} ({thaiStocks.length})</span>
        </button>
        <button
          onClick={() => { setTab("us"); setActiveSector(null); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === "us"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "glass-card text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>US</span>
          <span>{t("featured.usStocks")} ({usStocks.length})</span>
        </button>
      </div>

      {/* Sector Filter */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button
          onClick={() => setActiveSector(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeSector === null
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          {t("featured.allSectors")} ({stocks.length})
        </button>
        {sectors.map((sector) => (
          <button
            key={sector}
            onClick={() => setActiveSector(activeSector === sector ? null : sector)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeSector === sector
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {getSectorLabel(sector, lang)} ({grouped[sector].length})
          </button>
        ))}
      </div>

      {/* Stock Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {displayStocks.map((stock) => (
          <Link
            key={stock.id}
            href={`/stock/${stock.symbol}`}
            className="glass-card-premium p-4 transition-all duration-300 group block"
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <StockLogo symbol={stock.symbol} logoUrl={stock.logoUrl ?? null} exchange={stock.exchange} size={32} />
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
              {getSectorLabel(normalizeSector(stock.sector), lang)}
            </span>
          </Link>
        ))}
      </div>

      {displayStocks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("featured.noStocks")}</p>
        </div>
      )}
    </section>
  );
}
