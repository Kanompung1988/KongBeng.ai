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
        where: { coreBusiness: null },
        orderBy: { createdAt: "asc" },
      });

  if (!stock) return NextResponse.json({ done: true });

  try {
    const result = await fetchStockAnalysis(stock.symbol);

    await prisma.stock.update({
      where: { id: stock.id },
      data: {
        coreBusiness:   result.coreBusiness,
        customerBase:   result.customerBase,
        revenueModel:   result.revenueModel,
        financials:     result.financials,
        sevenPowers:    result.sevenPowers,
        storyAndSCurve: result.storyAndSCurve,
        risks:          result.risks,
        ceoProfile:     result.ceoProfile,
        shareholders:   result.shareholders ?? null,
        recentNews:     result.recentNews ?? null,
      },
    });

    // Count remaining
    const remaining = await prisma.stock.count({ where: { coreBusiness: null } });

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
  const withAI   = await prisma.stock.count({ where: { coreBusiness: { not: null } } });
  const pending  = total - withAI;

  return NextResponse.json({ total, withAI, pending });
}
