// Stock Detail Page — Khongbeng Strategist
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { parseCoreBusiness, truncate } from "@/lib/utils";
import { StockHero } from "@/components/stock/stock-hero";
import { StockSidebar } from "@/components/stock/stock-sidebar";
import { CoreBusinessSection } from "@/components/stock/sections/core-business";
import { CustomerBaseSection } from "@/components/stock/sections/customer-base";
import { RevenueModelSection } from "@/components/stock/sections/revenue-model";
import { FinancialsSection } from "@/components/stock/sections/financials";
import { SevenPowersSection } from "@/components/stock/sections/seven-powers";
import { StorySCurveSection } from "@/components/stock/sections/story-scurve";
import { RisksSection } from "@/components/stock/sections/risks-section";
import { CeoProfileSection } from "@/components/stock/sections/ceo-profile";
import { ChatDrawer } from "@/components/chat/chat-drawer";
import Image from "next/image";

interface Props {
  params: Promise<{ symbol: string }>;
}

async function getStock(symbol: string) {
  const stock = await prisma.stock.findUnique({
    where: { symbol: symbol.toUpperCase() },
    include: { updatedBy: { select: { id: true, name: true, email: true } } },
  });
  if (!stock || !stock.isPublished) return null;

  // Increment view count (fire and forget)
  prisma.stock.update({
    where: { id: stock.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {});

  return stock;
}

// Dynamic Metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { symbol } = await params;
  const stock = await prisma.stock.findUnique({
    where: { symbol: symbol.toUpperCase() },
    select: { name: true, symbol: true, coreBusiness: true },
  });

  if (!stock) return { title: "Stock Not Found" };

  const coreData = parseCoreBusiness(stock.coreBusiness);
  const description = coreData?.summary
    ? truncate(coreData.summary, 155)
    : `Strategic analysis of ${stock.name} (${stock.symbol}) — business model, financials, 7 Powers, CEO execution, and Khongbeng Strategist insights.`;

  const title = `${stock.name} (${stock.symbol}) Analysis — Khongbeng Strategist`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `${process.env.NEXT_PUBLIC_APP_URL}/stock/${stock.symbol}`,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function StockPage({ params }: Props) {
  const { symbol } = await params;
  const stock = await getStock(symbol);
  if (!stock) notFound();

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-emerald-500/3 rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
          <a href="/" className="flex items-center gap-2 group">
            <Image src="/logo.jpg" alt="K" width={28} height={28} className="rounded-lg" />
            <span className="text-sm font-semibold hidden sm:block">Khongbeng</span>
          </a>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-mono font-semibold text-foreground">{stock.symbol}</span>
          <a
            href="/"
            className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted/50 transition-colors"
          >
            &larr; Back
          </a>
        </div>
      </nav>

      {/* Stock Hero */}
      <StockHero stock={stock} />

      {/* Main Layout: Sidebar + Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sticky Sidebar (desktop) */}
          <aside className="hidden lg:block w-56 shrink-0">
            <StockSidebar />
          </aside>

          {/* Content Sections */}
          <main className="flex-1 min-w-0 space-y-12">
            <CoreBusinessSection raw={stock.coreBusiness} />
            <CustomerBaseSection raw={stock.customerBase} />
            <RevenueModelSection raw={stock.revenueModel} />
            <FinancialsSection raw={stock.financials} />
            <SevenPowersSection raw={stock.sevenPowers} />
            <StorySCurveSection raw={stock.storyAndSCurve} />
            <RisksSection raw={stock.risks} />
            <CeoProfileSection raw={stock.ceoProfile} />
          </main>
        </div>
      </div>

      {/* AI Chat Drawer */}
      <ChatDrawer stock={stock} />
    </div>
  );
}
