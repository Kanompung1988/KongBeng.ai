"use client";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";
import { TrendingUp } from "lucide-react";

interface TickerArticle {
  id: string;
  title: string;
  titleTh: string | null;
  category: string;
}

const categoryEmoji: Record<string, string> = {
  macro: "🌍",
  tech: "💻",
  commodities: "🛢️",
  crypto: "₿",
  "thai-market": "🇹🇭",
};

export function TrendTicker({ articles }: { articles: TickerArticle[] }) {
  const { lang } = useLanguage();

  if (!articles.length) return null;

  // Duplicate for infinite scroll
  const items = [...articles, ...articles];

  return (
    <div className="relative w-full overflow-hidden bg-card/50 border-y border-border/50 backdrop-blur-sm">
      <div className="flex items-center">
        {/* Label */}
        <div className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500/10 border-r border-border/50 z-10">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400 whitespace-nowrap">AI Trend</span>
        </div>

        {/* Scrolling ticker */}
        <div className="flex-1 overflow-hidden">
          <div className="flex animate-ticker whitespace-nowrap">
            {items.map((article, i) => {
              const title = (lang === "th" && article.titleTh) || article.title;
              const emoji = categoryEmoji[article.category] || "📊";
              return (
                <Link
                  key={`${article.id}-${i}`}
                  href={`/trend/${article.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs text-muted-foreground hover:text-emerald-400 transition-colors shrink-0"
                >
                  <span>{emoji}</span>
                  <span className="max-w-[300px] truncate">{title}</span>
                  <span className="text-border">|</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker ${articles.length * 8}s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
