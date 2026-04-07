// Phase 2 — Prompt 3: Admin Dashboard
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminStockList } from "@/components/admin/admin-stock-list";
import { AdminBulkActions } from "@/components/admin/admin-bulk-actions";
import { BarChart3, Plus, TrendingUp, Eye } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};

async function getStats() {
  const [total, published, totalViews] = await Promise.all([
    prisma.stock.count(),
    prisma.stock.count({ where: { isPublished: true } }),
    prisma.stock.aggregate({ _sum: { viewCount: true } }),
  ]);
  return { total, published, drafts: total - published, totalViews: totalViews._sum.viewCount || 0 };
}

async function getStocks() {
  return prisma.stock.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true, symbol: true, name: true, sector: true,
      isPublished: true, viewCount: true, updatedAt: true,
      strategistVerdict: true,
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
      <header className="border-b border-border bg-card/30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <span className="text-emerald-400 font-bold text-sm">K</span>
            </div>
            <div>
              <h1 className="font-semibold text-foreground">KongBeng Admin</h1>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Link
            href="/admin/stocks/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Stock
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { icon: BarChart3, label: "Total Stocks", value: stats.total, color: "text-blue-400" },
            { icon: TrendingUp, label: "Published", value: stats.published, color: "text-emerald-400" },
            { icon: BarChart3, label: "Drafts", value: stats.drafts, color: "text-gold-400" },
            { icon: Eye, label: "Total Views", value: stats.totalViews.toLocaleString(), color: "text-purple-400" },
          ].map((s) => (
            <div key={s.label} className="glass-card p-4">
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Bulk Operations */}
        <AdminBulkActions />

        {/* Stock List */}
        <AdminStockList stocks={stocks} />
      </main>
    </div>
  );
}
