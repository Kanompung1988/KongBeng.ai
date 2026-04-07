"use server";
// Phase 2 — Prompt 4: Server Actions for Admin
import { prisma } from "@/lib/prisma";
import { fetchStockAnalysis } from "@/lib/typhoon";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { AIFetchResult } from "@/types";

// ── Save Stock ────────────────────────────────────────────────────────────────
export async function saveStockAction(
  data: Record<string, string | boolean>,
  id?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Upsert admin user
  let adminUser = await prisma.adminUser.findUnique({ where: { email: user.email! } });
  if (!adminUser) {
    adminUser = await prisma.adminUser.create({
      data: { email: user.email!, name: user.user_metadata?.full_name || null },
    });
  }

  const payload = {
    symbol: (data.symbol as string).toUpperCase(),
    name: data.name as string,
    sector: data.sector as string,
    exchange: data.exchange as string,
    isPublished: data.isPublished as boolean,
    businessOverview: data.businessOverview as string || null,
    revenueStructure: data.revenueStructure as string || null,
    financialHealth: data.financialHealth as string || null,
    growthStrategy: data.growthStrategy as string || null,
    moat: data.moat as string || null,
    risks: data.risks as string || null,
    industryLandscape: data.industryLandscape as string || null,
    strategistVerdict: data.strategistVerdict as string || null,
    updatedById: adminUser.id,
  };

  if (id) {
    await prisma.stock.update({ where: { id }, data: payload });
  } else {
    await prisma.stock.create({ data: payload });
  }

  revalidatePath("/admin");
  revalidatePath(`/stock/${payload.symbol}`);
  revalidatePath("/");
}

// ── Delete Stock ──────────────────────────────────────────────────────────────
export async function deleteStockAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const stock = await prisma.stock.findUnique({ where: { id }, select: { symbol: true } });
  await prisma.stock.delete({ where: { id } });

  revalidatePath("/admin");
  if (stock) revalidatePath(`/stock/${stock.symbol}`);
}

// ── Toggle Published ──────────────────────────────────────────────────────────
export async function togglePublishAction(id: string, publish: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const stock = await prisma.stock.update({
    where: { id },
    data: { isPublished: publish },
    select: { symbol: true },
  });

  revalidatePath("/admin");
  revalidatePath(`/stock/${stock.symbol}`);
  revalidatePath("/");
}

// ── Fetch AI Data (Typhoon) ────────────────────────────────────────────────────
export async function fetchAIDataAction(symbol: string): Promise<Omit<AIFetchResult, "symbol">> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const result = await fetchStockAnalysis(symbol);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { symbol: _unused, ...rest } = result;
  return rest;
}
