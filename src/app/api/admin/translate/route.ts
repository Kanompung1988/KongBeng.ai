import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { translateStock, hasTranslation } from "@/lib/translate";

const SECTION_KEYS = [
  "coreBusiness", "customerBase", "revenueModel", "financials",
  "sevenPowers", "storyAndSCurve", "risks", "ceoProfile",
] as const;

async function isAdminUser(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (adminEmails.length === 0) return false;
  return adminEmails.includes(user.email.toLowerCase());
}

// GET — translation status
export async function GET(req: NextRequest) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const exchange = req.nextUrl.searchParams.get("exchange");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { coreBusiness: { not: null } };
  if (exchange) where.exchange = exchange.toUpperCase();

  const stocks = await prisma.stock.findMany({
    where,
    select: { symbol: true, exchange: true, coreBusiness: true },
  });

  let translated = 0;
  for (const s of stocks) {
    const targetLang = s.exchange === "SET" ? "en" : "th";
    if (hasTranslation(s.coreBusiness, targetLang)) translated++;
  }

  return NextResponse.json({
    total: stocks.length,
    translated,
    pending: stocks.length - translated,
  });
}

// POST — translate a single stock
export async function POST(req: NextRequest) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { symbol, targetLang } = body as { symbol?: string; targetLang?: "th" | "en" };

  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }

  const stock = await prisma.stock.findUnique({
    where: { symbol: symbol.toUpperCase() },
    select: {
      id: true, symbol: true, exchange: true,
      coreBusiness: true, customerBase: true, revenueModel: true,
      financials: true, sevenPowers: true, storyAndSCurve: true,
      risks: true, ceoProfile: true,
    },
  });

  if (!stock) {
    return NextResponse.json({ error: "Stock not found" }, { status: 404 });
  }

  const sourceLang: "th" | "en" = stock.exchange === "SET" ? "th" : "en";
  const target = targetLang || (sourceLang === "th" ? "en" : "th");

  const sections: Record<string, string | null> = {};
  for (const key of SECTION_KEYS) {
    sections[key] = stock[key] as string | null;
  }

  try {
    const result = await translateStock(sections, sourceLang, target);

    if (Object.keys(result).length > 0) {
      await prisma.stock.update({
        where: { id: stock.id },
        data: result,
      });
    }

    return NextResponse.json({
      success: true,
      symbol: stock.symbol,
      sectionsTranslated: Object.keys(result).length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Translation failed" },
      { status: 500 }
    );
  }
}
