"use client";

import { useState } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onClose: () => void;
  onCreated: () => void;
  isWatchlist?: boolean;
}

export function PortfolioCreateDialog({ onClose, onCreated, isWatchlist = false }: Props) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter a name");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/portfolio/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, isWatchlist }),
      });

      if (res.ok) {
        onCreated();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create portfolio");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="fixed left-1/2 top-[20%] z-50 w-full max-w-md -translate-x-1/2">
        <div className="mx-4 overflow-hidden rounded-2xl border border-border glass-card shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground">
              {isWatchlist ? "Create Watchlist" : "Create Portfolio"}
            </h3>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                {isWatchlist ? "Watchlist Name" : "Portfolio Name"}
              </label>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder={isWatchlist ? "e.g. Tech Stocks to Watch" : "e.g. My Main Portfolio"}
                autoFocus
                maxLength={50}
                className={cn(
                  "w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm",
                  "text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-1 focus:ring-emerald-500/50",
                  error && "border-red-500/50 focus:ring-red-500/50"
                )}
              />
              {error && (
                <p className="text-xs text-red-400 mt-1.5">{error}</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm hover:bg-muted transition-colors text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !name.trim()}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-white text-sm font-medium transition-colors",
                  "flex items-center justify-center gap-2",
                  "bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
