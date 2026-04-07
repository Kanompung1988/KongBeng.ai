import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { RevenueStructureData, FinancialRatios, StrategistVerdict } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Safe JSON parse with type guard
export function safeJsonParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

// Parse revenue structure from DB text field
export function parseRevenueStructure(raw: string | null | undefined): RevenueStructureData | null {
  return safeJsonParse<RevenueStructureData | null>(raw, null);
}

// Parse financial health from DB text field
export function parseFinancialHealth(raw: string | null | undefined): FinancialRatios | null {
  return safeJsonParse<FinancialRatios | null>(raw, null);
}

// Parse strategist verdict from DB text field
export function parseStrategistVerdict(raw: string | null | undefined): StrategistVerdict | null {
  return safeJsonParse<StrategistVerdict | null>(raw, null);
}

// Format large numbers (THB / USD)
export function formatNumber(
  value: number | undefined | null,
  options: { currency?: string; compact?: boolean } = {}
): string {
  if (value == null) return "N/A";
  const { currency, compact = true } = options;

  if (compact) {
    if (Math.abs(value) >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(2)}M${currency ? ` ${currency}` : ""}`;
    }
    if (Math.abs(value) >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K${currency ? ` ${currency}` : ""}`;
    }
  }

  return new Intl.NumberFormat("en-US", {
    style: currency ? "currency" : "decimal",
    currency: currency || undefined,
    maximumFractionDigits: 2,
  }).format(value);
}

// Format percentage
export function formatPercent(value: number | undefined | null): string {
  if (value == null) return "N/A";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

// Score to color mapping
export function scoreToColor(score: number): string {
  if (score >= 8) return "text-emerald-400";
  if (score >= 6) return "text-gold-400";
  if (score >= 4) return "text-orange-400";
  return "text-red-400";
}

// Rating to badge class
export function ratingToBadgeClass(rating: string): string {
  switch (rating) {
    case "STRONG BUY": return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    case "BUY":        return "bg-emerald-600/20 text-emerald-400 border-emerald-600/30";
    case "HOLD":       return "bg-gold-500/20 text-gold-300 border-gold-500/30";
    case "REDUCE":     return "bg-orange-500/20 text-orange-300 border-orange-500/30";
    case "SELL":       return "bg-red-500/20 text-red-300 border-red-500/30";
    default:           return "bg-muted text-muted-foreground border-border";
  }
}

// Truncate text
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

// Exchange flag emoji
export function exchangeFlag(exchange: string): string {
  switch (exchange.toUpperCase()) {
    case "SET":    return "🇹🇭";
    case "NASDAQ": return "🇺🇸";
    case "NYSE":   return "🇺🇸";
    case "SGX":    return "🇸🇬";
    case "HKEX":   return "🇭🇰";
    default:       return "🌐";
  }
}
