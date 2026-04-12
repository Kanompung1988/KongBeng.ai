import { getIndexesForSymbol, INDEX_MEMBERS_UPDATED } from "@/lib/constants/index-members";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const symbol = req.nextUrl.searchParams.get("symbol");
  const exchange = req.nextUrl.searchParams.get("exchange");

  if (!symbol || !exchange) {
    return NextResponse.json({ error: "Missing symbol or exchange" }, { status: 400 });
  }

  const indexes = getIndexesForSymbol(symbol, exchange);

  return NextResponse.json({ indexes, lastUpdated: INDEX_MEMBERS_UPDATED });
}
