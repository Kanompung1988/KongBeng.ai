// Portfolio create API — create a new portfolio
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

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

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await ensureUser(user);

  const { name, isWatchlist } = await req.json();

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return Response.json({ error: "Portfolio name is required" }, { status: 400 });
  }

  const trimmedName = name.trim();

  try {
    const portfolio = await prisma.portfolio.create({
      data: {
        userId: user.id,
        name: trimmedName,
        isWatchlist: isWatchlist ?? false,
      },
    });

    return Response.json(portfolio, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return Response.json({ error: "A portfolio with this name already exists" }, { status: 409 });
    }
    throw e;
  }
}
