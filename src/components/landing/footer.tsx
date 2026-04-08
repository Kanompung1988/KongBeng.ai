"use client";

import { useT } from "@/lib/i18n/context";
import Image from "next/image";

export function Footer() {
  const t = useT();

  return (
    <footer className="border-t border-border px-6 py-10 mt-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Image src="/logo.jpg" alt="K" width={28} height={28} className="rounded-lg" />
          <span className="text-sm font-semibold text-foreground">Khongbeng Strategist</span>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {t("footer.disclaimer")}
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date().getFullYear()} Khongbeng
        </p>
      </div>
    </footer>
  );
}
