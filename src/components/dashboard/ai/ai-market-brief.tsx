"use client";

import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { Newspaper, Loader2, RefreshCw } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

export function AIMarketBrief() {
  const { t, lang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    setResult("");
    setError(null);
    try {
      const res = await fetch("/api/ai/market-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang }),
      });
      if (!res.ok) throw new Error("Failed to generate market brief");
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
  }, [lang]);

  useEffect(() => {
    generate();
  }, [generate]);

  const today = new Date().toLocaleDateString(lang === "th" ? "th-TH" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="glass-card rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white">{t("ai.marketBrief")}</h3>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          {t("ai.refreshAnalysis")}
        </button>
      </div>
      <p className="text-xs text-zinc-500 mb-4">{today}</p>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && !result && (
        <div className="flex items-center gap-2 text-zinc-400 text-sm py-6">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("ai.analyzing")}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="prose prose-invert prose-emerald max-w-none text-sm">
          <ReactMarkdown>{result}</ReactMarkdown>
        </div>
      )}
      {loading && result && (
        <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse ml-0.5" />
      )}
    </div>
  );
}
