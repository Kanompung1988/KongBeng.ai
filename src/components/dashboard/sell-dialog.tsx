"use client";

import { useState } from "react";
import { TrendingDown, X, Loader2 } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/context";

interface Props {
  itemId: string;
  portfolioId: string;
  stockId: string;
  symbol: string;
  stockName: string;
  currentShares: number;
  currentPrice: number;
  onClose: () => void;
  onSold: () => void;
}

export function SellDialog({
  itemId,
  portfolioId,
  stockId,
  symbol,
  stockName,
  currentShares,
  currentPrice,
  onClose,
  onSold,
}: Props) {
  const { t } = useLanguage();
  const [shares, setShares] = useState(String(currentShares));
  const [price, setPrice] = useState(currentPrice > 0 ? String(currentPrice) : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sharesToSell = parseFloat(shares) || 0;
  const sellPrice = parseFloat(price) || 0;
  const totalProceeds = sharesToSell * sellPrice;
  const isAll = sharesToSell >= currentShares;

  async function handleConfirm() {
    if (sharesToSell <= 0 || sellPrice <= 0) {
      setError("กรุณากรอกจำนวนหุ้นและราคาขาย");
      return;
    }
    if (sharesToSell > currentShares) {
      setError(`ไม่สามารถขายได้มากกว่าที่ถือ (${currentShares} หุ้น)`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Record sell transaction
      const txRes = await fetch("/api/portfolio/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portfolioId,
          stockId,
          symbol,
          type: "sell",
          shares: sharesToSell,
          price: sellPrice,
          date: new Date().toISOString(),
        }),
      });
      if (!txRes.ok) {
        const err = await txRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to record transaction");
      }

      // 2. Update or remove portfolio item
      if (isAll) {
        const delRes = await fetch(`/api/portfolio?itemId=${itemId}`, { method: "DELETE" });
        if (!delRes.ok) throw new Error("Failed to remove stock from portfolio");
      } else {
        const newShares = currentShares - sharesToSell;
        const patchRes = await fetch(`/api/portfolio/${itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shares: newShares }),
        });
        if (!patchRes.ok) throw new Error("Failed to update shares");
      }

      onSold();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="glass-card rounded-xl p-6 w-full max-w-sm relative z-10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-500/15">
              <TrendingDown className="h-4 w-4 text-red-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                {t("dashboard.sell")} {symbol}
              </h3>
              <p className="text-xs text-zinc-500">{stockName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Info row */}
        <div className="flex items-center justify-between mb-4 p-2.5 rounded-lg bg-white/4 text-xs text-zinc-400">
          <span>{t("dashboard.holding")}: <span className="text-white font-medium">{currentShares} {t("dashboard.shares")}</span></span>
          <span>{t("dashboard.marketPrice")}: <span className="text-white font-medium">{currentPrice > 0 ? formatNumber(currentPrice, { compact: false }) : "—"}</span></span>
        </div>

        {/* Inputs */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">
              {t("dashboard.sharesToSell")}
              <span className="ml-1 text-zinc-600">(max {currentShares})</span>
            </label>
            <input
              type="number"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              min="1"
              max={currentShares}
              step="any"
              className={cn(
                "w-full px-3 py-2 rounded-lg text-sm bg-white/5 border",
                "text-white outline-none transition-colors",
                "focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30",
                "border-white/10"
              )}
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">{t("dashboard.sellPrice")}</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0.01"
              step="any"
              className={cn(
                "w-full px-3 py-2 rounded-lg text-sm bg-white/5 border",
                "text-white outline-none transition-colors",
                "focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30",
                "border-white/10"
              )}
            />
          </div>
        </div>

        {/* Proceeds preview */}
        {sharesToSell > 0 && sellPrice > 0 && (
          <div className="mb-4 p-2.5 rounded-lg bg-red-500/8 border border-red-500/15 text-sm flex items-center justify-between">
            <span className="text-zinc-400">{t("dashboard.totalProceeds")}</span>
            <span className="font-semibold text-red-300">
              {formatNumber(totalProceeds, { compact: false })}
              {isAll && (
                <span className="ml-2 text-xs text-red-400/70">({t("dashboard.sellAll")})</span>
              )}
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            {t("dashboard.cancel")}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || sharesToSell <= 0 || sellPrice <= 0}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2",
              "bg-red-500/20 text-red-400 hover:bg-red-500/30",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <TrendingDown className="h-4 w-4" />
                {t("dashboard.confirmSell")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
