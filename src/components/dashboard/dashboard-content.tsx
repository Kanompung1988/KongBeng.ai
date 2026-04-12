"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  LayoutDashboard,
  BarChart3,
  Eye,
  ArrowLeftRight,
  Bell,
  Sparkles,
  Plus,
  Download,
  Loader2,
  Wallet,
} from "lucide-react";

// State
import { usePortfolioStore } from "@/lib/stores/portfolio-store";
import type { DashboardTab, ChartRange } from "@/lib/stores/portfolio-store";

// UI Components
import { PortfolioSelector } from "./portfolio-selector";
import { PortfolioCreateDialog } from "./portfolio-create-dialog";
import { PortfolioSummaryCards } from "./portfolio-summary-cards";
import { PortfolioTable } from "./portfolio-table";
import { WatchlistTable } from "./watchlist-table";
import { TransactionLog } from "./transaction-log";
import { AlertsPanel } from "./alerts-panel";
import { DividendTracker } from "./dividend-tracker";

// Charts
import { AllocationPieChart } from "./charts/allocation-pie-chart";
import { SectorPieChart } from "./charts/sector-pie-chart";
import { ValueLineChart } from "./charts/value-line-chart";
import { DailyPLCard } from "./charts/daily-pl-card";

// AI Components
import { AIHealthScore } from "./ai/ai-health-score";
import { AIPortfolioAnalysis } from "./ai/ai-portfolio-analysis";
import { AIWhatIfDialog } from "./ai/ai-what-if-dialog";
import { AIStockRecommendation } from "./ai/ai-stock-recommendation";
import { AIMarketBrief } from "./ai/ai-market-brief";

// Existing
import { PortfolioAddDialog } from "./portfolio-add-dialog";
import { SellDialog } from "./sell-dialog";
import { cn, formatNumber, formatPercent } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/context";

/* ─── Types ──────────────────────────────────────────────────────────────────── */

interface PortfolioListItem {
  id: string;
  name: string;
  isWatchlist: boolean;
  itemCount: number;
}

interface PortfolioItem {
  id: string;
  stockId: string;
  symbol: string;
  shares: number | null;
  avgCost: number | null;
  notes: string | null;
  alertTarget?: number | null;
  addedAt: string;
  stock: {
    id: string;
    symbol: string;
    name: string;
    sector: string;
    exchange: string;
    logoUrl: string | null;
  } | null;
  quote: {
    price: number | null;
    change: number | null;
    changePercent: number | null;
    pe: number | null;
    marketCap: number | null;
    currency: string;
  } | null;
}

interface PortfolioData {
  id: string;
  name: string;
  isWatchlist: boolean;
  items: PortfolioItem[];
}

interface ChartDataPoint {
  date: string;
  value: number;
}

/* ─── Tab Config ─────────────────────────────────────────────────────────────── */

interface TabDef {
  key: DashboardTab;
  label: string;
  icon: React.ReactNode;
}

const TAB_DEFS: TabDef[] = [
  { key: "overview", label: "ภาพรวม", icon: <LayoutDashboard className="w-4 h-4" /> },
  { key: "holdings", label: "หุ้นในพอร์ต", icon: <BarChart3 className="w-4 h-4" /> },
  { key: "watchlist", label: "Watchlist", icon: <Eye className="w-4 h-4" /> },
  { key: "transactions", label: "ธุรกรรม", icon: <ArrowLeftRight className="w-4 h-4" /> },
  { key: "alerts", label: "แจ้งเตือน", icon: <Bell className="w-4 h-4" /> },
  { key: "ai", label: "AI Insights", icon: <Sparkles className="w-4 h-4" /> },
];

/* ─── Main Component ─────────────────────────────────────────────────────────── */

