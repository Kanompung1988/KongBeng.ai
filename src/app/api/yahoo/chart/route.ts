import { NextRequest, NextResponse } from "next/server";
import { getChart, ChartRange } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

const VALID_RANGES: ChartRange[] = ["1d", "5d", "1mo", "3mo", "ytd", "1y"];

// GET /api/yahoo/chart?symbol=AAPL&exchange=NASDAQ&range=1mo
// Public endpoint — no auth required
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const symbol = searchParams.get("symbol");
  const exchange = searchParams.get("exchange") || "SET";
  const range = searchParams.get("range") || "1mo";

  if (!symbol) {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 });
  }

  if (!VALID_RANGES.includes(range as ChartRange)) {
    return NextResponse.json(
      { error: `Invalid range. Must be one of: ${VALID_RANGES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const data = await getChart(symbol, exchange, range as ChartRange);
    return NextResponse.json({ data });
  } catch (err) {
    console.error(`[yahoo/chart] Error fetching chart for ${symbol}:`, err);
    return NextResponse.json({ error: "Failed to fetch chart data" }, { status: 500 });
  }
}
