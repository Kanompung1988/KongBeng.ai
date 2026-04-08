"use client";
import { useT } from "@/lib/i18n/context";

export function BackLink() {
  const t = useT();
  return (
    <a
      href="/"
      className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted/50 transition-colors"
    >
      &larr; {t("stock.back")}
    </a>
  );
}
