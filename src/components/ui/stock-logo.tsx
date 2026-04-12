"use client";

import { useState } from "react";
import { getGoogleFaviconUrl } from "@/lib/logo";

interface StockLogoProps {
  symbol: string;
  logoUrl: string | null;
  exchange?: string;
  size?: number;
  className?: string;
}

function Initials({ symbol, size, className }: { symbol: string; size: number; className: string }) {
  return (
    <div
      className={`rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <span className="font-bold text-emerald-400" style={{ fontSize: size * 0.35 }}>
        {symbol.slice(0, 2)}
      </span>
    </div>
  );
}

function buildUrls(logoUrl: string | null, symbol: string, exchange?: string): string[] {
  const urls: string[] = [];

  if (logoUrl) {
    urls.push(logoUrl);
    // Auto-derive Google favicon fallback from Clearbit URL
    const clearbitDomain = logoUrl.match(/https:\/\/logo\.clearbit\.com\/(.+)/)?.[1];
    if (clearbitDomain) {
      urls.push(getGoogleFaviconUrl(clearbitDomain));
    }
  }

  // For SET stocks without a mapped URL, try best-guess domain via Google favicon
  if (!logoUrl && exchange === "SET") {
    const sym = symbol.toLowerCase();
    urls.push(getGoogleFaviconUrl(`${sym}.co.th`));
    urls.push(getGoogleFaviconUrl(`${sym}.com`));
  }

  return urls;
}

export function StockLogo({ symbol, logoUrl, exchange, size = 36, className = "" }: StockLogoProps) {
  const [urlIdx, setUrlIdx] = useState(0);
  const urls = buildUrls(logoUrl, symbol, exchange);

  const advance = () => setUrlIdx((i) => i + 1);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Treat tiny (≤16px) images as failures — Google returns a 16×16 globe for unknown domains
    if (e.currentTarget.naturalWidth <= 16) advance();
  };

  const currentUrl = urls[urlIdx];

  if (!currentUrl) {
    return <Initials symbol={symbol} size={size} className={className} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      suppressHydrationWarning
      src={currentUrl}
      alt={symbol}
      width={size}
      height={size}
      className={`rounded-lg bg-white p-0.5 shrink-0 ${className}`}
      onError={advance}
      onLoad={handleLoad}
    />
  );
}
