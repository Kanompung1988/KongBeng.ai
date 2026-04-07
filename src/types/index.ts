// Core TypeScript types for KongBeng AI

// ─── Stock Types ──────────────────────────────────────────────────────────────
export interface Stock {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  exchange: string;
  logoUrl?: string | null;

  // 8 analysis sections
  businessOverview?: string | null;
  revenueStructure?: string | null;
  financialHealth?: string | null;
  growthStrategy?: string | null;
  moat?: string | null;
  risks?: string | null;
  industryLandscape?: string | null;
  strategistVerdict?: string | null;

  isPublished: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  updatedById?: string | null;
}

export interface StockWithAdmin extends Stock {
  updatedBy?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

// Revenue Structure JSON shape
export interface RevenueSegment {
  name: string;
  percentage: number;
  amount?: number;        // in millions THB/USD
  currency?: string;
  color?: string;
}

export interface RevenueStructureData {
  segments: RevenueSegment[];
  totalRevenue?: number;
  currency?: string;
  fiscalYear?: string;
  note?: string;
}

// Financial Health JSON shape
export interface FinancialRatios {
  pe?: number;            // P/E ratio
  pb?: number;            // P/B ratio
  roe?: number;           // Return on Equity (%)
  roa?: number;           // Return on Assets (%)
  debtToEquity?: number;  // D/E ratio
  dividendYield?: number; // Dividend yield (%)
  eps?: number;           // Earnings Per Share
  marketCap?: number;     // in millions
  currency?: string;
  currentRatio?: number;
  grossMargin?: number;   // (%)
  netMargin?: number;     // (%)
  revenueGrowthYoY?: number; // (%)
  fiscalYear?: string;
  lastUpdated?: string;
}

// Strategist Verdict JSON shape
export interface StrategistVerdict {
  score: number;          // 1-10
  rating: "STRONG BUY" | "BUY" | "HOLD" | "REDUCE" | "SELL";
  summary: string;        // 2-3 sentences
  bullPoints: string[];   // 3 bull points
  bearPoints: string[];   // 2 bear points
  targetPrice?: number;
  currency?: string;
  timeHorizon?: string;   // e.g. "12 months"
}

// ─── Admin Types ──────────────────────────────────────────────────────────────
export interface AdminUser {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Chat Types ───────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

// ─── Search Types ─────────────────────────────────────────────────────────────
export interface SearchResult {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  exchange: string;
  logoUrl?: string | null;
}

// ─── API Response Types ───────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Gemini AI fetch result
export interface AIFetchResult {
  symbol: string;
  businessOverview: string;
  revenueStructure: string;   // JSON string
  financialHealth: string;    // JSON string
  growthStrategy: string;
  moat: string;
  risks: string;
  industryLandscape: string;
  strategistVerdict: string;  // JSON string
}

// ─── UI Helper Types ──────────────────────────────────────────────────────────
export type SectionKey =
  | "businessOverview"
  | "revenueStructure"
  | "financialHealth"
  | "growthStrategy"
  | "moat"
  | "risks"
  | "industryLandscape"
  | "strategistVerdict";

export const SECTION_LABELS: Record<SectionKey, string> = {
  businessOverview: "Business Overview",
  revenueStructure: "Revenue Structure",
  financialHealth: "Financial Health",
  growthStrategy: "Growth Strategy",
  moat: "Competitive Moat",
  risks: "Key Risks",
  industryLandscape: "Industry Landscape",
  strategistVerdict: "Strategist's Verdict",
};

export const SECTION_ICONS: Record<SectionKey, string> = {
  businessOverview: "Building2",
  revenueStructure: "PieChart",
  financialHealth: "BarChart3",
  growthStrategy: "TrendingUp",
  moat: "Shield",
  risks: "AlertTriangle",
  industryLandscape: "Globe",
  strategistVerdict: "Sword",
};
