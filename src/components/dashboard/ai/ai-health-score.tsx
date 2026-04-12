"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Activity, RefreshCw, AlertTriangle, Zap } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

interface SubScore {
  label: string;
  key: string;
  score: number;
}

interface HealthData {
  score: number;
  breakdown: {
    diversification: { score: number; label: string };
    sectorBalance: { score: number; label: string };
    riskQuality: { score: number; label: string };
    growthPotential: { score: number; label: string };
  };
  summary: string;
  topAction: string;
}

function scoreColor(score: number) {
  if (score > 70) return "text-emerald-400";
  if (score >= 40) return "text-yellow-400";
  return "text-red-400";
}

function strokeColor(score: number) {
  if (score > 70) return "stroke-emerald-400";
  if (score >= 40) return "stroke-yellow-400";
  return "stroke-red-400";
}

function barBg(score: number) {
  if (score > 70) return "bg-emerald-400";
  if (score >= 40) return "bg-yellow-400";
  return "bg-red-400";
}

export function AIHealthScore() {
  const { lang, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<HealthData | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/health-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang }),
      });
      if (!res.ok) throw new Error("Failed to fetch health score");
      const json: HealthData = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const circumference = 2 * Math.PI * 54;
  const offset = data
    ? circumference - (data.score / 100) * circumference
    : circumference;

  const subScores: SubScore[] = data
    ? [
        { label: t("ai.diversification"), key: "diversification", score: data.breakdown.diversification.score },
        { label: t("ai.sectorBalance"), key: "sectorBalance", score: data.breakdown.sectorBalance.score },
        { label: t("ai.riskQuality"), key: "riskQuality", score: data.breakdown.riskQuality.score },
        { label: t("ai.growthPotential"), key: "growthPotential", score: data.breakdown.growthPotential.score },
      ]
    : [];

  return (
    <div className="glass-card rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white">{t("ai.healthScore")}</h3>
        </div>
        <button
          onClick={analyze}
          disabled={loading}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          {data ? t("ai.refreshAnalysis") : t("ai.analyzePortfolio")}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !data && (
        <div className="flex flex-col items-center gap-6">
          <div className="w-32 h-32 rounded-full bg-white/5 animate-pulse" />
          <div className="grid grid-cols-2 gap-4 w-full">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
          <div className="h-16 w-full rounded-lg bg-white/5 animate-pulse" />
        </div>
      )}

      {/* No data yet */}
      {!loading && !data && !error && (
        <div className="text-center py-10 text-zinc-500 text-sm">
          {t("ai.clickAnalyze")}
        </div>
      )}

      {/* Results */}
      {data && (
        <div className="flex flex-col items-center gap-6">
          {/* Circular gauge */}
          <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                strokeWidth="8"
                className="stroke-white/10"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className={cn(
                  "transition-all duration-1000 ease-out",
                  strokeColor(data.score)
                )}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-3xl font-bold", scoreColor(data.score))}>
                {data.score}
              </span>
              <span className="text-xs text-zinc-400">/ 100</span>
            </div>
          </div>

          {/* Sub-scores grid */}
          <div className="grid grid-cols-2 gap-3 w-full">
            {subScores.map((sub) => (
              <div
                key={sub.key}
                className="rounded-lg bg-white/5 p-3 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">{sub.label}</span>
                  <span className={cn("text-sm font-semibold", scoreColor(sub.score))}>
                    {sub.score}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700 ease-out",
                      barBg(sub.score)
                    )}
                    style={{ width: `${sub.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          {data.summary && (
            <p className="text-sm text-zinc-300 leading-relaxed">{data.summary}</p>
          )}

          {/* Top Action */}
          {data.topAction && (
            <div className="w-full flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Zap className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-medium text-emerald-400 uppercase tracking-wide">
                  {t("ai.topAction")}
                </span>
                <p className="text-sm text-zinc-200 mt-0.5">{data.topAction}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
