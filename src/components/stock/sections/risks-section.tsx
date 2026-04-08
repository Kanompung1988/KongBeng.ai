import { AlertTriangle } from "lucide-react";
import { SectionHeader } from "./core-business";
import { parseRisks } from "@/lib/utils";

interface Props {
  raw: string | null | undefined;
}

const severityColors = {
  high: "bg-red-500/20 text-red-300 border-red-500/30",
  medium: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  low: "bg-gold-500/20 text-gold-300 border-gold-500/30",
};

const severityBorder = {
  high: "border-l-red-500",
  medium: "border-l-orange-500",
  low: "border-l-gold-500",
};

export function RisksSection({ raw }: Props) {
  const data = parseRisks(raw);
  if (!data) return null;

  return (
    <section id="risks" className="scroll-mt-24">
      <SectionHeader icon={<AlertTriangle className="w-5 h-5 text-orange-400" />} title="ความเสี่ยง / Investment Risks" />
      <div className="glass-card p-6 space-y-4">
        {data.risks.map((risk, i) => (
          <div
            key={i}
            className={`glass-card p-4 bg-muted/20 border-l-4 ${severityBorder[risk.severity]}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">{risk.title}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${severityColors[risk.severity]}`}>
                {risk.severity.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-2">{risk.description}</p>
            {risk.mitigation && (
              <div className="flex items-start gap-2 pt-2 border-t border-border/30">
                <span className="text-emerald-400 text-xs shrink-0">Mitigation:</span>
                <p className="text-xs text-muted-foreground">{risk.mitigation}</p>
              </div>
            )}
          </div>
        ))}

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
