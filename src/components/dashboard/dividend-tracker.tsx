"use client";

import { useState, useEffect, useCallback } from "react";
import { cn, formatNumber } from "@/lib/utils";
import {
  DollarSign,
  Plus,
  Loader2,
  TrendingUp,
  Calendar,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────────────── */

interface Dividend {
  id: string;
  symbol: string;
  amount: number;
  perShare: number;
  exDate: string;
  payDate: string;
}

interface DividendTrackerProps {
  portfolioId: string;
}

/* ─── Component ──────────────────────────────────────────────────────────────── */

export function DividendTracker({ portfolioId }: DividendTrackerProps) {
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [symbol, setSymbol] = useState("");
  const [amount, setAmount] = useState("");
  const [perShare, setPerShare] = useState("");
  const [exDate, setExDate] = useState("");
  const [payDate, setPayDate] = useState("");

  /* ── Fetch ─────────────────────────────────────────────────────────────────── */

  const fetchDividends = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/portfolio/dividends?portfolioId=${portfolioId}`
      );
      if (res.ok) {
        const json = await res.json();
        const data: Dividend[] = json.dividends ?? json;
        setDividends(data);
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, [portfolioId]);

  useEffect(() => {
    fetchDividends();
  }, [fetchDividends]);

  /* ── Derived data ──────────────────────────────────────────────────────────── */

  const totalDividends = dividends.reduce((sum, d) => sum + d.amount, 0);

  // Sort by payDate desc
  const sorted = [...dividends].sort(
    (a, b) => new Date(b.payDate).getTime() - new Date(a.payDate).getTime()
  );

  /* ── Handlers ──────────────────────────────────────────────────────────────── */

  const resetForm = () => {
    setSymbol("");
    setAmount("");
    setPerShare("");
    setExDate("");
    setPayDate("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSymbol = symbol.trim().toUpperCase();
    const parsedAmount = parseFloat(amount);
    const parsedPerShare = parseFloat(perShare);

    if (!trimmedSymbol || isNaN(parsedAmount) || isNaN(parsedPerShare)) return;
    if (!exDate || !payDate) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/portfolio/dividends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portfolioId,
          symbol: trimmedSymbol,
          amount: parsedAmount,
          perShare: parsedPerShare,
          exDate,
          payDate,
        }),
      });
      if (res.ok) {
        resetForm();
        setShowForm(false);
        fetchDividends();
      }
    } catch {
      /* ignore */
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Format date ───────────────────────────────────────────────────────────── */

  const fmtDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  };

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
          <DollarSign className="w-5 h-5 text-emerald-400" />
          <h2 className="font-semibold text-foreground">Dividend Tracker</h2>
        </div>
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Record Dividend
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Total Received
            </p>
            <p className="text-lg font-bold text-foreground">
              {totalDividends > 0 ? formatNumber(totalDividends) : "$0.00"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-gold-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Dividend Yield Est.
            </p>
            <p className="text-lg font-bold text-foreground">
              {dividends.length > 0 ? "—" : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Record Dividend Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="px-5 py-4 border-b border-border bg-muted/20"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
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
                Amount
              </label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="250.00"
                type="number"
                step="any"
                min="0"
                required
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Per Share
              </label>
              <input
                value={perShare}
                onChange={(e) => setPerShare(e.target.value)}
                placeholder="0.50"
                type="number"
                step="any"
                min="0"
                required
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Ex-Date
              </label>
              <input
                value={exDate}
                onChange={(e) => setExDate(e.target.value)}
                type="date"
                required
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Pay Date
              </label>
              <input
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                type="date"
                required
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
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
                Record
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Dividends Table */}
      {sorted.length === 0 ? (
        <div className="py-12 text-center">
          <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">
            No dividends recorded yet
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Record your first dividend to start tracking income.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                <th className="text-left px-5 py-3">Date</th>
                <th className="text-left px-4 py-3">Symbol</th>
                <th className="text-right px-4 py-3">Amount</th>
                <th className="text-right px-4 py-3">Per Share</th>
                <th className="text-right px-5 py-3">Ex-Date</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((div) => (
                <tr
                  key={div.id}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-5 py-3 text-sm text-foreground">
                    {fmtDate(div.payDate)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono font-semibold text-sm text-foreground">
                      {div.symbol}
                    </span>
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right text-sm font-medium text-emerald-400"
                    )}
                  >
                    +{div.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                    {div.perShare.toFixed(4)}
                  </td>
                  <td className="px-5 py-3 text-right text-sm text-muted-foreground">
                    {fmtDate(div.exDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
