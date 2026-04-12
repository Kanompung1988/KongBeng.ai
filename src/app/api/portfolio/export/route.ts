import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getQuotes } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function verifyPortfolioOwnership(portfolioId: string, userId: string) {
  const portfolio = await prisma.portfolio.findFirst({
    where: { id: portfolioId, userId },
  });
  return portfolio;
}

// Escape CSV field values
function escapeCsv(value: string | number | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// GET /api/portfolio/export?portfolioId=xxx&format=csv
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const portfolioId = searchParams.get("portfolioId");
  const format = searchParams.get("format") || "csv";

  if (!portfolioId) {
    return NextResponse.json({ error: "portfolioId is required" }, { status: 400 });
  }

  if (format !== "csv") {
    return NextResponse.json({ error: "Only csv format is supported" }, { status: 400 });
  }

  const portfolio = await verifyPortfolioOwnership(portfolioId, user.id);
  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  // Get portfolio items
  const items = await prisma.portfolioItem.findMany({
    where: { portfolioId },
    orderBy: { symbol: "asc" },
  });

  if (items.length === 0) {
    const csv = "Symbol,Name,Sector,Exchange,Shares,Avg Cost,Current Price,P/L,P/L%\n";
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${portfolio.name}.csv"`,
      },
    });
  }

  // Get stock details
  const symbols = items.map((i) => i.symbol);
  const stocks = await prisma.stock.findMany({
    where: { symbol: { in: symbols } },
    select: { symbol: true, name: true, sector: true, exchange: true },
  });
  const stockMap = new Map(stocks.map((s) => [s.symbol, s]));

  // Fetch live quotes
  const quoteInputs = items.map((item) => {
    const stock = stockMap.get(item.symbol);
    return {
      symbol: item.symbol,
      exchange: stock?.exchange || "SET",
    };
  });
  const quotes = await getQuotes(quoteInputs);

  // Build CSV
  const headers = ["Symbol", "Name", "Sector", "Exchange", "Shares", "Avg Cost", "Current Price", "P/L", "P/L%"];
  const rows: string[] = [headers.join(",")];

  for (const item of items) {
    const stock = stockMap.get(item.symbol);
    const quote = quotes.get(item.symbol);
    const currentPrice = quote?.price ?? null;
    const shares = item.shares ?? 0;
    const avgCost = item.avgCost ?? 0;

    let pl: number | null = null;
    let plPercent: number | null = null;

    if (currentPrice !== null && avgCost > 0 && shares > 0) {
      pl = (currentPrice - avgCost) * shares;
      plPercent = ((currentPrice - avgCost) / avgCost) * 100;
    }

    const row = [
      escapeCsv(item.symbol),
      escapeCsv(stock?.name || item.symbol),
      escapeCsv(stock?.sector || ""),
      escapeCsv(stock?.exchange || ""),
      escapeCsv(shares),
      escapeCsv(avgCost ? avgCost.toFixed(2) : ""),
      escapeCsv(currentPrice !== null ? currentPrice.toFixed(2) : "N/A"),
      escapeCsv(pl !== null ? pl.toFixed(2) : "N/A"),
      escapeCsv(plPercent !== null ? plPercent.toFixed(2) + "%" : "N/A"),
    ];

    rows.push(row.join(","));
  }

  const csv = rows.join("\n") + "\n";

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${portfolio.name}.csv"`,
    },
  });
}
