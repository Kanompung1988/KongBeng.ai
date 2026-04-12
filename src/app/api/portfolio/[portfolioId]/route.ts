// Portfolio item update API — PATCH /api/portfolio/[portfolioId]
// Note: portfolioId param actually receives the portfolio-item ID from the frontend
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ portfolioId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { portfolioId: itemId } = await params;
  const body = await req.json();

  const item = await prisma.portfolioItem.findUnique({
    where: { id: itemId },
    include: { portfolio: { select: { userId: true } } },
  });
  if (!item || item.portfolio.userId !== user.id) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Only allow updating these fields
  const data: Record<string, unknown> = {};
  if ("shares" in body) data.shares = body.shares;
  if ("avgCost" in body) data.avgCost = body.avgCost;
  if ("notes" in body) data.notes = body.notes;

  const updated = await prisma.portfolioItem.update({
    where: { id: itemId },
    data,
  });

  return Response.json(updated);
}
