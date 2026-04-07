export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-10 mt-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <span className="text-emerald-400 font-bold text-xs">K</span>
          </div>
          <span className="text-sm font-semibold text-foreground">KongBeng Strategist</span>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          For informational purposes only. Not financial advice. Always do your own research.
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date().getFullYear()} KongBeng
        </p>
      </div>
    </footer>
  );
}
