import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminStockList } from "@/components/admin/admin-stock-list";
import { AdminBulkActions } from "@/components/admin/admin-bulk-actions";
import { BarChart3, Plus, TrendingUp, Eye, Home, Cpu, Globe, LogOut } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};

async function getStats() {
  const [total, published, totalViews, withAI] = await Promise.all([
    prisma.stock.count(),
    prisma.stock.count({ where: { isPublished: true } }),
    prisma.stock.aggregate({ _sum: { viewCount: true } }),
    prisma.stock.count({ where: { coreBusiness: { not: null } } }),
  ]);
  return {
    total,
    published,
    drafts: total - published,
    totalViews: totalViews._sum.viewCount || 0,
    withAI,
    withoutAI: total - withAI,
  };
}

async function getStocks() {
  return prisma.stock.findMany({
    orderBy: { symbol: "asc" },
    select: {
      id: true, symbol: true, name: true, sector: true, exchange: true,
      isPublished: true, viewCount: true, updatedAt: true,
      coreBusiness: true,
    },
  });
}

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [stats, stocks] = await Promise.all([getStats(), getStocks()]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="shrink-0">
              <Image src="/logo.jpg" alt="K" width={36} height={36} className="rounded-lg" />
            </Link>
            <div>
              <h1 className="font-bold text-foreground text-lg">Admin Dashboard</h1>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <Link
              href="/admin/stocks/new"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              Add Stock
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {[
            { icon: BarChart3, label: "Total Stocks", value: stats.total, color: "text-blue-400", bg: "bg-blue-500/10" },
            { icon: TrendingUp, label: "Published", value: stats.published, color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { icon: Eye, label: "Drafts", value: stats.drafts, color: "text-amber-400", bg: "bg-amber-500/10" },
            { icon: Cpu, label: "AI Ready", value: stats.withAI, color: "text-cyan-400", bg: "bg-cyan-500/10" },
            { icon: Globe, label: "No AI Data", value: stats.withoutAI, color: "text-red-400", bg: "bg-red-500/10" },
            { icon: Eye, label: "Total Views", value: stats.totalViews.toLocaleString(), color: "text-purple-400", bg: "bg-purple-500/10" },
          ].map((s) => (
            <div key={s.label} className="glass-card p-4 hover:border-white/10 transition-all">
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Bulk Operations */}
        <AdminBulkActions />

        {/* Stock List */}
        <AdminStockList stocks={stocks.map(s => ({ ...s, hasAI: !!s.coreBusiness }))} />
      </main>
    </div>
  );
}
