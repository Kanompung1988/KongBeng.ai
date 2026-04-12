// Server-side data fetchers for Khongbeng AI chat
// These are NOT AI tool-calling functions — they're called by the intent router

import { prisma } from "@/lib/prisma";
import { getQuote, getQuotes } from "@/lib/yahoo";
import { safeJsonParse, truncate } from "@/lib/utils";

// ─── Helper: Extract summary from a JSON section ────────────────────────────
function extractSummary(raw: string | null, maxLen = 300): string {
  if (!raw) return "";
  try {
    const data = JSON.parse(raw);
    if (typeof data === "object" && data !== null) {
      // Try common summary fields
      for (const key of ["summary", "overall", "verdict", "currentStory", "background", "qualitySummary"]) {
        if (typeof data[key] === "string" && data[key]) {
          return truncate(data[key], maxLen);
        }
      }
    }
    if (typeof data === "string") return truncate(data, maxLen);
    return truncate(JSON.stringify(data), maxLen);
  } catch {
    return truncate(raw, maxLen);
  }
}

// ─── Lookup a single stock with full analysis summary ────────────────────────
export async function lookupStock(symbol: string): Promise<string> {
  const stock = await prisma.stock.findFirst({
    where: {
      symbol: { equals: symbol.toUpperCase(), mode: "insensitive" },
      isPublished: true,
    },
  });

  if (!stock) return `Stock "${symbol}" not found in our database.`;

  const sections = [
    { key: "coreBusiness", label: "Core Business" },
    { key: "customerBase", label: "Customer Base" },
    { key: "revenueModel", label: "Revenue Model" },
    { key: "financials", label: "Financials" },
    { key: "sevenPowers", label: "7 Powers (Moat)" },
    { key: "storyAndSCurve", label: "Growth Story" },
    { key: "risks", label: "Risks" },
    { key: "ceoProfile", label: "CEO Profile" },
  ] as const;

  const parts: string[] = [
    `## ${stock.symbol} — ${stock.name}`,
    `Sector: ${stock.sector} | Exchange: ${stock.exchange}`,
    "",
  ];

  for (const { key, label } of sections) {
    const raw = stock[key as keyof typeof stock] as string | null;
    const summary = extractSummary(raw, 400);
    if (summary) {
      parts.push(`**${label}:** ${summary}`);
    }
  }

  // Add financials detail if available
  if (stock.financials) {
    try {
      const fin = JSON.parse(stock.financials);
      if (fin.years && fin.revenue) {
        const latest = fin.years.length - 1;
        parts.push(`\nLatest financials (${fin.years[latest]}): Revenue ${fin.revenue[latest]} ${fin.unit || ""}, Net Profit ${fin.netProfit?.[latest] || "N/A"} ${fin.unit || ""}`);
      }
      if (fin.keyTakeawayRatios?.length) {
        const ratios = fin.keyTakeawayRatios.slice(0, 3).map((r: { name: string; value: string }) => `${r.name}: ${r.value}`).join(", ");
        parts.push(`Key ratios: ${ratios}`);
      }
    } catch { /* ignore */ }
  }

  return parts.join("\n");
}

// ─── Search stocks by query ──────────────────────────────────────────────────
export async function searchStocks(query: string, limit = 10): Promise<string> {
  const stocks = await prisma.stock.findMany({
    where: {
      isPublished: true,
      OR: [
        { symbol: { contains: query.toUpperCase(), mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
        { sector: { contains: query, mode: "insensitive" } },
      ],
    },
    select: { symbol: true, name: true, sector: true, exchange: true },
    take: limit,
    orderBy: { viewCount: "desc" },
  });

  if (stocks.length === 0) return `No stocks found matching "${query}".`;

  const lines = stocks.map(s => `- **${s.symbol}** (${s.exchange}) — ${s.name} [${s.sector}]`);
  return `Found ${stocks.length} stocks:\n${lines.join("\n")}`;
}

// ─── Get live stock quote ────────────────────────────────────────────────────
export async function getStockQuote(symbol: string): Promise<string> {
  const stock = await prisma.stock.findFirst({
    where: { symbol: { equals: symbol.toUpperCase(), mode: "insensitive" }, isPublished: true },
    select: { symbol: true, name: true, exchange: true },
  });

  if (!stock) return `Stock "${symbol}" not found.`;

  const quote = await getQuote(stock.symbol, stock.exchange);

  if (!quote.price) return `${stock.symbol} — Live quote not available at this time.`;

  return [
    `**${stock.symbol}** (${stock.name})`,
    `Price: ${quote.price.toFixed(2)} ${quote.currency}`,
    `Change: ${quote.change?.toFixed(2) || "N/A"} (${quote.changePercent?.toFixed(2) || "N/A"}%)`,
    `P/E: ${quote.pe?.toFixed(2) || "N/A"}`,
    `Market Cap: ${quote.marketCap ? (quote.marketCap / 1e9).toFixed(2) + "B " + quote.currency : "N/A"}`,
  ].join("\n");
}

// ─── Search trend articles / news ────────────────────────────────────────────
export async function searchNews(query?: string, limit = 5): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { summary: { contains: query, mode: "insensitive" } },
      { tags: { hasSome: [query.toLowerCase()] } },
    ];
  }

  const articles = await prisma.trendArticle.findMany({
    where,
    select: { title: true, titleTh: true, summary: true, summaryTh: true, category: true, publishedAt: true },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });

  if (articles.length === 0) return query ? `No news found for "${query}".` : "No recent news available.";

  const lines = articles.map((a, i) => {
    const title = a.titleTh || a.title;
    const summary = truncate(a.summaryTh || a.summary, 200);
    const date = a.publishedAt.toISOString().split("T")[0];
    return `${i + 1}. **${title}** [${a.category}] (${date})\n   ${summary}`;
  });

  return `Recent news:\n${lines.join("\n\n")}`;
}

