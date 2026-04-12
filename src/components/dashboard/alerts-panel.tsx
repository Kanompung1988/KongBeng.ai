"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Bell,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  CheckCircle2,
  Eye,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────────────── */

interface Alert {
  id: string;
  symbol: string;
  targetPrice: number;
  direction: "above" | "below";
  triggered: boolean;
  currentPrice: number | null;
  createdAt: string;
}

/* ─── Component ──────────────────────────────────────────────────────────────── */

export function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [symbol, setSymbol] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [showForm, setShowForm] = useState(false);

  /* ── Fetch ─────────────────────────────────────────────────────────────────── */

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/portfolio/alerts");
      if (res.ok) {
        const json = await res.json();
        const data: Alert[] = json.alerts ?? json;
        setAlerts(data);
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(fetchAlerts, 30_000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  /* ── Handlers ──────────────────────────────────────────────────────────────── */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSymbol = symbol.trim().toUpperCase();
    const price = parseFloat(targetPrice);
    if (!trimmedSymbol || isNaN(price) || price <= 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/portfolio/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: trimmedSymbol,
          targetPrice: price,
          direction,
        }),
      });
      if (res.ok) {
        setSymbol("");
        setTargetPrice("");
        setDirection("above");
        setShowForm(false);
        fetchAlerts();
      }
    } catch {
      /* ignore */
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (alertId: string) => {
    setDeletingId(alertId);
    try {
      await fetch(`/api/portfolio/alerts?alertId=${alertId}`, {
        method: "DELETE",
      });
      fetchAlerts();
    } catch {
      /* ignore */
    } finally {
      setDeletingId(null);
    }
  };

  /* ── Sort: triggered first, then by createdAt desc ─────────────────────────── */

  const sorted = [...alerts].sort((a, b) => {
    if (a.triggered !== b.triggered) return a.triggered ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  /* ── Render ────────────────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-6 flex items-center justify-center min-h-[200px]">
        <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-gold-400" />
          <h2 className="font-semibold text-foreground">Price Alerts</h2>
          {alerts.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({alerts.filter((a) => a.triggered).length} triggered)
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Alert
        </button>
      </div>

      {/* Add Alert Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="px-5 py-4 border-b border-border bg-muted/20"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Symbol
              </label>
              <input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="AAPL"
                required
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Target Price
              </label>
              <input
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="150.00"
                type="number"
                step="any"
                min="0"
                required
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Direction
              </label>
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setDirection("above")}
                  className={cn(
                    "flex-1 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1",
                    direction === "above"
                      ? "bg-emerald-500/20 text-emerald-400 border-r border-emerald-500/30"
                      : "bg-muted text-muted-foreground border-r border-border hover:text-foreground"
                  )}
                >
                  <ArrowUp className="w-3 h-3" />
                  Above
                </button>
                <button
                  type="button"
                  onClick={() => setDirection("below")}
                  className={cn(
                    "flex-1 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1",
                    direction === "below"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ArrowDown className="w-3 h-3" />
                  Below
                </button>
              </div>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Add
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Alerts List */}
      <div className="divide-y divide-border/50">
        {sorted.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">No alerts yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add an alert to get notified when a stock hits your target price.
            </p>
          </div>
        ) : (
          sorted.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "flex items-center gap-4 px-5 py-3 transition-colors",
                alert.triggered ? "bg-emerald-500/5" : "hover:bg-muted/30"
              )}
            >
              {/* Direction Icon */}
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg shrink-0",
                  alert.direction === "above"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400"
                )}
              >
                {alert.direction === "above" ? (
                  <ArrowUp className="w-4 h-4" />
                ) : (
                  <ArrowDown className="w-4 h-4" />
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-sm text-foreground">
                    {alert.symbol}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {alert.direction === "above" ? "above" : "below"}{" "}
                    {alert.targetPrice.toFixed(2)}
                  </span>
                </div>
                {alert.currentPrice != null && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Current: {alert.currentPrice.toFixed(2)}
                  </p>
                )}
              </div>

              {/* Status */}
              <div className="shrink-0">
                {alert.triggered ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Triggered
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="w-3.5 h-3.5" />
                    Watching
                  </span>
                )}
              </div>

              {/* Delete */}
              <button
                onClick={() => handleDelete(alert.id)}
                disabled={deletingId === alert.id}
                className="shrink-0 p-1.5 rounded-md hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-50"
                title="Delete alert"
              >
                {deletingId === alert.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
