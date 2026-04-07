import { parseStrategistVerdict, ratingToBadgeClass, scoreToColor, exchangeFlag } from "@/lib/utils";
import { Eye, Clock } from "lucide-react";
import type { StockWithAdmin } from "@/types";

interface Props {
  stock: StockWithAdmin;
}

export function StockHero({ stock }: Props) {
  const verdict = parseStrategistVerdict(stock.strategistVerdict);

  return (
    <div className="border-b border-border bg-card/30">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          {/* Left: Name & Meta */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl sm:text-4xl font-bold font-mono text-foreground">
                {stock.symbol}
              </h1>
              <span className="text-lg text-muted-foreground">
                {exchangeFlag(stock.exchange)} {stock.exchange}
              </span>
            </div>
            <p className="text-lg text-muted-foreground mb-3">{stock.name}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-2.5 py-1 rounded-md bg-muted text-sm text-muted-foreground">
                {stock.sector}
              </span>
              {verdict && (
                <span className={`px-3 py-1 rounded-md border text-sm font-semibold ${ratingToBadgeClass(verdict.rating)}`}>
                  {verdict.rating}
                </span>
              )}
            </div>
          </div>

          {/* Right: Score */}
          {verdict && (
            <div className="flex flex-col items-center glass-card px-8 py-5 rounded-2xl border border-emerald-500/20">
              <span className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                Strategist Score
              </span>
              <div className={`text-5xl font-bold ${scoreToColor(verdict.score)}`}>
                {verdict.score}
              </div>
              <span className="text-muted-foreground text-sm">/10</span>
            </div>
          )}
        </div>

        {/* Meta footer */}
        <div className="flex items-center gap-4 mt-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            {stock.viewCount.toLocaleString()} views
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Updated {new Date(stock.updatedAt).toLocaleDateString("en-GB", {
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
