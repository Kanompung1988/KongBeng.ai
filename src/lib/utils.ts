import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type {
  CoreBusinessData,
  CustomerBaseData,
  RevenueModelData,
  FinancialsData,
  SevenPowersData,
  StorySCurveData,
  RisksData,
  CeoProfileData,
  ShareholdersData,
  RecentNewsData,
} from "@/types";

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

// ─── Section Parsers ─────────────────────────────────────────────────────────
export function parseCoreBusiness(raw: string | null | undefined): CoreBusinessData | null {
  return safeJsonParse<CoreBusinessData | null>(raw, null);
}

export function parseCustomerBase(raw: string | null | undefined): CustomerBaseData | null {
  return safeJsonParse<CustomerBaseData | null>(raw, null);
}

export function parseRevenueModel(raw: string | null | undefined): RevenueModelData | null {
  return safeJsonParse<RevenueModelData | null>(raw, null);
}

export function parseFinancials(raw: string | null | undefined): FinancialsData | null {
  return safeJsonParse<FinancialsData | null>(raw, null);
}

export function parseSevenPowers(raw: string | null | undefined): SevenPowersData | null {
  return safeJsonParse<SevenPowersData | null>(raw, null);
}

export function parseStorySCurve(raw: string | null | undefined): StorySCurveData | null {
  return safeJsonParse<StorySCurveData | null>(raw, null);
}

export function parseRisks(raw: string | null | undefined): RisksData | null {
  return safeJsonParse<RisksData | null>(raw, null);
}

export function parseCeoProfile(raw: string | null | undefined): CeoProfileData | null {
  return safeJsonParse<CeoProfileData | null>(raw, null);
}

export function parseShareholders(raw: string | null | undefined): ShareholdersData | null {
  return safeJsonParse<ShareholdersData | null>(raw, null);
}

export function parseRecentNews(raw: string | null | undefined): RecentNewsData | null {
  return safeJsonParse<RecentNewsData | null>(raw, null);
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

// Severity/level to color
export function levelToColor(level: "high" | "medium" | "low"): string {
  switch (level) {
    case "high": return "text-red-400";
    case "medium": return "text-gold-400";
    case "low": return "text-emerald-400";
  }
}

export function levelToBadgeClass(level: "high" | "medium" | "low"): string {
  switch (level) {
    case "high": return "bg-red-500/20 text-red-300 border-red-500/30";
    case "medium": return "bg-gold-500/20 text-gold-300 border-gold-500/30";
    case "low": return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
  }
}

export function verdictToColor(verdict: "delivered" | "partial" | "missed" | "beat" | "meet" | "miss"): string {
  switch (verdict) {
    case "delivered":
    case "beat": return "text-emerald-400";
    case "partial":
    case "meet": return "text-gold-400";
    case "missed":
    case "miss": return "text-red-400";
  }
}
