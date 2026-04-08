import { exchangeFlag } from "@/lib/utils";
import { Eye, Clock } from "lucide-react";
import Image from "next/image";
import type { StockWithAdmin } from "@/types";

interface Props {
  stock: StockWithAdmin;
}

export function StockHero({ stock }: Props) {
  return (
    <div className="border-b border-border bg-card/30">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          {/* Left: Name & Meta */}
          <div>
            <div className="flex items-center gap-4 mb-2">
              {stock.logoUrl ? (
                <Image
                  src={stock.logoUrl}
                  alt={stock.symbol}
                  width={48}
                  height={48}
                  className="rounded-lg bg-white p-1"
                  unoptimized
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center text-lg font-bold text-emerald-400">
                  {stock.symbol.slice(0, 2)}
                </div>
              )}
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
            </div>
          </div>
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
