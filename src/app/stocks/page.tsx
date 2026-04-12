import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/landing/footer";
import { PublicStockTable } from "@/components/stocks/public-stock-table";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stock Analysis — Khongbeng Strategist",
  description: "Browse and compare Thai and US stocks with deep-dive analysis.",
};

export default async function StocksPage() {
  const stocks = await prisma.stock.findMany({
    where: { isPublished: true },
    orderBy: [{ viewCount: "desc" }, { symbol: "asc" }],
    select: {
      id: true,
      symbol: true,
      name: true,
      sector: true,
      exchange: true,
      logoUrl: true,
      marketIndexes: true,
      viewCount: true,
    },
  });

  return (
    <main className="min-h-screen bg-background">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
      </div>

      <Navbar />

      <section className="relative pt-24 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          <PublicStockTable stocks={stocks} />
        </div>
      </section>

      <Footer />
    </main>
  );
}
