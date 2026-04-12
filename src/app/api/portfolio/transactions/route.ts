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

// GET /api/portfolio/transactions?portfolioId=xxx&page=1&limit=20
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const portfolioId = searchParams.get("portfolioId");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

  if (!portfolioId) {
    return NextResponse.json({ error: "portfolioId is required" }, { status: 400 });
  }

  const portfolio = await verifyPortfolioOwnership(portfolioId, user.id);
  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { portfolioId },
      orderBy: { date: "desc" },
      skip,
      take: limit,
      include: {
        portfolio: false,
      },
    }),
    prisma.transaction.count({ where: { portfolioId } }),
  ]);

  // Enrich with stock names
  const symbols = [...new Set(transactions.map((t) => t.symbol))];
  const stocks = await prisma.stock.findMany({
    where: { symbol: { in: symbols } },
    select: { symbol: true, name: true },
  });
  const stockMap = new Map(stocks.map((s) => [s.symbol, s.name]));

  const enriched = transactions.map((t) => ({
    ...t,
    stockName: stockMap.get(t.symbol) || t.symbol,
  }));

  return NextResponse.json({
    transactions: enriched,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// POST /api/portfolio/transactions
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { portfolioId, stockId, symbol, type, shares, price, fees, currency, date, notes } = body;

  if (!portfolioId || !stockId || !symbol || !type || shares == null || price == null) {
    return NextResponse.json(
      { error: "Missing required fields: portfolioId, stockId, symbol, type, shares, price" },
      { status: 400 }
    );
  }

  if (!["buy", "sell", "dividend"].includes(type)) {
    return NextResponse.json({ error: "type must be buy, sell, or dividend" }, { status: 400 });
  }

  const portfolio = await verifyPortfolioOwnership(portfolioId, user.id);
  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  const transaction = await prisma.transaction.create({
    data: {
      portfolioId,
      stockId,
      symbol,
      type,
      shares: parseFloat(shares),
      price: parseFloat(price),
      fees: fees ? parseFloat(fees) : 0,
      currency: currency || "THB",
      date: date ? new Date(date) : new Date(),
      notes: notes || null,
    },
  });

  return NextResponse.json({ transaction }, { status: 201 });
}
