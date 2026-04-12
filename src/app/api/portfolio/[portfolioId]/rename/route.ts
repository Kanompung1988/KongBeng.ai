// Portfolio rename API — rename a portfolio (verify ownership)
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ portfolioId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { portfolioId } = await params;
  const { name } = await req.json();

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return Response.json({ error: "Portfolio name is required" }, { status: 400 });
  }

  const trimmedName = name.trim();

  // Find portfolio and verify ownership
  const portfolio = await prisma.portfolio.findUnique({
    where: { id: portfolioId },
  });

  if (!portfolio || portfolio.userId !== user.id) {
    return Response.json({ error: "Portfolio not found" }, { status: 404 });
  }

  try {
    const updated = await prisma.portfolio.update({
      where: { id: portfolioId },
      data: { name: trimmedName },
    });

    return Response.json(updated);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return Response.json({ error: "A portfolio with this name already exists" }, { status: 409 });
    }
    throw e;
  }
}
