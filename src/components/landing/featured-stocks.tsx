import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import type { Stock } from "@/types";
import { parseStrategistVerdict, scoreToColor, ratingToBadgeClass, exchangeFlag } from "@/lib/utils";

interface Props {
  stocks: Pick<Stock, "id" | "symbol" | "name" | "sector" | "exchange" | "logoUrl" | "strategistVerdict">[];
}

export function FeaturedStocks({ stocks }: Props) {
  if (stocks.length === 0) return null;

  return (
    <section id="featured" className="px-6 py-16 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h2 className="text-2xl font-bold text-foreground">Featured Analysis</h2>
          </div>
          <p className="text-muted-foreground mt-1">Deep-dive stock analysis by KongBeng Strategist</p>
        </div>
        <Link
          href="/stocks"
          className="hidden sm:flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          View all <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {stocks.map((stock) => {
          const verdict = parseStrategistVerdict(stock.strategistVerdict);
          return (
            <Link
              key={stock.id}
              href={`/stock/${stock.symbol}`}
              className="glass-card-premium p-5 transition-all duration-300 group block"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-lg text-foreground group-hover:text-emerald-400 transition-colors">
                      {stock.symbol}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {exchangeFlag(stock.exchange)} {stock.exchange}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">{stock.name}</p>
                </div>
                {verdict && (
                  <div className="text-right shrink-0 ml-3">
                    <div className={`text-3xl font-bold ${scoreToColor(verdict.score)}`}>
                      {verdict.score}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">/10</div>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground bg-muted/80 px-2.5 py-1 rounded-md">
                  {stock.sector}
                </span>
                {verdict && (
                  <span className={`text-xs px-2.5 py-1 rounded-md border font-semibold ${ratingToBadgeClass(verdict.rating)}`}>
                    {verdict.rating}
                  </span>
                )}
              </div>

              {/* Summary */}
              {verdict?.summary && (
                <p className="text-xs text-muted-foreground mt-4 line-clamp-2 leading-relaxed border-t border-border/50 pt-3">
                  {verdict.summary}
                </p>
              )}
            </Link>
          );
        })}
      </div>

      {/* Mobile view all */}
      <div className="sm:hidden text-center mt-6">
        <Link
          href="/stocks"
          className="inline-flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          View all stocks <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
