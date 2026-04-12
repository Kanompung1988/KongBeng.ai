// AI Portfolio Context Builder — builds rich portfolio context for AI prompts
import { prisma } from "@/lib/prisma";
import { getQuotes } from "@/lib/yahoo";

export interface PortfolioContextItem {
  symbol: string;
  name: string;
  sector: string;
  exchange: string;
  weight: number;
  pl: number;
  plPct: number;
  price: number | null;
  shares: number;
}

export interface PortfolioContext {
  summary: string;
  sectorWeights: Record<string, number>;
  totalValue: number;
  totalCost: number;
  items: PortfolioContextItem[];
}

export async function buildPortfolioContext(userId: string): Promise<PortfolioContext> {
  // Fetch all user portfolios with items joined to Stock
  const portfolios = await prisma.portfolio.findMany({
    where: { userId, isWatchlist: false },
    include: {
      items: {
        include: {
          portfolio: false,
        },
      },
    },
  });

  // Collect all symbols with stock info
  const allItems = portfolios.flatMap((p) => p.items);
  if (allItems.length === 0) {
    return {
      summary: "Empty portfolio — no stocks held.",
      sectorWeights: {},
      totalValue: 0,
      totalCost: 0,
      items: [],
    };
  }

  // Get stock details for all items
  const stockIds = [...new Set(allItems.map((i) => i.stockId))];
  const stocks = await prisma.stock.findMany({
    where: { id: { in: stockIds } },
    select: { id: true, symbol: true, name: true, sector: true, exchange: true },
  });
  const stockMap = new Map(stocks.map((s) => [s.id, s]));

  // Fetch live quotes
  const quotableStocks = stocks.map((s) => ({ symbol: s.symbol, exchange: s.exchange }));
  const quotes = await getQuotes(quotableStocks);

  // Build enriched items
  let totalValue = 0;
  let totalCost = 0;
  const sectorValues: Record<string, number> = {};

  const enrichedItems: PortfolioContextItem[] = [];

  for (const item of allItems) {
    const stock = stockMap.get(item.stockId);
    if (!stock) continue;

    const shares = item.shares ?? 0;
    const avgCost = item.avgCost ?? 0;
    const quote = quotes.get(stock.symbol);
    const price = quote?.price ?? null;
    const currentValue = price != null ? price * shares : avgCost * shares;
    const cost = avgCost * shares;
    const pl = price != null ? currentValue - cost : 0;
    const plPct = cost > 0 && price != null ? ((currentValue - cost) / cost) * 100 : 0;

    totalValue += currentValue;
    totalCost += cost;
    sectorValues[stock.sector] = (sectorValues[stock.sector] || 0) + currentValue;

    enrichedItems.push({
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector,
      exchange: stock.exchange,
      weight: 0, // calculated below
      pl,
      plPct: Math.round(plPct * 100) / 100,
      price,
      shares,
    });
  }

  // Compute weights
  const sectorWeights: Record<string, number> = {};
  if (totalValue > 0) {
    for (const item of enrichedItems) {
      const itemValue = item.price != null ? item.price * item.shares : (totalCost > 0 ? (item.shares * (totalCost / enrichedItems.length)) : 0);
      item.weight = Math.round((itemValue / totalValue) * 10000) / 100;
    }
    for (const [sector, value] of Object.entries(sectorValues)) {
      sectorWeights[sector] = Math.round((value / totalValue) * 10000) / 100;
    }
  }

  // Build text summary (keep under 1000 chars)
  const totalPL = totalValue - totalCost;
  const totalPLPct = totalCost > 0 ? ((totalPL / totalCost) * 100).toFixed(1) : "0";

  const sectorParts = Object.entries(sectorWeights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([s, w]) => `${s} ${w}%`)
    .join(", ");

  const topHoldings = enrichedItems
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5)
    .map((i) => `${i.symbol} (${i.weight}%, P/L ${i.plPct > 0 ? "+" : ""}${i.plPct}%)`)
    .join(", ");

  let summary = `Portfolio: ${enrichedItems.length} stocks, total value $${formatNum(totalValue)}, total cost $${formatNum(totalCost)}, P/L ${totalPL >= 0 ? "+" : ""}$${formatNum(totalPL)} (${totalPLPct}%). Sectors: ${sectorParts}. Top holdings: ${topHoldings}.`;

  // Truncate to 1000 chars
  if (summary.length > 1000) {
    summary = summary.substring(0, 997) + "...";
  }

  return {
    summary,
    sectorWeights,
    totalValue,
    totalCost,
    items: enrichedItems,
  };
}

function formatNum(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toFixed(2);
}
