"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { BarChart3, Loader2, Trash2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

export function AIPortfolioAnalysis() {
  const { t, lang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    setLoading(true);
    setResult("");
    setError(null);
    try {
      const res = await fetch("/api/ai/portfolio-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang }),
      });
      if (!res.ok) throw new Error("Failed to start analysis");
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setResult((prev) => prev + decoder.decode(value));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function clear() {
    setResult("");
    setError(null);
  }

  return (
    <div className="glass-card rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white">{t("ai.analyzePortfolio")}</h3>
        </div>
        <div className="flex items-center gap-2">
          {result && (
            <button
              onClick={clear}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-300 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t("ai.clear")}
            </button>
          )}
          <button
            onClick={analyze}
            disabled={loading}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
              "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("ai.analyzing")}
              </>
            ) : (
              t("ai.analyzePortfolio")
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !result && !error && (
        <div className="text-center py-10 text-zinc-500 text-sm">
          {t("ai.clickAnalyze")}
        </div>
      )}

      {/* Streaming result */}
      {(result || loading) && (
        <div className="relative">
          {loading && !result && (
            <div className="flex items-center gap-2 text-zinc-400 text-sm py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("ai.analyzing")}
            </div>
          )}
          {result && (
            <div className="prose prose-invert prose-emerald max-w-none text-sm">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          )}
          {loading && result && (
            <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse ml-0.5" />
          )}
        </div>
      )}
    </div>
  );
}
