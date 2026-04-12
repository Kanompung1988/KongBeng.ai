import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const articles = await prisma.trendArticle.findMany({
    orderBy: { publishedAt: "desc" },
    take: 8,
    select: { id: true, title: true, titleTh: true, category: true },
  });

  return NextResponse.json(articles, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
