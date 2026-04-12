"use client";
import { useState, useEffect } from "react";
import { exchangeFlag } from "@/lib/utils";
import { Eye, Clock, Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import type { StockWithAdmin } from "@/types";
import { useT, useLanguage } from "@/lib/i18n/context";
import { StockLogo } from "@/components/ui/stock-logo";
import { createClient } from "@/lib/supabase/client";

interface Props {
  stock: StockWithAdmin;
}

export function StockHero({ stock }: Props) {
  const t = useT();
  const { lang } = useLanguage();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [inPortfolio, setInPortfolio] = useState(false);
  const [portfolioLoading, setPortfolioLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser({ id: user.id });
        // Check if stock is in portfolio
        fetch("/api/portfolio").then(r => r.json()).then(data => {
          if (data.items?.some((item: { stockId: string }) => item.stockId === stock.id)) {
            setInPortfolio(true);
          }
        }).catch(() => {});
      }
    });
  }, [stock.id]);

  const handleTogglePortfolio = async () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setPortfolioLoading(true);
    try {
      if (inPortfolio) {
        // Find and remove
        const res = await fetch("/api/portfolio");
        const data = await res.json();
        const item = data.items?.find((i: { stockId: string }) => i.stockId === stock.id);
        if (item) {
          await fetch(`/api/portfolio?itemId=${item.id}`, { method: "DELETE" });
          setInPortfolio(false);
        }
      } else {
        const res = await fetch("/api/portfolio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stockId: stock.id, symbol: stock.symbol }),
        });
        if (res.ok) setInPortfolio(true);
      }
    } catch { /* ignore */ }
    setPortfolioLoading(false);
  };

  return (
    <div className="border-b border-border bg-card/30">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          {/* Left: Name & Meta */}
          <div>
            <div className="flex items-center gap-4 mb-2">
              <StockLogo symbol={stock.symbol} logoUrl={stock.logoUrl ?? null} exchange={stock.exchange} size={48} className="p-1" />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl sm:text-4xl font-bold font-mono text-foreground">
                    {stock.symbol}
                  </h1>
                  <span className="text-lg text-muted-foreground">
                    {exchangeFlag(stock.exchange)} {stock.exchange}
                  </span>
                </div>
                <p className="text-lg text-muted-foreground">{stock.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-2.5 py-1 rounded-md bg-muted text-sm text-muted-foreground">
                {stock.sector}
              </span>
              {/* Add to Portfolio button */}
              <button
                onClick={handleTogglePortfolio}
                disabled={portfolioLoading}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm transition-colors ${
                  inPortfolio
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-muted hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-400 border border-transparent hover:border-emerald-500/20"
                }`}
                title={user ? (inPortfolio ? t("dashboard.inPortfolio") : t("dashboard.addStock")) : t("nav.signIn")}
              >
                {portfolioLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : inPortfolio ? (
                  <BookmarkCheck className="w-3.5 h-3.5" />
                ) : (
                  <Bookmark className="w-3.5 h-3.5" />
                )}
                {inPortfolio ? t("dashboard.inPortfolio") : t("dashboard.addStock")}
              </button>
            </div>
          </div>
        </div>

        {/* Meta footer */}
        <div className="flex items-center gap-4 mt-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            {stock.viewCount.toLocaleString()} {t("hero.views")}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {t("hero.updated")} {new Date(stock.updatedAt).toLocaleDateString(lang === "th" ? "th-TH" : "en-GB", {
              day: "2-digit", month: "short", year: "numeric"
            })}
          </div>
          {stock.updatedBy && (
            <span>by {stock.updatedBy.name || stock.updatedBy.email}</span>
          )}
        </div>
      </div>
    </div>
  );
}
