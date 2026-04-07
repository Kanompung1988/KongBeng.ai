"use client";
import { Sword, CheckCircle, XCircle, Share2 } from "lucide-react";
import { SectionHeader } from "./business-overview";
import { parseStrategistVerdict, scoreToColor, ratingToBadgeClass } from "@/lib/utils";
import { generateShareCard } from "@/lib/share-card";

interface Props {
  raw: string | null | undefined;
  symbol: string;
  stockName: string;
}

// Score progress ring
function ScoreRing({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="relative w-28 h-28 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="hsl(222,47%,16%)" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={score >= 8 ? "#10b981" : score >= 6 ? "#f59e0b" : "#ef4444"}
          strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${scoreToColor(score)}`}>{score}</span>
        <span className="text-xs text-muted-foreground">/10</span>
      </div>
    </div>
  );
}

export function StrategistVerdictSection({ raw, symbol, stockName }: Props) {
  const verdict = parseStrategistVerdict(raw);
  if (!verdict) return null;

  const handleShare = async () => {
    try {
      await generateShareCard({ symbol, stockName, verdict });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <section id="strategistVerdict" className="scroll-mt-24">
      <SectionHeader icon={<Sword className="w-5 h-5 text-gold-400" />} title="Strategist's Verdict" />
      <div className="glass-card p-6 border border-gold-500/10">
        <div className="flex flex-col sm:flex-row gap-8 items-start">
          {/* Score */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            <ScoreRing score={verdict.score} />
            <span className={`px-4 py-1.5 rounded-full border text-sm font-bold ${ratingToBadgeClass(verdict.rating)}`}>
              {verdict.rating}
            </span>
            {verdict.targetPrice && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Target Price</p>
                <p className="font-mono font-bold text-foreground">
                  {verdict.targetPrice} {verdict.currency}
                </p>
                <p className="text-xs text-muted-foreground">{verdict.timeHorizon}</p>
              </div>
            )}
          </div>

          {/* Thesis */}
          <div className="flex-1 space-y-5">
            <p className="text-muted-foreground leading-relaxed">{verdict.summary}</p>

            {/* Bull / Bear */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-emerald-400 mb-2 font-semibold">Bull Case</p>
                <ul className="space-y-2">
                  {verdict.bullPoints.map((p, i) => (
                    <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-red-400 mb-2 font-semibold">Bear Risks</p>
                <ul className="space-y-2">
                  {verdict.bearPoints.map((p, i) => (
                    <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                      <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Share button */}
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm text-foreground transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share Analysis Card
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
