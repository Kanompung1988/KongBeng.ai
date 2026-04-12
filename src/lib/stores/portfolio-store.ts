import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ChartRange = "1D" | "1W" | "1M" | "3M" | "YTD";
export type DisplayCurrency = "THB" | "USD" | "auto";
export type DashboardTab = "overview" | "holdings" | "watchlist" | "transactions" | "alerts" | "ai";

interface PortfolioStore {
  activePortfolioId: string | null;
  setActivePortfolioId: (id: string | null) => void;
  displayCurrency: DisplayCurrency;
  setDisplayCurrency: (c: DisplayCurrency) => void;
  chartRange: ChartRange;
  setChartRange: (r: ChartRange) => void;
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
}

export const usePortfolioStore = create<PortfolioStore>()(
  persist(
    (set) => ({
      activePortfolioId: null,
      setActivePortfolioId: (id) => set({ activePortfolioId: id }),
      displayCurrency: "auto",
      setDisplayCurrency: (c) => set({ displayCurrency: c }),
      chartRange: "1M",
      setChartRange: (r) => set({ chartRange: r }),
      activeTab: "overview",
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    { name: "kb-portfolio" }
  )
);
