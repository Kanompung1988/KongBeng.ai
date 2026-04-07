// Stock Search API
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 1) {
    return NextResponse.json({ results: [] });
  }

  const results = await prisma.stock.findMany({
    where: {
      isPublished: true,
      OR: [
        { symbol: { contains: q.toUpperCase() } },
        { name: { contains: q, mode: "insensitive" } },
        { sector: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, symbol: true, name: true, sector: true, exchange: true, logoUrl: true },
    take: 10,
    orderBy: { viewCount: "desc" },
  });

  return NextResponse.json({ results });
}
