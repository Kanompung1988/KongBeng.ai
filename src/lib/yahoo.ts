// Yahoo Finance utility for fetching stock quotes
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export interface QuoteData {
  price: number | null;
  change: number | null;
  changePercent: number | null;
  pe: number | null;
  marketCap: number | null;
  currency: string;
}

// Thai SET stocks need .BK suffix for Yahoo Finance
function getYahooSymbol(symbol: string, exchange: string): string {
  if (exchange === "SET") return `${symbol}.BK`;
  return symbol;
}

// Simple in-memory cache with TTL
const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CHART_CACHE_TTL = 15 * 60 * 1000; // 15 minutes for daily chart data
const INTRADAY_CACHE_TTL = 60 * 1000; // 60s for intraday

export async function getQuote(symbol: string, exchange: string): Promise<QuoteData> {
  const cacheKey = `quote:${symbol}:${exchange}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.data as QuoteData;

  const yahooSym = getYahooSymbol(symbol, exchange);

  try {
    const quote = await yahooFinance.quote(yahooSym) as Record<string, unknown>;
    const data: QuoteData = {
      price: (quote.regularMarketPrice as number) ?? null,
      change: (quote.regularMarketChange as number) ?? null,
      changePercent: (quote.regularMarketChangePercent as number) ?? null,
      pe: (quote.trailingPE as number) ?? null,
      marketCap: (quote.marketCap as number) ?? null,
      currency: (quote.currency as string) || (exchange === "SET" ? "THB" : "USD"),
    };
    cache.set(cacheKey, { data, expires: Date.now() + CACHE_TTL });
    return data;
  } catch (err) {
    console.warn(`[yahoo] Failed to fetch ${yahooSym}:`, err);
    const fallback: QuoteData = { price: null, change: null, changePercent: null, pe: null, marketCap: null, currency: exchange === "SET" ? "THB" : "USD" };
    cache.set(cacheKey, { data: fallback, expires: Date.now() + CACHE_TTL });
    return fallback;
  }
}

export async function getQuotes(stocks: { symbol: string; exchange: string }[]): Promise<Map<string, QuoteData>> {
  const results = new Map<string, QuoteData>();

  // Fetch in parallel, batches of 10 to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < stocks.length; i += batchSize) {
    const batch = stocks.slice(i, i + batchSize);
    const promises = batch.map(async (s) => {
      const data = await getQuote(s.symbol, s.exchange);
      results.set(s.symbol, data);
    });
    await Promise.all(promises);
  }

  return results;
}

// ─── Historical Chart Data ──────────────────────────────────────────────────
export type ChartRange = "1d" | "5d" | "1mo" | "3mo" | "ytd" | "1y";

interface ChartPoint {
  timestamp: number;
  date: string;
  close: number;
}

function getChartParams(range: ChartRange): { period1: Date; interval: string; cacheTtl: number } {
  const now = new Date();
  switch (range) {
    case "1d": return { period1: new Date(now.getTime() - 2 * 86400000), interval: "5m", cacheTtl: INTRADAY_CACHE_TTL };
    case "5d": return { period1: new Date(now.getTime() - 7 * 86400000), interval: "15m", cacheTtl: INTRADAY_CACHE_TTL };
    case "1mo": return { period1: new Date(now.getTime() - 35 * 86400000), interval: "1d", cacheTtl: CHART_CACHE_TTL };
    case "3mo": return { period1: new Date(now.getTime() - 100 * 86400000), interval: "1d", cacheTtl: CHART_CACHE_TTL };
    case "ytd": {
      const jan1 = new Date(now.getFullYear(), 0, 1);
      return { period1: jan1, interval: "1d", cacheTtl: CHART_CACHE_TTL };
    }
    case "1y": return { period1: new Date(now.getTime() - 370 * 86400000), interval: "1wk", cacheTtl: CHART_CACHE_TTL };
  }
}

export async function getChart(symbol: string, exchange: string, range: ChartRange): Promise<ChartPoint[]> {
  const cacheKey = `chart:${symbol}:${exchange}:${range}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.data as ChartPoint[];

  const yahooSym = getYahooSymbol(symbol, exchange);
  const { period1, interval, cacheTtl } = getChartParams(range);

  try {
    const result = await yahooFinance.chart(yahooSym, {
      period1,
      period2: new Date(),
      interval: interval as "1d" | "1wk" | "1mo",
    }) as unknown as Record<string, unknown>;

    const quotes = (result as { quotes?: Array<{ date?: Date; close?: number | null }> }).quotes || [];
    const points: ChartPoint[] = [];
    for (const q of quotes) {
      if (q.date && q.close != null) {
        points.push({
          timestamp: new Date(q.date).getTime(),
          date: new Date(q.date).toISOString().split("T")[0],
          close: q.close,
        });
      }
    }

    cache.set(cacheKey, { data: points, expires: Date.now() + cacheTtl });
    return points;
  } catch (err) {
    console.warn(`[yahoo] Chart failed for ${yahooSym}:`, err);
    cache.set(cacheKey, { data: [], expires: Date.now() + INTRADAY_CACHE_TTL });
    return [];
  }
}

// ─── Exchange Rate ──────────────────────────────────────────────────────────
export async function getExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;
  const cacheKey = `fx:${from}${to}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.data as number;

  try {
    const pair = `${from}${to}=X`;
    const quote = await yahooFinance.quote(pair) as Record<string, unknown>;
    const rate = (quote.regularMarketPrice as number) || 1;
    cache.set(cacheKey, { data: rate, expires: Date.now() + CACHE_TTL });
    return rate;
  } catch (err) {
    console.warn(`[yahoo] FX rate failed for ${from}/${to}:`, err);
    // Fallback rates
    if (from === "USD" && to === "THB") return 34.5;
    if (from === "THB" && to === "USD") return 1 / 34.5;
    return 1;
  }
}
