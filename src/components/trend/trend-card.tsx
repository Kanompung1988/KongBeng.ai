"use client";
import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

interface TrendArticle {
  id: string;
  title: string;
  titleTh: string | null;
  summary: string;
  summaryTh: string | null;
  category: string;
  tags: string[];
  imageUrl: string | null;
  publishedAt: string;
}

const categoryColors: Record<string, string> = {
  macro: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  tech: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  commodities: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  crypto: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "thai-market": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

const categoryLabels: Record<string, { th: string; en: string }> = {
  macro: { th: "เศรษฐกิจมหภาค", en: "Macro" },
  tech: { th: "เทคโนโลยี", en: "Tech" },
  commodities: { th: "สินค้าโภคภัณฑ์", en: "Commodities" },
  crypto: { th: "คริปโต", en: "Crypto" },
  "thai-market": { th: "ตลาดหุ้นไทย", en: "Thai Market" },
};

export function TrendCard({ article }: { article: TrendArticle }) {
  const { lang, t } = useLanguage();
  const title = (lang === "th" && article.titleTh) || article.title;
  const summary = (lang === "th" && article.summaryTh) || article.summary;
  const catLabel = categoryLabels[article.category]?.[lang] || article.category;
  const catColor = categoryColors[article.category] || "bg-muted text-muted-foreground border-border";

  const date = new Date(article.publishedAt).toLocaleDateString(lang === "th" ? "th-TH" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Link href={`/trend/${article.id}`} className="group block">
      <article className="glass-card p-5 h-full flex flex-col hover:border-emerald-500/30 transition-all duration-200">
        {/* Category + Date */}
        <div className="flex items-center justify-between mb-3">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${catColor}`}>
            {catLabel}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {date}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-foreground text-lg leading-tight mb-2 group-hover:text-emerald-400 transition-colors line-clamp-2">
          {title}
        </h3>

        {/* Summary */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1 line-clamp-3">
          {summary}
        </p>

        {/* Tags + Read More */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex flex-wrap gap-1.5">
            {article.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
          <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium group-hover:gap-2 transition-all">
            {t("trend.readMore")} <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </article>
    </Link>
  );
}
