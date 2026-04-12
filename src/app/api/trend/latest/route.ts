import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const revalidate = 300;

export async function GET() {
  const articles = await prisma.trendArticle.findMany({
    orderBy: { publishedAt: "desc" },
    take: 8,
    select: { id: true, title: true, titleTh: true, category: true },
  });

  return NextResponse.json(articles);
}
