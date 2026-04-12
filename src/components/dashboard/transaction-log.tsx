"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowDownCircle,
  ArrowUpCircle,
  Coins,
  Receipt,
  Search,
} from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/context";

type TransactionType = "buy" | "sell" | "dividend";

interface Transaction {
  id: string;
  type: TransactionType;
  symbol: string;
  shares: number | null;
  price: number | null;
  fees: number | null;
  total: number | null;
  notes: string | null;
  date: string;
}

interface Props {
  portfolioId: string;
}

const PAGE_SIZE = 20;

const TYPE_STYLES: Record<TransactionType, string> = {
  buy: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  sell: "bg-red-500/20 text-red-400 border-red-500/30",
  dividend: "bg-gold-500/20 text-gold-400 border-gold-500/30",
};

const TYPE_ICONS: Record<TransactionType, React.ReactNode> = {
  buy: <ArrowDownCircle className="w-3.5 h-3.5" />,
  sell: <ArrowUpCircle className="w-3.5 h-3.5" />,
  dividend: <Coins className="w-3.5 h-3.5" />,
};

export function TransactionLog({ portfolioId }: Props) {
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formType, setFormType] = useState<TransactionType>("buy");
  const [formSymbol, setFormSymbol] = useState("");
  const [formShares, setFormShares] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formFees, setFormFees] = useState("");
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formNotes, setFormNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Symbol search
  const [symbolResults, setSymbolResults] = useState<{ symbol: string; name: string }[]>([]);
  const [symbolSearching, setSymbolSearching] = useState(false);
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/portfolio/transactions?portfolioId=${portfolioId}&page=${page}&limit=${PAGE_SIZE}`
      );
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setTotalCount(data.pagination?.total || 0);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [portfolioId, page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Symbol search debounce
  useEffect(() => {
    if (!formSymbol.trim()) {
      setSymbolResults([]);
      setShowSymbolDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setSymbolSearching(true);
      try {
        const res = await fetch(
          `/api/stocks/search?q=${encodeURIComponent(formSymbol)}&limit=5`
        );
        const data = await res.json();
        setSymbolResults(
          (data.results || []).map((r: { symbol: string; name: string }) => ({
            symbol: r.symbol,
            name: r.name,
          }))
        );
        setShowSymbolDropdown(true);
      } catch {
        setSymbolResults([]);
      } finally {
        setSymbolSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [formSymbol]);

  const resetForm = () => {
    setFormType("buy");
    setFormSymbol("");
    setFormShares("");
    setFormPrice("");
    setFormFees("");
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormNotes("");
    setFormError(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSymbol.trim()) {
      setFormError("Symbol is required");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/portfolio/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portfolioId,
          type: formType,
          symbol: formSymbol.trim().toUpperCase(),
          shares: formShares ? parseFloat(formShares) : null,
          price: formPrice ? parseFloat(formPrice) : null,
          fees: formFees ? parseFloat(formFees) : null,
          date: formDate,
          notes: formNotes.trim() || null,
        }),
      });

      if (res.ok) {
        resetForm();
        setPage(1);
        fetchTransactions();
      } else {
        const data = await res.json();
        setFormError(data.error || "Failed to record transaction");
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold text-foreground">{t("dashboard.transactionHistory")}</h3>
          {totalCount > 0 && (
            <span className="text-xs text-muted-foreground">({totalCount})</span>
          )}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            showForm
              ? "bg-muted text-muted-foreground hover:text-foreground"
              : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
          )}
        >
          {showForm ? (
            <>
              <X className="w-3.5 h-3.5" />
              {t("dashboard.cancel")}
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              {t("dashboard.recordTransaction")}
            </>
          )}
        </button>
      </div>

      {/* Inline Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="glass-card rounded-xl p-4 space-y-3"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Type Selector */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("dashboard.transactionType")}</label>
              <div className="flex gap-1">
                {(["buy", "sell", "dividend"] as TransactionType[]).map((txType) => (
                  <button
                    key={txType}
                    type="button"
                    onClick={() => setFormType(txType)}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-xs font-medium capitalize border transition-colors",
                      formType === txType
                        ? TYPE_STYLES[txType]
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {txType === "buy" ? t("dashboard.buy") : txType === "sell" ? t("dashboard.sell") : t("dashboard.dividend")}
                  </button>
                ))}
              </div>
            </div>

            {/* Symbol Search */}
            <div className="relative">
              <label className="text-xs text-muted-foreground mb-1 block">{t("dashboard.transactionSymbol")}</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={formSymbol}
                  onChange={(e) => setFormSymbol(e.target.value)}
                  onFocus={() => symbolResults.length > 0 && setShowSymbolDropdown(true)}
                  onBlur={() => setTimeout(() => setShowSymbolDropdown(false), 200)}
                  placeholder="AAPL"
                  className="w-full bg-muted border border-border rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                />
                {symbolSearching && (
                  <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground animate-spin" />
                )}
              </div>
              {showSymbolDropdown && symbolResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 glass-card rounded-lg border border-border shadow-lg overflow-hidden">
                  {symbolResults.map((r) => (
                    <button
                      key={r.symbol}
                      type="button"
                      onMouseDown={() => {
                        setFormSymbol(r.symbol);
                        setShowSymbolDropdown(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-mono font-semibold">{r.symbol}</span>
                      <span className="text-xs text-muted-foreground truncate">{r.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Shares */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("dashboard.shares")}</label>
              <input
                value={formShares}
                onChange={(e) => setFormShares(e.target.value)}
                type="number"
                step="any"
                placeholder="100"
                className="w-full bg-muted border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
            </div>

            {/* Price */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("dashboard.transactionPrice")}</label>
              <input
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                type="number"
                step="any"
                placeholder="150.00"
                className="w-full bg-muted border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Fees */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("dashboard.transactionFees")}</label>
              <input
                value={formFees}
                onChange={(e) => setFormFees(e.target.value)}
                type="number"
                step="any"
                placeholder="0.00"
                className="w-full bg-muted border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
            </div>

            {/* Date */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("dashboard.transactionDate")}</label>
              <input
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                type="date"
                className="w-full bg-muted border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
            </div>

            {/* Notes */}
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">{t("dashboard.transactionNotes")}</label>
              <input
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder={t("dashboard.optionalNotes")}
                className="w-full bg-muted border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          {formError && (
            <p className="text-xs text-red-400">{formError}</p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {t("dashboard.record")}
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{t("dashboard.loadingTransactions")}</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">
              {t("dashboard.noTransactions")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs">
                  <th className="text-left px-4 py-3 font-medium">{t("dashboard.transactionDate")}</th>
                  <th className="text-left px-4 py-3 font-medium">{t("dashboard.transactionType")}</th>
                  <th className="text-left px-4 py-3 font-medium">{t("dashboard.transactionSymbol")}</th>
                  <th className="text-right px-4 py-3 font-medium">{t("dashboard.shares")}</th>
                  <th className="text-right px-4 py-3 font-medium">{t("dashboard.transactionPrice")}</th>
                  <th className="text-right px-4 py-3 font-medium">{t("dashboard.transactionFees")}</th>
                  <th className="text-right px-4 py-3 font-medium">{t("dashboard.transactionTotal")}</th>
                  <th className="text-left px-4 py-3 font-medium">{t("dashboard.transactionNotes")}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-foreground whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border capitalize",
                          TYPE_STYLES[tx.type]
                        )}
                      >
                        {TYPE_ICONS[tx.type]}
                        {tx.type === "buy" ? t("dashboard.buy") : tx.type === "sell" ? t("dashboard.sell") : t("dashboard.dividend")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-foreground">
                        {tx.symbol}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-foreground">
                      {tx.shares != null
                        ? formatNumber(tx.shares, { compact: false })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-foreground">
                      {tx.price != null
                        ? formatNumber(tx.price, { compact: false })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {tx.fees != null && tx.fees > 0
                        ? formatNumber(tx.fees, { compact: false })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      {tx.total != null
                        ? formatNumber(tx.total, { compact: false })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] truncate">
                      {tx.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