// ─── Get user portfolio ──────────────────────────────────────────────────────
export async function getPortfolio(userId: string): Promise<string> {
  const portfolio = await prisma.portfolio.findFirst({
    where: { userId, isWatchlist: false },
    include: { items: true },
  });

  if (!portfolio || portfolio.items.length === 0) {
    return "Your portfolio is empty. You can add stocks from the stock detail pages or your dashboard.";
  }

  // Get stock details
  const stockIds = portfolio.items.map(i => i.stockId);
  const stocks = await prisma.stock.findMany({
    where: { id: { in: stockIds } },
    select: { id: true, symbol: true, name: true, sector: true, exchange: true },
  });
  const stockMap = new Map(stocks.map(s => [s.id, s]));

  // Get live quotes
  const quotesInput = stocks.map(s => ({ symbol: s.symbol, exchange: s.exchange }));
  const quotes = await getQuotes(quotesInput);

  const lines: string[] = [`**${portfolio.name}** (${portfolio.items.length} stocks):\n`];
  let totalValue = 0;
  let totalCost = 0;

  for (const item of portfolio.items) {
    const stock = stockMap.get(item.stockId);
    if (!stock) continue;
    const quote = quotes.get(stock.symbol);
    const price = quote?.price;
    const shares = item.shares || 0;
    const cost = item.avgCost || 0;
    const value = price && shares ? price * shares : null;
    const pl = value && cost && shares ? value - (cost * shares) : null;

    if (value) totalValue += value;
    if (cost && shares) totalCost += cost * shares;

    lines.push(
      `- **${stock.symbol}** (${stock.name}): ` +
      (shares ? `${shares} shares` : "watchlist") +
      (price ? ` @ ${price.toFixed(2)} ${quote?.currency || ""}` : "") +
      (pl !== null ? ` | P/L: ${pl >= 0 ? "+" : ""}${pl.toFixed(2)}` : "")
    );
  }

  if (totalValue > 0) {
    const totalPL = totalValue - totalCost;
    lines.push(`\n**Total Value:** ${totalValue.toFixed(2)}`);
    if (totalCost > 0) {
      lines.push(`**Total P/L:** ${totalPL >= 0 ? "+" : ""}${totalPL.toFixed(2)} (${((totalPL / totalCost) * 100).toFixed(2)}%)`);
    }
  }

  return lines.join("\n");
}

// ─── Compare stocks side-by-side ─────────────────────────────────────────────
export async function compareStocks(symbols: string[]): Promise<string> {
  const upper = symbols.map(s => s.toUpperCase()).slice(0, 5);

  const stocks = await prisma.stock.findMany({
    where: { symbol: { in: upper }, isPublished: true },
    select: {
      symbol: true, name: true, sector: true, exchange: true,
      financials: true, sevenPowers: true, risks: true,
    },
  });

  if (stocks.length === 0) return `None of the stocks [${upper.join(", ")}] were found.`;

  // Get quotes
  const quoteInput = stocks.map(s => ({ symbol: s.symbol, exchange: s.exchange }));
  const quotes = await getQuotes(quoteInput);

  const lines: string[] = ["**Stock Comparison:**\n"];

  for (const stock of stocks) {
    const quote = quotes.get(stock.symbol);
    const sevenPowers = safeJsonParse<{ summary?: string; powers?: { name: string; score: number }[] }>(stock.sevenPowers, {});
    const risks = safeJsonParse<{ summary?: string }>(stock.risks, {});
    const financials = safeJsonParse<{ keyTakeawayRatios?: { name: string; value: string }[] }>(stock.financials, {});

    lines.push(`### ${stock.symbol} — ${stock.name}`);
    lines.push(`Sector: ${stock.sector} | Exchange: ${stock.exchange}`);
    if (quote?.price) lines.push(`Price: ${quote.price.toFixed(2)} ${quote.currency} (${quote.changePercent?.toFixed(2) || "N/A"}%)`);
    if (quote?.pe) lines.push(`P/E: ${quote.pe.toFixed(2)}`);
    if (financials?.keyTakeawayRatios?.length) {
      const ratios = financials.keyTakeawayRatios.slice(0, 3).map(r => `${r.name}: ${r.value}`).join(", ");
      lines.push(`Ratios: ${ratios}`);
    }
    if (sevenPowers?.powers) {
      const avgScore = sevenPowers.powers.reduce((sum, p) => sum + p.score, 0) / sevenPowers.powers.length;
      lines.push(`Moat Score: ${avgScore.toFixed(1)}/5`);
    }
    if (risks?.summary) lines.push(`Risk: ${truncate(risks.summary, 150)}`);
    lines.push("");
  }

  return lines.join("\n");
}

// ─── List stocks by sector ───────────────────────────────────────────────────
export async function listBySector(sector: string): Promise<string> {
  const stocks = await prisma.stock.findMany({
    where: {
      isPublished: true,
      sector: { contains: sector, mode: "insensitive" },
    },
    select: { symbol: true, name: true, sector: true, exchange: true },
    orderBy: { viewCount: "desc" },
    take: 15,
  });

  if (stocks.length === 0) return `No stocks found in sector "${sector}".`;

  const lines = stocks.map(s => `- **${s.symbol}** (${s.exchange}) — ${s.name}`);
  return `Stocks in "${stocks[0].sector}" sector:\n${lines.join("\n")}`;
}
