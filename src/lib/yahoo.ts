// Stock market data via Finnhub (commercial-licensed free tier)
// Docs: https://finnhub.io/docs/api — replaces yahoo-finance2 (ToS violation)

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const BASE = "https://finnhub.io/api/v1";

// For Thai SET stocks use SET: prefix; US stocks use symbol directly
function getFinnhubSymbol(symbol: string, exchange: string): string {
  if (exchange === "SET") return `SET:${symbol}`;
  return symbol;
}

// ─── In-memory cache ────────────────────────────────────────────────────────
const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000;
const CHART_CACHE_TTL = 15 * 60 * 1000;
const INTRADAY_CACHE_TTL = 60 * 1000;

// ─── Quote ───────────────────────────────────────────────────────────────────
export interface QuoteData {
  price: number | null;
  change: number | null;
  changePercent: number | null;
  pe: number | null;
  marketCap: number | null;
  currency: string;
}

export async function getQuote(symbol: string, exchange: string): Promise<QuoteData> {
  const cacheKey = `quote:${symbol}:${exchange}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.data as QuoteData;

  const fallback: QuoteData = {
    price: null, change: null, changePercent: null,
    pe: null, marketCap: null,
    currency: exchange === "SET" ? "THB" : "USD",
  };

  if (!FINNHUB_API_KEY) {
    console.warn("[finnhub] FINNHUB_API_KEY not set");
    return fallback;
  }

  const fSym = getFinnhubSymbol(symbol, exchange);
  try {
    const res = await fetch(
      `${BASE}/quote?symbol=${encodeURIComponent(fSym)}&token=${FINNHUB_API_KEY}`,
      { next: { revalidate: 300 } } // 5-min cache shared across serverless instances
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const q = await res.json();
    // Finnhub quote: { c: current, d: change, dp: changePercent, h, l, o, pc, t }
    if (!q.c || q.c === 0) {
      cache.set(cacheKey, { data: fallback, expires: Date.now() + CACHE_TTL });
      return fallback;
    }
    const data: QuoteData = {
      price: q.c,
      change: q.d ?? null,
      changePercent: q.dp ?? null,
      pe: null,       // pe/marketCap not in real-time quote; use DB-stored values
      marketCap: null,
      currency: exchange === "SET" ? "THB" : "USD",
    };
    cache.set(cacheKey, { data, expires: Date.now() + CACHE_TTL });
    return data;
  } catch (err) {
    console.warn(`[finnhub] Failed to fetch ${fSym}:`, err);
    cache.set(cacheKey, { data: fallback, expires: Date.now() + CACHE_TTL });
    return fallback;
  }
}

export async function getQuotes(
  stocks: { symbol: string; exchange: string }[]
): Promise<Map<string, QuoteData>> {
  const results = new Map<string, QuoteData>();
  const batchSize = 10;
  for (let i = 0; i < stocks.length; i += batchSize) {
    const batch = stocks.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (s) => {
        results.set(s.symbol, await getQuote(s.symbol, s.exchange));
      })
    );
  }
  return results;
}

// ─── Historical Chart Data ───────────────────────────────────────────────────
export type ChartRange = "1d" | "5d" | "1mo" | "3mo" | "ytd" | "1y";

interface ChartPoint {
  timestamp: number;
  date: string;
  close: number;
}

function getChartParams(range: ChartRange): {
  fromOffset: number;
  resolution: string;
  cacheTtl: number;
} {
  switch (range) {
    case "1d":  return { fromOffset: 2 * 86400,   resolution: "5",  cacheTtl: INTRADAY_CACHE_TTL };
    case "5d":  return { fromOffset: 7 * 86400,   resolution: "15", cacheTtl: INTRADAY_CACHE_TTL };
    case "1mo": return { fromOffset: 35 * 86400,  resolution: "D",  cacheTtl: CHART_CACHE_TTL };
    case "3mo": return { fromOffset: 100 * 86400, resolution: "D",  cacheTtl: CHART_CACHE_TTL };
    case "ytd": return { fromOffset: 0,           resolution: "D",  cacheTtl: CHART_CACHE_TTL };
    case "1y":  return { fromOffset: 370 * 86400, resolution: "W",  cacheTtl: CHART_CACHE_TTL };
  }
}

export async function getChart(
  symbol: string,
  exchange: string,
  range: ChartRange
): Promise<ChartPoint[]> {
  const cacheKey = `chart:${symbol}:${exchange}:${range}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.data as ChartPoint[];

  if (!FINNHUB_API_KEY) {
    console.warn("[finnhub] FINNHUB_API_KEY not set");
    return [];
  }

  const fSym = getFinnhubSymbol(symbol, exchange);
  const now = Math.floor(Date.now() / 1000);
  const { fromOffset, resolution, cacheTtl } = getChartParams(range);
  const from =
    range === "ytd"
      ? Math.floor(new Date(new Date().getFullYear(), 0, 1).getTime() / 1000)
      : now - fromOffset;

  try {
    const url = `${BASE}/stock/candle?symbol=${encodeURIComponent(fSym)}&resolution=${resolution}&from=${from}&to=${now}&token=${FINNHUB_API_KEY}`;
    const res = await fetch(url, { next: { revalidate: 900 } }); // 15-min cache for chart data
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.s === "no_data" || !Array.isArray(data.c)) {
      cache.set(cacheKey, { data: [], expires: Date.now() + cacheTtl });
      return [];
    }

    const points: ChartPoint[] = (data.t as number[])
      .map((t: number, i: number) => ({
        timestamp: t * 1000,
        date: new Date(t * 1000).toISOString().split("T")[0],
        close: (data.c as number[])[i],
      }))
      .filter((p) => p.close != null);

    cache.set(cacheKey, { data: points, expires: Date.now() + cacheTtl });
    return points;
  } catch (err) {
    console.warn(`[finnhub] Chart failed for ${fSym}:`, err);
    cache.set(cacheKey, { data: [], expires: Date.now() + INTRADAY_CACHE_TTL });
    return [];
  }
}

// ─── Exchange Rate via Frankfurter (free, open-source, commercial-OK) ────────
// https://www.frankfurter.app — ECB reference rates, no API key needed
export async function getExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;
  const cacheKey = `fx:${from}${to}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.data as number;

  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=${from}&to=${to}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const rate: number = data.rates?.[to] ?? 1;
    cache.set(cacheKey, { data: rate, expires: Date.now() + CACHE_TTL });
    return rate;
  } catch (err) {
    console.warn(`[fx] Rate failed for ${from}/${to}:`, err);
    if (from === "USD" && to === "THB") return 34.5;
    if (from === "THB" && to === "USD") return 1 / 34.5;
    return 1;
  }
}
