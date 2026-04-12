import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getQuotes } from "@/lib/yahoo";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET || "";

function rangeToDays(range: string): number {
  switch (range) {
    case "1D": return 1;
    case "1W": return 7;
    case "1M": return 30;
    case "3M": return 90;
    case "YTD": {
      const now = new Date();
      return Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000);
    }
    default: return 30;
  }
}

// GET /api/cron/snapshot
// - With CRON_SECRET header: runs daily snapshot (triggered by Vercel Cron)
// - With user auth + ?portfolioId: returns historical data for chart
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  // Vercel Cron trigger: run snapshot for all portfolios
  if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) {
    return runSnapshot();
  }

  // User fetch: return historical snapshot data for the portfolio chart
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const portfolioId = request.nextUrl.searchParams.get("portfolioId");
  const range = request.nextUrl.searchParams.get("range") || "1M";

  if (!portfolioId) return NextResponse.json({ error: "portfolioId required" }, { status: 400 });

  // Verify ownership
  const portfolio = await prisma.portfolio.findUnique({ where: { id: portfolioId } });
  if (!portfolio || portfolio.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const days = rangeToDays(range);
  const since = new Date(Date.now() - days * 86400000);

  const snapshots = await prisma.portfolioSnapshot.findMany({
    where: { portfolioId, date: { gte: since } },
    orderBy: { date: "asc" },
    select: { date: true, totalValue: true },
  });

  const data = snapshots.map((s) => ({
    date: s.date.toISOString().split("T")[0],
    value: s.totalValue,
  }));

  return NextResponse.json({ data });
}

// POST /api/cron/snapshot — daily snapshot of all active portfolios
// Protected by CRON_SECRET header
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runSnapshot();
}

async function runSnapshot(): Promise<NextResponse> {
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
