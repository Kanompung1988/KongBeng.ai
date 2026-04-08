"use client";

import { SECTION_LABELS, type SectionKey } from "@/types";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const SECTIONS: SectionKey[] = [
  "coreBusiness",
  "customerBase",
  "revenueModel",
  "financials",
  "sevenPowers",
  "storyAndSCurve",
  "risks",
  "ceoProfile",
];

export function StockSidebar() {
  const [active, setActive] = useState<SectionKey>("coreBusiness");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.id as SectionKey);
          }
        });
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );

    SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: SectionKey) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="sticky top-24 space-y-1">
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 px-2">Sections</p>
      {SECTIONS.map((key) => (
        <button
          key={key}
          onClick={() => scrollTo(key)}
          className={cn(
            "w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-150",
            active === key
              ? "bg-emerald-500/15 text-emerald-400 font-medium border-l-2 border-emerald-400"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          {SECTION_LABELS[key]}
        </button>
      ))}
    </div>
  );
}
