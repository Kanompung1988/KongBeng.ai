import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getIndexesForSymbol } from "@/lib/constants/index-members";
import { NextResponse } from "next/server";

export async function POST() {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stocks = await prisma.stock.findMany({
    select: { id: true, symbol: true, exchange: true, marketIndexes: true },
  });

  let updated = 0;
  let unchanged = 0;

  for (const stock of stocks) {
    const detected = getIndexesForSymbol(stock.symbol, stock.exchange);
    const current = stock.marketIndexes || [];

    // Only update if different
    const same = detected.length === current.length &&
      detected.every((idx) => current.includes(idx));

    if (!same) {
      await prisma.stock.update({
        where: { id: stock.id },
        data: { marketIndexes: detected },
      });
      updated++;
    } else {
      unchanged++;
    }
  }

  return NextResponse.json({ updated, unchanged, total: stocks.length });
}
