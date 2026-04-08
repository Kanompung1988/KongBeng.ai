"use client";
import { Users } from "lucide-react";
import { SectionHeader } from "./core-business";
import { parseCustomerBase } from "@/lib/utils";
import { useT } from "@/lib/i18n/context";

interface Props {
  raw: string | null | undefined;
}

export function CustomerBaseSection({ raw }: Props) {
  const data = parseCustomerBase(raw);
  const t = useT();
  if (!data) return null;

  const strengthColors = {
    high: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    medium: "bg-gold-500/20 text-gold-300 border-gold-500/30",
    low: "bg-red-500/20 text-red-300 border-red-500/30",
  };

  return (
    <section id="customerBase" className="scroll-mt-24">
      <SectionHeader icon={<Users className="w-5 h-5 text-blue-400" />} title={t("section.customerBase")} />
      <div className="glass-card p-6 space-y-6">
        {/* Customer Model Badge */}
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 text-sm font-semibold">
            {data.model}
          </span>
          <p className="text-muted-foreground text-sm">{data.description}</p>
        </div>

        {/* Customer Segments */}
        {data.customerSegments && data.customerSegments.length > 0 && (
          <div className="pt-4 border-t border-border/50">
            <h3 className="text-sm font-semibold text-foreground mb-3">{t("stock.customerSegments")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.customerSegments.map((seg, i) => (
                <div key={i} className="glass-card p-4 bg-muted/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{seg.name}</span>
                    <span className="text-xs font-mono text-blue-400">{seg.percentage}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{seg.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stickiness Factors */}
        {data.stickiness && data.stickiness.length > 0 && (
          <div className="pt-4 border-t border-border/50">
            <h3 className="text-sm font-semibold text-foreground mb-3">{t("stock.stickinessFactors")}</h3>
            <div className="space-y-3">
              {data.stickiness.map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className={`shrink-0 mt-0.5 px-2 py-0.5 rounded text-xs font-semibold border ${strengthColors[s.strength]}`}>
                    {s.strength.toUpperCase()}
                  </span>
                  <div>
                    <span className="text-sm font-medium text-foreground">{s.factor}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {data.summary && (
          <div className="pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground leading-relaxed">{data.summary}</p>
          </div>
        )}
      </div>
    </section>
  );
}
