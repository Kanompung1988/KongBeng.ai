"use client";

import { ArrowRight, Sparkles, Shield, TrendingUp, BarChart3, Zap } from "lucide-react";
import Link from "next/link";

const TICKER_SYMBOLS = [
  "PTT", "ADVANC", "CPALL", "SCC", "BDMS", "AOT", "KBANK", "SCB",
  "AAPL", "NVDA", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "JPM",
];

export function HeroSection() {
  return (
    <section className="relative px-6 pt-12 pb-8 text-center max-w-5xl mx-auto">
      {/* Decorative elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8 relative">
        <Zap className="w-3.5 h-3.5" />
        <span>AI-Powered Investment Intelligence</span>
      </div>

      {/* Headline */}
      <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
        <span className="text-foreground">Smart Analysis</span>
        <br />
        <span className="text-gold-shimmer">for Smart</span>
        <br />
        <span className="text-foreground">Investors</span>
      </h1>

      {/* Subheadline */}
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
        KongBeng Strategist delivers 8-dimension stock analysis — covering business model,
        financials, competitive moat, and strategic verdict — powered by AI and the wisdom of Sun Tzu.
      </p>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
        <Link
          href="#featured"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-all hover:shadow-lg hover:shadow-emerald-500/20"
        >
          <Sparkles className="w-4 h-4" />
          Explore Analysis
        </Link>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl glass-card hover:border-emerald-500/30 font-semibold transition-all"
        >
          Join Free
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-10">
        {[
          { icon: TrendingUp, label: "Stocks Analyzed", value: "200+" },
          { icon: Shield, label: "Analysis Dimensions", value: "8" },
          { icon: BarChart3, label: "AI Engine", value: "Typhoon" },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="glass-card p-4 text-center hover:border-white/10 transition-all">
            <Icon className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
            <div className="font-bold text-foreground">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* Ticker tape */}
      <div className="overflow-hidden py-3 border-y border-border/50 opacity-40">
        <div className="ticker-tape flex gap-8 whitespace-nowrap">
          {[...TICKER_SYMBOLS, ...TICKER_SYMBOLS].map((sym, i) => (
            <span key={`${sym}-${i}`} className="text-xs font-mono text-muted-foreground">
              {sym}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
