"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/context";

const categories = [
  { key: "", labelKey: "trend.allCategories" },
  { key: "macro", labelKey: "trend.macro" },
  { key: "tech", labelKey: "trend.tech" },
  { key: "commodities", labelKey: "trend.commodities" },
  { key: "crypto", labelKey: "trend.crypto" },
  { key: "thai-market", labelKey: "trend.thaiMarket" },
] as const;

export function TrendFilters({ activeCategory }: { activeCategory?: string }) {
  const { t } = useLanguage();
  const active = activeCategory || "";

  return (
    <div className="max-w-5xl mx-auto px-6 mb-8">
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Link
            key={cat.key}
            href={cat.key ? `/trend?category=${cat.key}` : "/trend"}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              active === cat.key
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {t(cat.labelKey as Parameters<typeof t>[0])}
          </Link>
        ))}
      </div>
    </div>
  );
}
