"use client";

import { memo } from "react";
import { BarChart3, ExternalLink } from "lucide-react";

interface TradingViewChartProps {
  symbol: string;
  exchange: string;
  height?: number;
  theme?: "dark" | "light";
}

function getTradingViewSymbol(symbol: string, exchange: string): string {
  if (exchange === "SET") return `SET:${symbol}`;
  if (exchange === "NASDAQ") return `NASDAQ:${symbol}`;
  if (exchange === "NYSE") return `NYSE:${symbol}`;
  return symbol;
}

// TradingView free embed only supports NASDAQ/NYSE — not SET
const EMBED_SUPPORTED_EXCHANGES = new Set(["NASDAQ", "NYSE"]);

function TradingViewChartInner({ symbol, exchange, height = 400, theme = "dark" }: TradingViewChartProps) {
  const tvSymbol = getTradingViewSymbol(symbol, exchange);

  // SET stocks are not available in free TradingView embeds
  if (!EMBED_SUPPORTED_EXCHANGES.has(exchange)) {
    const tvUrl = `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(tvSymbol)}`;
    return (
      <div
        className="rounded-xl overflow-hidden border border-border bg-muted/20 flex flex-col items-center justify-center gap-4"
        style={{ height: Math.min(height, 180) }}
      >
        <BarChart3 className="w-8 h-8 text-muted-foreground/50" />
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Interactive chart for <span className="font-semibold text-foreground">{tvSymbol}</span>
          </p>
          <a
            href={tvUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-emerald-500 hover:text-emerald-400 transition-colors"
          >
            View on TradingView <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  // US stocks — use iframe embed
  const src = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${encodeURIComponent(tvSymbol)}&interval=D&hidesidetoolbar=1&symboledit=0&saveimage=0&theme=${theme}&style=1&timezone=America%2FNew_York&withdateranges=1&hide_volume=0&studies=[]&overrides={}&enabled_features=[]&disabled_features=[]&locale=en`;

  return (
    <div className="rounded-xl overflow-hidden border border-border" style={{ height }}>
      <iframe
        src={src}
        style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}

export const TradingViewChart = memo(TradingViewChartInner);

// Mini chart for dashboard / portfolio
interface TradingViewMiniChartProps {
  symbol: string;
  exchange: string;
  width?: number;
  height?: number;
  theme?: "dark" | "light";
}

function TradingViewMiniChartInner({ symbol, exchange, width = 350, height = 220, theme = "dark" }: TradingViewMiniChartProps) {
  const tvSymbol = getTradingViewSymbol(symbol, exchange);

  if (!EMBED_SUPPORTED_EXCHANGES.has(exchange)) {
    return null; // Don't show mini chart for unsupported exchanges
  }

  const src = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_mini&symbol=${encodeURIComponent(tvSymbol)}&interval=D&hidesidetoolbar=1&symboledit=0&saveimage=0&theme=${theme}&style=3&timezone=exchange&withdateranges=0&hide_volume=1&studies=[]&overrides={}&enabled_features=[]&disabled_features=[]&locale=en`;

  return (
    <div className="overflow-hidden rounded-lg" style={{ width, height }}>
      <iframe
        src={src}
        style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        loading="lazy"
      />
    </div>
  );
}

export const TradingViewMiniChart = memo(TradingViewMiniChartInner);
