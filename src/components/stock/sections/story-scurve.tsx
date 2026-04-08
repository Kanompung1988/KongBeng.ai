import { Rocket } from "lucide-react";
import { SectionHeader } from "./core-business";
import { parseStorySCurve } from "@/lib/utils";

interface Props {
  raw: string | null | undefined;
}

const potentialColors = {
  high: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  medium: "bg-gold-500/20 text-gold-300 border-gold-500/30",
  low: "bg-muted text-muted-foreground border-border",
};

export function StorySCurveSection({ raw }: Props) {
  const data = parseStorySCurve(raw);
  if (!data) return null;

  return (
    <section id="storyAndSCurve" className="scroll-mt-24">
      <SectionHeader icon={<Rocket className="w-5 h-5 text-purple-400" />} title="Story & New S-Curve" />
      <div className="glass-card p-6 space-y-6">
        {/* Current Story */}
        {data.currentStory && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Current Growth Story</h3>
            {data.currentStory.split("\n").filter(Boolean).map((p, i) => (
              <p key={i} className="text-sm text-muted-foreground leading-relaxed">{p}</p>
            ))}
          </div>
        )}

        {/* New S-Curves */}
        {data.newSCurves && data.newSCurves.length > 0 && (
          <div className="pt-4 border-t border-border/50">
            <h3 className="text-sm font-semibold text-foreground mb-3">New S-Curves</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.newSCurves.map((sc, i) => (
                <div key={i} className="glass-card p-4 bg-muted/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-foreground">{sc.title}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${potentialColors[sc.potential]}`}>
                      {sc.potential.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{sc.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hidden Gems */}
        {data.hiddenGems && data.hiddenGems.length > 0 && (
          <div className="pt-4 border-t border-border/50">
            <h3 className="text-sm font-semibold text-foreground mb-3">Hidden Gems</h3>
            <div className="space-y-3">
              {data.hiddenGems.map((gem, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gold-500/5 border border-gold-500/10">
                  <span className="text-gold-400 text-lg shrink-0">💎</span>
                  <div>
                    <span className="text-sm font-medium text-foreground">{gem.title}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{gem.description}</p>
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
