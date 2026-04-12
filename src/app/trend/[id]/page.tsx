import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/landing/footer";
import { TrendArticleContent } from "@/components/trend/trend-article-content";
import { ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";

export const revalidate = 3600; // articles never change after generation

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await prisma.trendArticle.findUnique({
    where: { id },
    select: { title: true, summary: true },
  });
  if (!article) return { title: "Not Found" };
  return {
    title: `${article.title} — Khongbeng AI Trend`,
    description: article.summary,
  };
}

export default async function TrendArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await prisma.trendArticle.findUnique({ where: { id } });
  if (!article) notFound();

  const categoryLabels: Record<string, string> = {
    macro: "Macro Economy",
    tech: "Technology",
    commodities: "Commodities",
    crypto: "Crypto",
    "thai-market": "Thai Market",
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <Navbar />

      <article className="relative pt-28 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Back */}
          <Link href="/trend" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-emerald-400 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Back to Trends
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                {categoryLabels[article.category] || article.category}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {article.publishedAt.toLocaleDateString("en-US", {
                  year: "numeric", month: "long", day: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </span>
            </div>

            <TrendArticleContent article={{
              title: article.title,
              titleTh: article.titleTh,
              content: article.content,
              contentTh: article.contentTh,
              tags: article.tags,
              source: article.source,
            }} />
          </div>
        </div>
      </article>

      <Footer />
    </main>
  );
}
