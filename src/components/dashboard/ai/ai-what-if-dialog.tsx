"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { FlaskConical, Loader2, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

interface AIWhatIfDialogProps {
  onClose: () => void;
}

export function AIWhatIfDialog({ onClose }: AIWhatIfDialogProps) {
  const { t, lang } = useLanguage();
  const [symbol, setSymbol] = useState("");
  const [shares, setShares] = useState("");
  const [action, setAction] = useState<"Buy" | "Sell">("Buy");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!symbol.trim() || !shares) return;

    setLoading(true);
    setResult("");
    setError(null);
    try {
      const res = await fetch("/api/ai/what-if", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: symbol.trim().toUpperCase(),
          shares: Number(shares),
          action,
          lang: lang,
        }),
      });
      if (!res.ok) throw new Error("Failed to run analysis");
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="glass-card rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">{t("ai.whatIf")}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Symbol</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="e.g. AAPL"
                className={cn(
                  "w-full px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10",
                  "text-white placeholder-zinc-500 outline-none",
                  "focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
                )}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Shares</label>
              <input
                type="number"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="100"
                min="1"
                className={cn(
                  "w-full px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10",
                  "text-white placeholder-zinc-500 outline-none",
                  "focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
                )}
                required
              />
            </div>
          </div>

          {/* Action toggle */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Action</label>
            <div className="flex rounded-lg overflow-hidden border border-white/10">
              <button
                type="button"
                onClick={() => setAction("Buy")}
                className={cn(
                  "flex-1 py-2 text-sm font-medium transition-colors",
                  action === "Buy"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-white/5 text-zinc-400 hover:text-zinc-300"
                )}
              >
                Buy
              </button>
              <button
                type="button"
                onClick={() => setAction("Sell")}
                className={cn(
                  "flex-1 py-2 text-sm font-medium transition-colors",
                  action === "Sell"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-white/5 text-zinc-400 hover:text-zinc-300"
                )}
              >
                Sell
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !symbol.trim() || !shares}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
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
              t("ai.whatIf")
            )}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Result */}
        {(result || (loading && !result)) && (
          <div className="border-t border-white/10 pt-4">
            {loading && !result && (
              <div className="flex items-center gap-2 text-zinc-400 text-sm py-2">
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
    </div>
  );
}
