import { Suspense } from "react";
import { SearchTrigger } from "@/components/search/search-command";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturedStocks } from "@/components/landing/featured-stocks";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/layout/navbar";
import { KongChatWidget } from "@/components/chat/kong-chat-widget";
import { ActiveUsersPanel } from "@/components/presence/active-users-panel";
import { TrendTicker } from "@/components/trend/trend-ticker";
import { prisma } from "@/lib/prisma";

// Revalidate every 60s — data only changes when admin publishes/unpublishes
export const revalidate = 60;

async function getAllStocks() {
  const stocks = await prisma.stock.findMany({
    where: { isPublished: true },
    orderBy: { symbol: "asc" },
    select: {
      id: true,
      symbol: true,
      name: true,
      sector: true,
      exchange: true,
      logoUrl: true,
    },
  });

  const thaiStocks = stocks.filter((s) => s.exchange === "SET");
  const usStocks = stocks.filter((s) => s.exchange !== "SET");

  return { thaiStocks, usStocks };
}

export default async function HomePage() {
  // Parallel DB queries — both are independent
  const [{ thaiStocks, usStocks }, trendArticles] = await Promise.all([
    getAllStocks(),
    prisma.trendArticle.findMany({
      orderBy: { publishedAt: "desc" },
      take: 8,
      select: { id: true, title: true, titleTh: true, category: true },
    }),
  ]);

  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      {/* Background gradient mesh */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/3 rounded-full blur-3xl" />
      </div>

      <Navbar />

      {/* News Ticker */}
      {trendArticles.length > 0 && <TrendTicker articles={trendArticles} />}

      <HeroSection />

      <Suspense>
        <SearchTrigger />
      </Suspense>

      <FeaturedStocks thaiStocks={thaiStocks} usStocks={usStocks} />

      <FeatureGrid />

      <Footer />

      {/* Global features */}
      <KongChatWidget />
      <ActiveUsersPanel />
    </main>
  );
}
