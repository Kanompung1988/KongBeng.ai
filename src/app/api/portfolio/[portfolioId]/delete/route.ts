// Portfolio delete API — delete a portfolio (verify ownership)
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ portfolioId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { portfolioId } = await params;

  // Find portfolio and verify ownership
  const portfolio = await prisma.portfolio.findUnique({
    where: { id: portfolioId },
  });

  if (!portfolio || portfolio.userId !== user.id) {
    return Response.json({ error: "Portfolio not found" }, { status: 404 });
  }

  // Don't allow deleting the last non-watchlist portfolio
  if (!portfolio.isWatchlist) {
    const nonWatchlistCount = await prisma.portfolio.count({
      where: { userId: user.id, isWatchlist: false },
    });

    if (nonWatchlistCount <= 1) {
      return Response.json(
        { error: "Cannot delete your last portfolio. You must have at least one non-watchlist portfolio." },
        { status: 400 }
      );
    }
  }

  await prisma.portfolio.delete({ where: { id: portfolioId } });

  return Response.json({ success: true });
}
