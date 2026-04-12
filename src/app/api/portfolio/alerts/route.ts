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

// GET /api/portfolio/alerts — list all user's alerts with current price status
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const alerts = await prisma.alert.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  if (alerts.length === 0) {
    return NextResponse.json({ alerts: [] });
  }

  // Fetch current prices for all alert symbols
  const uniqueSymbols = [...new Set(alerts.map((a) => a.symbol))];

  // Look up exchanges for symbols from the stocks table
  const stocks = await prisma.stock.findMany({
    where: { symbol: { in: uniqueSymbols } },
    select: { symbol: true, exchange: true },
  });
  const exchangeMap = new Map(stocks.map((s) => [s.symbol, s.exchange]));

  const quoteInputs = uniqueSymbols.map((symbol) => ({
    symbol,
    exchange: exchangeMap.get(symbol) || "SET",
  }));

  const quotes = await getQuotes(quoteInputs);

  const enriched = alerts.map((alert) => {
    const quote = quotes.get(alert.symbol);
    const currentPrice = quote?.price ?? null;
    let shouldTrigger = false;

    if (currentPrice !== null && !alert.isTriggered) {
      if (alert.direction === "above" && currentPrice >= alert.targetPrice) {
        shouldTrigger = true;
      } else if (alert.direction === "below" && currentPrice <= alert.targetPrice) {
        shouldTrigger = true;
      }
    }

    return {
      ...alert,
      currentPrice,
      shouldTrigger,
    };
  });

  return NextResponse.json({ alerts: enriched });
}

// POST /api/portfolio/alerts — create a price alert
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { symbol, targetPrice, direction } = body;

  if (!symbol || targetPrice == null || !direction) {
    return NextResponse.json(
      { error: "Missing required fields: symbol, targetPrice, direction" },
      { status: 400 }
    );
  }

  if (!["above", "below"].includes(direction)) {
    return NextResponse.json({ error: "direction must be above or below" }, { status: 400 });
  }

  const alert = await prisma.alert.create({
    data: {
      userId: user.id,
      symbol,
      targetPrice: parseFloat(targetPrice),
      direction,
    },
  });

  return NextResponse.json({ alert }, { status: 201 });
}

// DELETE /api/portfolio/alerts?alertId=xxx — remove an alert
export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const alertId = request.nextUrl.searchParams.get("alertId");
  if (!alertId) {
    return NextResponse.json({ error: "alertId is required" }, { status: 400 });
  }

  // Verify ownership
  const alert = await prisma.alert.findFirst({
    where: { id: alertId, userId: user.id },
  });

  if (!alert) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }

  await prisma.alert.delete({ where: { id: alertId } });

  return NextResponse.json({ success: true });
}
