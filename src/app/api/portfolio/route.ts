// Portfolio API — CRUD for user stock portfolios
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getQuotes } from "@/lib/yahoo";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// Ensure the Supabase Auth user exists in our Prisma users table
async function ensureUser(user: { id: string; email?: string; user_metadata?: { full_name?: string; name?: string } }) {
  await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: {
      id: user.id,
      email: user.email || "",
      name: user.user_metadata?.full_name || user.user_metadata?.name || null,
      status: "approved",
    },
  });
}

// GET — Fetch user's portfolio with live quotes
// Supports ?portfolioId=xxx to fetch a specific portfolio
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await ensureUser(user);

  const portfolioId = req.nextUrl.searchParams.get("portfolioId");

  let portfolio;

  if (portfolioId) {
    // Fetch specific portfolio by ID, verify ownership
    portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: { items: { orderBy: { addedAt: "desc" } } },
    });

    if (!portfolio || portfolio.userId !== user.id) {
      return Response.json({ error: "Portfolio not found" }, { status: 404 });
    }
  } else {
    // Backward compatible: fetch the first portfolio
    portfolio = await prisma.portfolio.findFirst({
      where: { userId: user.id },
      include: { items: { orderBy: { addedAt: "desc" } } },
    });

    if (!portfolio) {
      portfolio = await prisma.portfolio.create({
        data: { userId: user.id, name: "My Portfolio" },
        include: { items: true },
      });
    }
  }

  // Fetch stock details
  const stockIds = portfolio.items.map(i => i.stockId);
  const stocks = stockIds.length > 0
    ? await prisma.stock.findMany({
        where: { id: { in: stockIds } },
        select: { id: true, symbol: true, name: true, sector: true, exchange: true, logoUrl: true },
      })
    : [];

  // Fetch live quotes
  const quoteInput = stocks.map(s => ({ symbol: s.symbol, exchange: s.exchange }));
  const quotes = quoteInput.length > 0 ? await getQuotes(quoteInput) : new Map();

  // Combine data
  const stockMap = new Map(stocks.map(s => [s.id, s]));
  const items = portfolio.items.map(item => {
    const stock = stockMap.get(item.stockId);
    const quote = stock ? quotes.get(stock.symbol) : null;
    return {
      ...item,
      stock: stock || null,
      quote: quote || null,
    };
  });

  return Response.json({
    id: portfolio.id,
    name: portfolio.name,
    isWatchlist: portfolio.isWatchlist,
    items,
  });
}

// POST — Add stock to portfolio
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await ensureUser(user);

  const { stockId, symbol, shares, avgCost, portfolioId: targetPortfolioId } = await req.json();
  if (!stockId || !symbol) {
    return Response.json({ error: "Missing stockId or symbol" }, { status: 400 });
  }

  let portfolio;

  if (targetPortfolioId) {
    // Use the explicitly requested portfolio (verify ownership)
    portfolio = await prisma.portfolio.findUnique({
      where: { id: targetPortfolioId },
    });
    if (!portfolio || portfolio.userId !== user.id) {
      return Response.json({ error: "Portfolio not found" }, { status: 404 });
    }
  } else {
    // Fallback: first portfolio or create one
    portfolio = await prisma.portfolio.findFirst({ where: { userId: user.id } });
    if (!portfolio) {
      portfolio = await prisma.portfolio.create({
        data: { userId: user.id, name: "My Portfolio" },
      });
    }
  }

  // Check duplicate
  const existing = await prisma.portfolioItem.findUnique({
    where: { portfolioId_stockId: { portfolioId: portfolio.id, stockId } },
  });
  if (existing) {
    return Response.json({ error: "Stock already in portfolio" }, { status: 409 });
  }

  const item = await prisma.portfolioItem.create({
    data: {
      portfolioId: portfolio.id,
      stockId,
      symbol: symbol.toUpperCase(),
      shares: shares ?? null,
      avgCost: avgCost ?? null,
    },
  });

  return Response.json(item, { status: 201 });
}

// DELETE — Remove item from portfolio
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const itemId = req.nextUrl.searchParams.get("itemId");
  if (!itemId) return Response.json({ error: "Missing itemId" }, { status: 400 });

  const item = await prisma.portfolioItem.findUnique({
    where: { id: itemId },
    include: { portfolio: { select: { userId: true } } },
  });
  if (!item || item.portfolio.userId !== user.id) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.portfolioItem.delete({ where: { id: itemId } });
  return Response.json({ success: true });
}
