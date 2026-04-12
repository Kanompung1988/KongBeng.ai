// Portfolio list API — list all user portfolios with item counts
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await ensureUser(user);

  const portfolios = await prisma.portfolio.findMany({
    where: { userId: user.id },
    include: { _count: { select: { items: true } } },
    orderBy: { createdAt: "asc" },
  });

  return Response.json({
    portfolios: portfolios.map((p) => ({
      id: p.id,
      name: p.name,
      isWatchlist: p.isWatchlist,
      itemCount: p._count.items,
      createdAt: p.createdAt,
    })),
  });
}
