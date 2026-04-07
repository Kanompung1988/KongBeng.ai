// Phase 3 — Prompt 6: Financial Health Section
import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { SectionHeader } from "./business-overview";
import { parseFinancialHealth, formatNumber, formatPercent } from "@/lib/utils";
import type { FinancialRatios } from "@/types";

interface Props {
  raw: string | null | undefined;
}

interface MetricCardProps {
  label: string;
  value: string | number | null | undefined;
  suffix?: string;
  description?: string;
  sentiment?: "positive" | "negative" | "neutral";
}

function MetricCard({ label, value, suffix = "", description, sentiment = "neutral" }: MetricCardProps) {
  const sentimentColors = {
    positive: "text-emerald-400",
    negative: "text-red-400",
    neutral: "text-foreground",
  };

  const SentimentIcon = sentiment === "positive" ? TrendingUp : sentiment === "negative" ? TrendingDown : Minus;

  return (
    <div className="glass-card p-4 rounded-xl">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        <SentimentIcon className={`w-3.5 h-3.5 ${sentimentColors[sentiment]}`} />
      </div>
      <div className={`text-xl font-bold font-mono ${sentimentColors[sentiment]}`}>
        {value != null ? `${value}${suffix}` : "N/A"}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
}

function getRatioSentiment(key: keyof FinancialRatios, value: number): "positive" | "negative" | "neutral" {
  switch (key) {
    case "roe":           return value > 15 ? "positive" : value > 8 ? "neutral" : "negative";
    case "roa":           return value > 10 ? "positive" : value > 5 ? "neutral" : "negative";
    case "grossMargin":   return value > 40 ? "positive" : value > 20 ? "neutral" : "negative";
    case "netMargin":     return value > 15 ? "positive" : value > 5 ? "neutral" : "negative";
    case "dividendYield": return value > 3 ? "positive" : value > 0 ? "neutral" : "negative";
    case "revenueGrowthYoY": return value > 10 ? "positive" : value > 0 ? "neutral" : "negative";
    case "currentRatio":  return value > 1.5 ? "positive" : value > 1 ? "neutral" : "negative";
    case "debtToEquity":  return value < 0.5 ? "positive" : value < 1.5 ? "neutral" : "negative";
    default:              return "neutral";
  }
}

export function FinancialHealthSection({ raw }: Props) {
  const ratios = parseFinancialHealth(raw);
  if (!ratios) return null;

  return (
    <section id="financialHealth" className="scroll-mt-24">
      <SectionHeader
        icon={<BarChart3 className="w-5 h-5 text-gold-400" />}
        title="Financial Health"
      />
      <div className="space-y-4">
        {/* Valuation */}
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Valuation</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard label="P/E Ratio" value={ratios.pe?.toFixed(1)} description="Price to Earnings" />
            <MetricCard label="P/B Ratio" value={ratios.pb?.toFixed(2)} description="Price to Book" />
            <MetricCard label="Market Cap" value={ratios.marketCap ? formatNumber(ratios.marketCap) : null} suffix={` ${ratios.currency || ""}`} description="Total market value" />
            <MetricCard label="EPS" value={ratios.eps?.toFixed(2)} suffix={` ${ratios.currency || ""}`} description="Earnings per share" />
          </div>
        </div>

        {/* Profitability */}
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Profitability</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard label="ROE" value={ratios.roe?.toFixed(1)} suffix="%" description="Return on Equity" sentiment={ratios.roe != null ? getRatioSentiment("roe", ratios.roe) : "neutral"} />
            <MetricCard label="ROA" value={ratios.roa?.toFixed(1)} suffix="%" description="Return on Assets" sentiment={ratios.roa != null ? getRatioSentiment("roa", ratios.roa) : "neutral"} />
            <MetricCard label="Gross Margin" value={ratios.grossMargin?.toFixed(1)} suffix="%" sentiment={ratios.grossMargin != null ? getRatioSentiment("grossMargin", ratios.grossMargin) : "neutral"} />
            <MetricCard label="Net Margin" value={ratios.netMargin?.toFixed(1)} suffix="%" sentiment={ratios.netMargin != null ? getRatioSentiment("netMargin", ratios.netMargin) : "neutral"} />
          </div>
        </div>

        {/* Risk & Dividend */}
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Risk & Income</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard label="D/E Ratio" value={ratios.debtToEquity?.toFixed(2)} description="Debt to Equity" sentiment={ratios.debtToEquity != null ? getRatioSentiment("debtToEquity", ratios.debtToEquity) : "neutral"} />
            <MetricCard label="Current Ratio" value={ratios.currentRatio?.toFixed(2)} sentiment={ratios.currentRatio != null ? getRatioSentiment("currentRatio", ratios.currentRatio) : "neutral"} />
            <MetricCard label="Dividend Yield" value={ratios.dividendYield?.toFixed(2)} suffix="%" sentiment={ratios.dividendYield != null ? getRatioSentiment("dividendYield", ratios.dividendYield) : "neutral"} />
            <MetricCard label="Revenue Growth" value={ratios.revenueGrowthYoY?.toFixed(1)} suffix="% YoY" sentiment={ratios.revenueGrowthYoY != null ? getRatioSentiment("revenueGrowthYoY", ratios.revenueGrowthYoY) : "neutral"} />
          </div>
        </div>

        {ratios.lastUpdated && (
          <p className="text-xs text-muted-foreground text-right">
            Data as of FY{ratios.fiscalYear} · Updated {new Date(ratios.lastUpdated).toLocaleDateString()}
          </p>
        )}
      </div>
    </section>
  );
}
