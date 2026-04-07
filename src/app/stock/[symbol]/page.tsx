// Phase 3 — Prompt 6: Stock Detail Page with Sticky Sidebar
// Phase 5 — Prompt 9: Dynamic SEO Metadata
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { parseStrategistVerdict, truncate } from "@/lib/utils";
import { StockHero } from "@/components/stock/stock-hero";
import { StockSidebar } from "@/components/stock/stock-sidebar";
import { BusinessOverviewSection } from "@/components/stock/sections/business-overview";
import { RevenueStructureSection } from "@/components/stock/sections/revenue-structure";
import { FinancialHealthSection } from "@/components/stock/sections/financial-health";
import { StrategistVerdictSection } from "@/components/stock/sections/strategist-verdict";
import { TextSection } from "@/components/stock/sections/text-section";
import { ChatDrawer } from "@/components/chat/chat-drawer";

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

// Phase 5 — Dynamic Metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { symbol } = await params;
  const stock = await prisma.stock.findUnique({
    where: { symbol: symbol.toUpperCase() },
    select: { name: true, symbol: true, strategistVerdict: true, businessOverview: true },
  });

  if (!stock) return { title: "Stock Not Found" };

  const verdict = parseStrategistVerdict(stock.strategistVerdict);
  const description = verdict?.summary
    ? truncate(verdict.summary, 155)
    : stock.businessOverview
    ? truncate(stock.businessOverview, 155)
    : `Strategic analysis of ${stock.name} (${stock.symbol}) — business model, financials, growth strategy, and KongBeng Strategist verdict.`;

  const title = `${stock.name} (${stock.symbol}) Analysis — KongBeng Strategist`;

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
          <a href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <span className="text-emerald-400 font-bold text-xs">K</span>
            </div>
            <span className="text-sm font-semibold hidden sm:block">KongBeng</span>
          </a>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-mono font-semibold text-foreground">{stock.symbol}</span>
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
            <BusinessOverviewSection content={stock.businessOverview} />
            <RevenueStructureSection raw={stock.revenueStructure} />
            <FinancialHealthSection raw={stock.financialHealth} />
            <TextSection
              id="growthStrategy"
              title="Growth Strategy"
              iconName="TrendingUp"
              content={stock.growthStrategy}
            />
            <TextSection
              id="moat"
              title="Competitive Moat"
              iconName="Shield"
              content={stock.moat}
            />
            <TextSection
              id="risks"
              title="Key Risks"
              iconName="AlertTriangle"
              content={stock.risks}
              variant="warning"
            />
            <TextSection
              id="industryLandscape"
              title="Industry Landscape"
              iconName="Globe"
              content={stock.industryLandscape}
            />
            <StrategistVerdictSection
              raw={stock.strategistVerdict}
              symbol={stock.symbol}
              stockName={stock.name}
            />
          </main>
        </div>
      </div>

      {/* AI Chat Drawer — Phase 4 */}
      <ChatDrawer stock={stock} />
    </div>
  );
}