export function DashboardContent() {
  const { t } = useLanguage();
  const {
    activePortfolioId,
    setActivePortfolioId,
    displayCurrency,
    chartRange,
    setChartRange,
    activeTab,
    setActiveTab,
  } = usePortfolioStore();

  // ── Local state ────────────────────────────────────────────────────────────
  const [portfolios, setPortfolios] = useState<PortfolioListItem[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portfolioLoading, setPortfolioLoading] = useState(false);

  // Chart data
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  // Dialogs
  const [showAdd, setShowAdd] = useState(false);
  const [showCreatePortfolio, setShowCreatePortfolio] = useState(false);
  const [showCreateWatchlist, setShowCreateWatchlist] = useState(false);
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [sellItem, setSellItem] = useState<PortfolioItem | null>(null);

  // Inline editing for holdings table
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editShares, setEditShares] = useState("");
  const [editCost, setEditCost] = useState("");

  // ── Derived state ──────────────────────────────────────────────────────────
  const isWatchlist = portfolio?.isWatchlist ?? false;
  const items = portfolio?.items ?? [];

  const visibleTabs = useMemo(() => {
    if (isWatchlist) {
      return TAB_DEFS.filter((t) => t.key !== "holdings");
    }
    return TAB_DEFS;
  }, [isWatchlist]);

  // Calculate portfolio totals
  const { totalValue, totalCost, totalPL, totalPLPct, dailyPL, dailyPLPct } = useMemo(() => {
    const hasQuotes = items.some((i) => i.quote?.price != null);
    const val = items.reduce((sum, item) => {
      if (item.quote?.price != null && item.shares) return sum + item.quote.price * item.shares;
      return sum;
    }, 0);
    const cost = items.reduce((sum, item) => {
      if (item.avgCost && item.shares) return sum + item.avgCost * item.shares;
      return sum;
    }, 0);
    const pl = hasQuotes ? val - cost : null;
    const plPct = pl !== null && cost > 0 ? (pl / cost) * 100 : null;
    const dPL = items.reduce((sum, item) => {
      if (item.quote?.change != null && item.shares) return sum + item.quote.change * item.shares;
      return sum;
    }, 0);
    const dPLPct = val > 0 ? (dPL / val) * 100 : null;
    return {
      totalValue: hasQuotes && val > 0 ? val : null,
      totalCost: cost > 0 ? cost : null,
      totalPL: pl,
      totalPLPct: plPct,
      dailyPL: dPL !== 0 ? dPL : null,
      dailyPLPct: dPLPct,
    };
  }, [items]);

  // Allocation data for pie chart
  const allocationData = useMemo(() => {
    return items
      .filter((i) => i.quote?.price != null && i.shares)
      .map((i) => ({
        symbol: i.symbol,
        name: i.stock?.name || i.symbol,
        value: (i.quote!.price! * (i.shares || 0)),
      }));
  }, [items]);

  // Sector data for pie chart
  const sectorData = useMemo(() => {
    const map = new Map<string, { value: number; count: number }>();
    items.forEach((i) => {
      if (!i.stock?.sector || !i.quote?.price || !i.shares) return;
      const sector = i.stock.sector;
      const existing = map.get(sector) || { value: 0, count: 0 };
      existing.value += i.quote.price * i.shares;
      existing.count += 1;
      map.set(sector, existing);
    });
    return Array.from(map.entries()).map(([sector, data]) => ({
      sector,
      value: data.value,
      count: data.count,
    }));
  }, [items]);

  // Daily P/L items for the card
  const dailyPLItems = useMemo(() => {
    return items
      .filter((i) => i.quote?.change != null && i.shares)
      .map((i) => ({
        symbol: i.symbol,
        dailyChange: i.quote!.change! * (i.shares || 0),
        dailyChangePct: i.quote!.changePercent || 0,
        shares: i.shares || 0,
      }));
  }, [items]);

  // Resolve "auto" currency to the dominant currency from portfolio quotes
  const resolvedCurrency = useMemo(() => {
    if (displayCurrency !== "auto") return displayCurrency;
    const currencies = items
      .map((i) => i.quote?.currency)
      .filter(Boolean) as string[];
    if (currencies.length === 0) return "USD";
    // Return most common currency
    const counts = new Map<string, number>();
    currencies.forEach((c) => counts.set(c, (counts.get(c) || 0) + 1));
    let best = "USD";
    let bestCount = 0;
    counts.forEach((count, cur) => {
      if (count > bestCount) { best = cur; bestCount = count; }
    });
    return best;
  }, [displayCurrency, items]);

  // ── Data fetching ──────────────────────────────────────────────────────────

  // Fetch portfolio list
  const fetchPortfolios = useCallback(async () => {
    try {
      const res = await fetch("/api/portfolio/list");
      if (res.ok) {
        const json = await res.json();
        const data: PortfolioListItem[] = json.portfolios ?? json;
        setPortfolios(data);
        // Auto-select first portfolio if none active
        if (!activePortfolioId && data.length > 0) {
          setActivePortfolioId(data[0].id);
        }
      }
    } catch {
      /* ignore */
    }
  }, [activePortfolioId, setActivePortfolioId]);

  // Fetch active portfolio data
  const fetchPortfolio = useCallback(async () => {
    if (!activePortfolioId) {
      setPortfolio(null);
      setPortfolioLoading(false);
      return;
    }
    setPortfolioLoading(true);
    try {
      const res = await fetch(`/api/portfolio?portfolioId=${activePortfolioId}`);
      if (res.ok) {
        const data: PortfolioData = await res.json();
        setPortfolio(data);
      }
    } catch {
      /* ignore */
    }
    setPortfolioLoading(false);
  }, [activePortfolioId]);

  const fetchChartData = useCallback(async () => {
    if (!activePortfolioId) {
      setChartData([]);
      return;
    }
    setChartLoading(true);
    try {
      const res = await fetch(
        `/api/cron/snapshot?portfolioId=${activePortfolioId}&range=${chartRange}`
      );
      if (res.ok) {
        const { data }: { data: ChartDataPoint[] } = await res.json();
        setChartData(data);
      }
    } catch {
      /* ignore */
    }
    setChartLoading(false);
  }, [activePortfolioId, chartRange]);

  // Initial load
  useEffect(() => {
    fetchPortfolios().then(() => setLoading(false));
  }, [fetchPortfolios]);

  // Fetch portfolio data when active changes
  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  // Fetch chart when portfolio or range changes
  useEffect(() => {
    if (activePortfolioId) {
      fetchChartData();
    }
  }, [activePortfolioId, chartRange, fetchChartData]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!activePortfolioId) return;
    const interval = setInterval(() => {
      fetchPortfolio();
    }, 30_000);
    return () => clearInterval(interval);
  }, [activePortfolioId, fetchPortfolio]);

  // When portfolio switches to watchlist, default to watchlist tab
  useEffect(() => {
    if (isWatchlist && activeTab === "holdings") {
      setActiveTab("watchlist");
    }
  }, [isWatchlist, activeTab, setActiveTab]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handlePortfolioChange = (id: string) => {
    setActivePortfolioId(id);
    setEditingId(null);
  };

  const handlePortfolioCreated = () => {
    setShowCreatePortfolio(false);
    setShowCreateWatchlist(false);
    fetchPortfolios();
  };

  const handleRemoveItem = async (itemId: string) => {
    await fetch(`/api/portfolio?itemId=${itemId}`, { method: "DELETE" });
    fetchPortfolio();
  };

  const handleSell = (item: PortfolioItem) => {
    setSellItem(item);
  };

  const handleEdit = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    setEditingId(id);
    setEditShares(item.shares?.toString() || "");
    setEditCost(item.avgCost?.toString() || "");
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    await fetch(`/api/portfolio/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shares: editShares ? parseFloat(editShares) : null,
        avgCost: editCost ? parseFloat(editCost) : null,
      }),
    });
    setEditingId(null);
    fetchPortfolio();
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleAddToPortfolio = (symbol: string, stockId: string) => {
    // Find first non-watchlist portfolio and add
    const target = portfolios.find((p) => !p.isWatchlist);
    if (!target) return;
    fetch("/api/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ portfolioId: target.id, symbol, stockId }),
    }).then(() => fetchPortfolio());
  };

  const handleExportCSV = () => {
    if (!activePortfolioId) return;
    window.open(`/api/portfolio/export?portfolioId=${activePortfolioId}`, "_blank");
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("dashboard.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("dashboard.portfolio")}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <PortfolioSelector
            portfolios={portfolios}
            activeId={activePortfolioId}
            onChange={handlePortfolioChange}
          />

          <button
            onClick={() => setShowCreatePortfolio(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-sm font-medium transition-colors border border-emerald-500/30"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">เพิ่มพอร์ต</span>
          </button>

          <button
            onClick={() => setShowCreateWatchlist(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm font-medium transition-colors border border-blue-500/30"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">+ Watchlist</span>
          </button>

          {!isWatchlist && (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gold-500/20 hover:bg-gold-500/30 text-gold-400 text-sm font-medium transition-colors border border-gold-500/30"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">เพิ่มหุ้น</span>
            </button>
          )}

          {items.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-muted text-muted-foreground text-sm transition-colors border border-border"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto scrollbar-hide">
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px",
              activeTab === tab.key
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Tab Content ────────────────────────────────────────────────────── */}
      {portfolioLoading && !portfolio ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        </div>
      ) : !portfolio || portfolios.length === 0 ? (
        <EmptyPortfolioState
          onCreatePortfolio={() => setShowCreatePortfolio(true)}
          onCreateWatchlist={() => setShowCreateWatchlist(true)}
        />
      ) : (
        <>
          {activeTab === "overview" && (
            <OverviewTab
              items={items}
              totalValue={totalValue}
              totalCost={totalCost}
              totalPL={totalPL}
              totalPLPct={totalPLPct}
              dailyPL={dailyPL}
              dailyPLPct={dailyPLPct}
              displayCurrency={resolvedCurrency}
              chartData={chartData}
              chartLoading={chartLoading}
              chartRange={chartRange}
              onChartRangeChange={setChartRange}
              allocationData={allocationData}
              sectorData={sectorData}
              dailyPLItems={dailyPLItems}
              isWatchlist={isWatchlist}
            />
          )}

          {activeTab === "holdings" && !isWatchlist && (
            <HoldingsTab
              items={items}
              editingId={editingId}
              editShares={editShares}
              editCost={editCost}
              setEditShares={setEditShares}
              setEditCost={setEditCost}
              onEdit={handleEdit}
              onRemove={handleRemoveItem}
              onSell={handleSell}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              onAddStock={() => setShowAdd(true)}
            />
          )}

          {activeTab === "watchlist" && (
            <WatchlistTab
              portfolio={portfolio}
              items={items}
              onRemove={handleRemoveItem}
              onAddToPortfolio={handleAddToPortfolio}
              onAddStock={() => setShowAdd(true)}
              portfolios={portfolios}
            />
          )}

          {activeTab === "transactions" && activePortfolioId && (
            <TransactionsTab portfolioId={activePortfolioId} />
          )}

          {activeTab === "alerts" && <AlertsTab />}

          {activeTab === "ai" && (
            <AIInsightsTab onOpenWhatIf={() => setShowWhatIf(true)} />
          )}
        </>
      )}

      {/* ─── Dialogs ────────────────────────────────────────────────────────── */}
      {showAdd && (
        <PortfolioAddDialog
          portfolioId={activePortfolioId ?? undefined}
          onClose={() => setShowAdd(false)}
          onAdded={() => {
            setShowAdd(false);
            fetchPortfolio();
          }}
        />
      )}

      {sellItem && activePortfolioId && (
        <SellDialog
          itemId={sellItem.id}
          portfolioId={activePortfolioId}
          stockId={sellItem.stockId}
          symbol={sellItem.symbol}
          stockName={sellItem.stock?.name ?? sellItem.symbol}
          currentShares={sellItem.shares ?? 0}
          currentPrice={sellItem.quote?.price ?? 0}
          onClose={() => setSellItem(null)}
          onSold={() => {
            setSellItem(null);
            fetchPortfolio();
            setActiveTab("overview");
          }}
        />
      )}

      {showCreatePortfolio && (
        <PortfolioCreateDialog
          onClose={() => setShowCreatePortfolio(false)}
          onCreated={handlePortfolioCreated}
          isWatchlist={false}
        />
      )}

      {showCreateWatchlist && (
        <PortfolioCreateDialog
          onClose={() => setShowCreateWatchlist(false)}
          onCreated={handlePortfolioCreated}
          isWatchlist
        />
      )}

      {showWhatIf && (
        <AIWhatIfDialog onClose={() => setShowWhatIf(false)} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TAB COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════════ */

/* ─── Overview Tab ────────────────────────────────────────────────────────────── */

function OverviewTab({
  items,
  totalValue,
  totalCost,
  totalPL,
  totalPLPct,
  dailyPL,
  dailyPLPct,
  displayCurrency,
  chartData,
  chartLoading,
  chartRange,
  onChartRangeChange,
  allocationData,
  sectorData,
  dailyPLItems,
  isWatchlist,
}: {
  items: PortfolioItem[];
  totalValue: number | null;
  totalCost: number | null;
  totalPL: number | null;
  totalPLPct: number | null;
  dailyPL: number | null;
  dailyPLPct: number | null;
  displayCurrency: string;
  chartData: ChartDataPoint[];
  chartLoading: boolean;
  chartRange: ChartRange;
  onChartRangeChange: (r: ChartRange) => void;
  allocationData: { symbol: string; name: string; value: number }[];
  sectorData: { sector: string; value: number; count: number }[];
  dailyPLItems: { symbol: string; dailyChange: number; dailyChangePct: number; shares: number }[];
  isWatchlist: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16 glass-card rounded-2xl">
        <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
          {isWatchlist ? "Watchlist ยังว่าง เพิ่มหุ้นที่สนใจ" : "ยังไม่มีหุ้นในพอร์ต เพิ่มหุ้นเพื่อเริ่มต้น"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {!isWatchlist && (
        <PortfolioSummaryCards
          totalValue={totalValue}
          totalCost={totalCost}
          totalPL={totalPL}
          totalPLPct={totalPLPct}
          dailyPL={dailyPL}
          dailyPLPct={dailyPLPct}
          stockCount={items.length}
          displayCurrency={displayCurrency}
        />
      )}

      {/* Value Line Chart */}
      {!isWatchlist && (
        <ValueLineChart
          data={chartData}
          loading={chartLoading}
          range={chartRange}
          onRangeChange={onChartRangeChange}
        />
      )}

      {/* Two-column: Allocation + Sector */}
      {!isWatchlist && allocationData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AllocationPieChart items={allocationData} />
          <SectorPieChart items={sectorData} />
        </div>
      )}

      {/* Daily P/L */}
      {!isWatchlist && <DailyPLCard items={dailyPLItems} />}

      {/* Compact AI Health Score */}
      <AIHealthScore />
    </div>
  );
}

/* ─── Holdings Tab ────────────────────────────────────────────────────────────── */

function HoldingsTab({
  items,
  editingId,
  editShares,
  editCost,
  setEditShares,
  setEditCost,
  onEdit,
  onRemove,
  onSell,
  onSaveEdit,
  onCancelEdit,
  onAddStock,
}: {
  items: PortfolioItem[];
  editingId: string | null;
  editShares: string;
  editCost: string;
  setEditShares: (v: string) => void;
  setEditCost: (v: string) => void;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
  onSell: (item: PortfolioItem) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onAddStock: () => void;
}) {
  return (
    <div className="space-y-4">
      <PortfolioTable
        items={items}
        editingId={editingId}
        editShares={editShares}
        editCost={editCost}
        setEditShares={setEditShares}
        setEditCost={setEditCost}
        onEdit={onEdit}
        onRemove={onRemove}
        onSell={onSell}
        onSaveEdit={onSaveEdit}
        onCancelEdit={onCancelEdit}
      />

      <div className="flex justify-center">
        <button
          onClick={onAddStock}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          เพิ่มหุ้น
        </button>
      </div>
    </div>
  );
}

/* ─── Watchlist Tab ───────────────────────────────────────────────────────────── */

function WatchlistTab({
  portfolio,
  items,
  onRemove,
  onAddToPortfolio,
  onAddStock,
  portfolios,
}: {
  portfolio: PortfolioData;
  items: PortfolioItem[];
  onRemove: (id: string) => void;
  onAddToPortfolio: (symbol: string, stockId: string) => void;
  onAddStock: () => void;
  portfolios: PortfolioListItem[];
}) {
  // If the current portfolio is not a watchlist, prompt user
  if (!portfolio.isWatchlist) {
    const watchlists = portfolios.filter((p) => p.isWatchlist);
    if (watchlists.length === 0) {
      return (
        <div className="text-center py-16 glass-card rounded-2xl">
          <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">ยังไม่มี Watchlist</p>
          <p className="text-xs text-muted-foreground">
            สร้าง Watchlist เพื่อติดตามหุ้นที่สนใจ
          </p>
        </div>
      );
    }
    return (
      <div className="text-center py-16 glass-card rounded-2xl">
        <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
          เลือก Watchlist จากตัวเลือกด้านบนเพื่อดูหุ้นที่ติดตาม
        </p>
      </div>
    );
  }

  // Build watchlist items with required shape
  const watchlistItems = items.map((i) => ({
    id: i.id,
    symbol: i.symbol,
    stock: i.stock
      ? {
          id: i.stock.id,
          symbol: i.stock.symbol,
          name: i.stock.name,
          logoUrl: i.stock.logoUrl,
          exchange: i.stock.exchange,
        }
      : null,
    quote: i.quote
      ? {
          price: i.quote.price,
          change: i.quote.change,
          changePercent: i.quote.changePercent,
          marketCap: i.quote.marketCap,
          currency: i.quote.currency,
        }
      : null,
  }));

  return (
    <div className="space-y-4">
      <WatchlistTable
        items={watchlistItems}
        onRemove={onRemove}
        onAddToPortfolio={onAddToPortfolio}
      />

      <div className="flex justify-center">
        <button
          onClick={onAddStock}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm font-medium transition-colors border border-blue-500/30"
        >
          <Plus className="w-4 h-4" />
          เพิ่มหุ้นใน Watchlist
        </button>
      </div>
    </div>
  );
}

/* ─── Transactions Tab ────────────────────────────────────────────────────────── */

function TransactionsTab({ portfolioId }: { portfolioId: string }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <TransactionLog portfolioId={portfolioId} />
      <DividendTracker portfolioId={portfolioId} />
    </div>
  );
}

/* ─── Alerts Tab ──────────────────────────────────────────────────────────────── */

function AlertsTab() {
  return <AlertsPanel />;
}

/* ─── AI Insights Tab ─────────────────────────────────────────────────────────── */

function AIInsightsTab({ onOpenWhatIf }: { onOpenWhatIf: () => void }) {
  return (
    <div className="space-y-6">
      {/* Primary row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AIHealthScore />
        <AIPortfolioAnalysis />
      </div>

      {/* Secondary row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AIStockRecommendation />
        <AIMarketBrief />
      </div>

      {/* What-If button */}
      <div className="flex justify-center">
        <button
          onClick={onOpenWhatIf}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-blue-500/20 hover:from-emerald-500/30 hover:to-blue-500/30 text-emerald-400 text-sm font-medium transition-all border border-emerald-500/30"
        >
          <Sparkles className="w-4 h-4" />
          What-If Simulation
        </button>
      </div>
    </div>
  );
}

/* ─── Empty State ─────────────────────────────────────────────────────────────── */

function EmptyPortfolioState({
  onCreatePortfolio,
  onCreateWatchlist,
}: {
  onCreatePortfolio: () => void;
  onCreateWatchlist: () => void;
}) {
  return (
    <div className="text-center py-20 glass-card rounded-2xl">
      <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
      <h2 className="text-xl font-semibold text-foreground mb-2">
        เริ่มต้นสร้างพอร์ตของคุณ
      </h2>
      <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
        สร้างพอร์ตหุ้นเพื่อติดตามผลตอบแทน หรือสร้าง Watchlist เพื่อจับตาหุ้นที่สนใจ
      </p>
      <div className="flex items-center gap-3 justify-center">
        <button
          onClick={onCreatePortfolio}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          สร้างพอร์ต
        </button>
        <button
          onClick={onCreateWatchlist}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm font-medium transition-colors border border-blue-500/30"
        >
          <Eye className="w-4 h-4" />
          สร้าง Watchlist
        </button>
      </div>
    </div>
  );
}
