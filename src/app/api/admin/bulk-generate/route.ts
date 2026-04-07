export const dynamic = "force-dynamic";

/**
 * POST /api/admin/bulk-generate
 * Body: { symbol?: string }   — if symbol provided, generates for that stock
 *                               if omitted, picks the next stock without AI content
 * Returns: { done: true } when no more stocks need generation
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { fetchStockAnalysis } from "@/lib/typhoon";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const targetSymbol: string | undefined = body.symbol;

  // Find target stock
  const stock = targetSymbol
    ? await prisma.stock.findUnique({ where: { symbol: targetSymbol } })
    : await prisma.stock.findFirst({
        where: { businessOverview: null },
        orderBy: { createdAt: "asc" },
      });

  if (!stock) return NextResponse.json({ done: true });

  try {
    const result = await fetchStockAnalysis(stock.symbol);

    await prisma.stock.update({
      where: { id: stock.id },
      data: {
        businessOverview:  result.businessOverview,
        revenueStructure:  result.revenueStructure as string ?? null,
        financialHealth:   result.financialHealth  as string ?? null,
        growthStrategy:    result.growthStrategy,
        moat:              result.moat,
        risks:             result.risks,
        industryLandscape: result.industryLandscape,
        strategistVerdict: result.strategistVerdict as string ?? null,
      },
    });

    // Count remaining
    const remaining = await prisma.stock.count({ where: { businessOverview: null } });

    return NextResponse.json({ done: false, processed: stock.symbol, remaining });
  } catch (err) {
    return NextResponse.json({ error: String(err), symbol: stock.symbol }, { status: 500 });
  }
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const total    = await prisma.stock.count();
  const withAI   = await prisma.stock.count({ where: { businessOverview: { not: null } } });
  const pending  = total - withAI;

  return NextResponse.json({ total, withAI, pending });
}
