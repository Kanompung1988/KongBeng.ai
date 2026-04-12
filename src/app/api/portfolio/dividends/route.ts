import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

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

// GET /api/portfolio/dividends?portfolioId=xxx
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const portfolioId = request.nextUrl.searchParams.get("portfolioId");
  if (!portfolioId) {
    return NextResponse.json({ error: "portfolioId is required" }, { status: 400 });
  }

  const portfolio = await verifyPortfolioOwnership(portfolioId, user.id);
  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  const dividends = await prisma.dividendRecord.findMany({
    where: { portfolioId },
    orderBy: { payDate: "desc" },
  });

  // Enrich with stock names
  const symbols = [...new Set(dividends.map((d) => d.symbol))];
  const stocks = await prisma.stock.findMany({
    where: { symbol: { in: symbols } },
    select: { symbol: true, name: true },
  });
  const stockMap = new Map(stocks.map((s) => [s.symbol, s.name]));

  const enriched = dividends.map((d) => ({
    ...d,
    stockName: stockMap.get(d.symbol) || d.symbol,
  }));

  return NextResponse.json({ dividends: enriched });
}

// POST /api/portfolio/dividends
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { portfolioId, stockId, symbol, amount, perShare, exDate, payDate, currency } = body;

  if (!portfolioId || !stockId || !symbol || amount == null) {
    return NextResponse.json(
      { error: "Missing required fields: portfolioId, stockId, symbol, amount" },
      { status: 400 }
    );
  }

  const portfolio = await verifyPortfolioOwnership(portfolioId, user.id);
  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  const dividend = await prisma.dividendRecord.create({
    data: {
      portfolioId,
      stockId,
      symbol,
      amount: parseFloat(amount),
      perShare: perShare ? parseFloat(perShare) : null,
      exDate: exDate ? new Date(exDate) : null,
      payDate: payDate ? new Date(payDate) : null,
      currency: currency || "THB",
    },
  });

  return NextResponse.json({ dividend }, { status: 201 });
}
