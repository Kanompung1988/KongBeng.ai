import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getQuotes } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

// POST /api/cron/snapshot — daily snapshot of all active portfolios
// Protected by CRON_SECRET header
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all portfolios that have at least one item
  const portfolios = await prisma.portfolio.findMany({
    where: {
      items: { some: {} },
    },
    include: {
      items: true,
    },
  });

  if (portfolios.length === 0) {
    return NextResponse.json({ message: "No active portfolios", snapshots: 0 });
  }

  // Collect all unique symbols across all portfolios
  const allSymbols = new Set<string>();
  for (const portfolio of portfolios) {
    for (const item of portfolio.items) {
      allSymbols.add(item.symbol);
    }
  }

  // Look up exchanges for all symbols
  const stocks = await prisma.stock.findMany({
    where: { symbol: { in: [...allSymbols] } },
    select: { symbol: true, exchange: true },
  });
  const exchangeMap = new Map(stocks.map((s) => [s.symbol, s.exchange]));

  // Fetch all quotes at once
  const quoteInputs = [...allSymbols].map((symbol) => ({
    symbol,
    exchange: exchangeMap.get(symbol) || "SET",
  }));
  const quotes = await getQuotes(quoteInputs);

  // Create snapshots for each portfolio
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let created = 0;
  let skipped = 0;

  for (const portfolio of portfolios) {
    let totalValue = 0;
    let totalCost = 0;
    const breakdown: Record<string, number> = {};

    for (const item of portfolio.items) {
      const quote = quotes.get(item.symbol);
      const currentPrice = quote?.price ?? 0;
      const shares = item.shares ?? 0;
      const avgCost = item.avgCost ?? 0;

      const itemValue = currentPrice * shares;
      const itemCost = avgCost * shares;

      totalValue += itemValue;
      totalCost += itemCost;
      breakdown[item.symbol] = itemValue;
    }

    // Skip if we already have a snapshot for today
    try {
      await prisma.portfolioSnapshot.create({
        data: {
          portfolioId: portfolio.id,
          totalValue,
          totalCost,
          date: today,
          breakdown: JSON.stringify(breakdown),
        },
      });
      created++;
    } catch {
      // Unique constraint violation — snapshot already exists for today
      skipped++;
    }
  }

  return NextResponse.json({
    message: "Snapshot complete",
    portfolios: portfolios.length,
    created,
    skipped,
  });
}
