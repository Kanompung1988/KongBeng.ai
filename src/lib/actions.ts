"use server";
// Server Actions for Khongbeng Admin
import { prisma } from "@/lib/prisma";
import { fetchStockAnalysis } from "@/lib/typhoon";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { AIFetchResult } from "@/types";

// ── Save Stock ────────────────────────────────────────────────────────────────
export async function saveStockAction(
  data: Record<string, string | boolean | string[]>,
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
    logoUrl: data.logoUrl as string || null,
    marketIndexes: (data.marketIndexes as string[] | undefined) || [],
    coreBusiness: data.coreBusiness as string || null,
    customerBase: data.customerBase as string || null,
    revenueModel: data.revenueModel as string || null,
    financials: data.financials as string || null,
    sevenPowers: data.sevenPowers as string || null,
    storyAndSCurve: data.storyAndSCurve as string || null,
    risks: data.risks as string || null,
    ceoProfile: data.ceoProfile as string || null,
    shareholders: data.shareholders as string || null,
    recentNews: data.recentNews as string || null,
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
  const { symbol: _s, ...rest } = result;
  return rest;
}

// ── Portfolio Actions ─────────────────────────────────────────────────────────

async function getOrCreatePortfolio(userId: string) {
  let portfolio = await prisma.portfolio.findFirst({ where: { userId } });
  if (!portfolio) {
    portfolio = await prisma.portfolio.create({
      data: { userId, name: "My Portfolio" },
    });
  }
  return portfolio;
}

export async function addToPortfolioAction(
  stockId: string,
  symbol: string,
  shares?: number,
  avgCost?: number
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const portfolio = await getOrCreatePortfolio(user.id);

  // Check if already exists
  const existing = await prisma.portfolioItem.findUnique({
    where: { portfolioId_stockId: { portfolioId: portfolio.id, stockId } },
  });
  if (existing) throw new Error("Stock already in portfolio");

  await prisma.portfolioItem.create({
    data: {
      portfolioId: portfolio.id,
      stockId,
      symbol: symbol.toUpperCase(),
      shares: shares ?? null,
      avgCost: avgCost ?? null,
    },
  });

  revalidatePath("/dashboard");
}

export async function removeFromPortfolioAction(itemId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Verify ownership
  const item = await prisma.portfolioItem.findUnique({
    where: { id: itemId },
    include: { portfolio: { select: { userId: true } } },
  });
  if (!item || item.portfolio.userId !== user.id) throw new Error("Not found");

  await prisma.portfolioItem.delete({ where: { id: itemId } });
  revalidatePath("/dashboard");
}

export async function updatePortfolioItemAction(
  itemId: string,
  data: { shares?: number | null; avgCost?: number | null; notes?: string | null }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Verify ownership
  const item = await prisma.portfolioItem.findUnique({
    where: { id: itemId },
    include: { portfolio: { select: { userId: true } } },
  });
  if (!item || item.portfolio.userId !== user.id) throw new Error("Not found");

  await prisma.portfolioItem.update({ where: { id: itemId }, data });
  revalidatePath("/dashboard");
}
