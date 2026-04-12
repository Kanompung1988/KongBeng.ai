"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Eye, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

interface Portfolio {
  id: string;
  name: string;
  isWatchlist: boolean;
  itemCount: number;
}

interface Props {
  portfolios: Portfolio[];
  activeId: string | null;
  onChange: (id: string) => void;
}

export function PortfolioSelector({ portfolios, activeId, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const active = portfolios.find((p) => p.id === activeId) ?? portfolios[0];

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  if (!portfolios.length) return null;

  return (
    <div ref={ref} className="relative inline-block">
      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-xl",
          "glass-card border border-border hover:border-emerald-500/30",
          "text-foreground text-sm font-medium transition-colors"
        )}
      >
        {active?.isWatchlist ? (
          <Eye className="w-4 h-4 text-gold-400" />
        ) : (
          <Briefcase className="w-4 h-4 text-emerald-400" />
        )}
        <span>{active?.name ?? "Select Portfolio"}</span>
        <span className="text-xs text-muted-foreground">({active?.itemCount ?? 0})</span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-2 z-50 min-w-[240px] glass-card rounded-xl border border-border shadow-2xl overflow-hidden">
          {portfolios.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                onChange(p.id);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors",
                "hover:bg-muted/50",
                p.id === activeId && "bg-emerald-500/10 text-emerald-400"
              )}
            >
              {p.isWatchlist ? (
                <Eye className="w-4 h-4 shrink-0 text-gold-400" />
              ) : (
                <Briefcase className="w-4 h-4 shrink-0 text-emerald-400" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground truncate">{p.name}</div>
              </div>
              <span className="text-xs text-muted-foreground">{p.itemCount} stocks</span>
              {p.isWatchlist && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gold-500/20 text-gold-400 border border-gold-500/30">
                  Watchlist
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
