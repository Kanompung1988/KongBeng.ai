// Core TypeScript types for Khongbeng AI

// ─── Stock Types ──────────────────────────────────────────────────────────────
export interface Stock {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  exchange: string;
  logoUrl?: string | null;
  marketIndexes?: string[];

  // 8 analysis sections (JSON strings)
  coreBusiness?: string | null;
  customerBase?: string | null;
  revenueModel?: string | null;
  financials?: string | null;
  sevenPowers?: string | null;
  storyAndSCurve?: string | null;
  risks?: string | null;
  ceoProfile?: string | null;

  // Optional sections
  shareholders?: string | null;
  recentNews?: string | null;

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

// ─── Section 1: Core Business (ธุรกิจหลัก) ──────────────────────────────────
export interface CoreBusinessData {
  summary: string;
  summaryTh?: string;
  summaryEn?: string;
  businessUnits: {
    name: string;
    nameTh?: string;
    nameEn?: string;
    description: string;
    descriptionTh?: string;
    descriptionEn?: string;
    revenuePercentage: number;
    color: string;
  }[];
  totalRevenue: string;
  totalRevenueTh?: string;
  totalRevenueEn?: string;
  fiscalYear: string;
}

// ─── Section 2: Customer Base (ฐานลูกค้า) ───────────────────────────────────
export interface CustomerBaseData {
  model: string;
  description: string;
  descriptionTh?: string;
  descriptionEn?: string;
  customerSegments: {
    name: string;
    nameTh?: string;
    nameEn?: string;
    percentage: number;
    description: string;
    descriptionTh?: string;
    descriptionEn?: string;
  }[];
  stickiness: {
    factor: string;
    factorTh?: string;
    factorEn?: string;
    description: string;
    descriptionTh?: string;
    descriptionEn?: string;
    strength: "high" | "medium" | "low";
  }[];
  summary: string;
  summaryTh?: string;
  summaryEn?: string;
}

// ─── Section 3: Revenue Model & Quality (Model รายได้) ───────────────────────
export interface RevenueModelData {
  revenueTypes: {
    type: string;
    typeTh?: string;
    typeEn?: string;
    percentage: number;
    description: string;
    descriptionTh?: string;
    descriptionEn?: string;
    color: string;
  }[];
  qualitySummary: string;
  qualitySummaryTh?: string;
  qualitySummaryEn?: string;
  revenueEvolution: string;
  revenueEvolutionTh?: string;
  revenueEvolutionEn?: string;
  keyMetrics: {
    label: string;
    labelTh?: string;
    labelEn?: string;
    value: string;
  }[];
}

// ─── Section 4: Financial Statements (งบการเงิน) ─────────────────────────────
export interface FinancialsData {
  years: string[];
  revenue: number[];
  netProfit: number[];
  operatingExpenses: number[];
  cashOnHand: number[];
  totalDebt: number[];
  dividendYield: number[];
  currency: string;
  unit: string;
  keyTakeawayRatios: {
    name: string;
    nameTh?: string;
    nameEn?: string;
    value: string;
    explanation: string;
    explanationTh?: string;
    explanationEn?: string;
    relevance: string;
    relevanceTh?: string;
    relevanceEn?: string;
  }[];
  summary: string;
  summaryTh?: string;
  summaryEn?: string;
}

// ─── Section 5: 7 Powers ─────────────────────────────────────────────────────
export interface SevenPowersData {
  powers: {
    name: string;
    level: "high" | "medium" | "low";
    score: number;
    analysis: string;
    analysisTh?: string;
    analysisEn?: string;
  }[];
  summary: string;
  summaryTh?: string;
  summaryEn?: string;
}

// ─── Section 6: Story & New S-Curve ──────────────────────────────────────────
export interface StorySCurveData {
  currentStory: string;
  currentStoryTh?: string;
  currentStoryEn?: string;
  newSCurves: {
    title: string;
    titleTh?: string;
    titleEn?: string;
    description: string;
    descriptionTh?: string;
    descriptionEn?: string;
    potential: "high" | "medium" | "low";
  }[];
  hiddenGems: {
    title: string;
    titleTh?: string;
    titleEn?: string;
    description: string;
    descriptionTh?: string;
    descriptionEn?: string;
  }[];
  summary: string;
  summaryTh?: string;
  summaryEn?: string;
}

// ─── Section 7: Risks (ความเสี่ยง) ──────────────────────────────────────────
export interface RisksData {
  risks: {
    title: string;
    titleTh?: string;
    titleEn?: string;
    severity: "high" | "medium" | "low";
    description: string;
    descriptionTh?: string;
    descriptionEn?: string;
    mitigation: string;
    mitigationTh?: string;
    mitigationEn?: string;
  }[];
  summary: string;
  summaryTh?: string;
  summaryEn?: string;
}

// ─── Section 8: CEO Profile & Execution ──────────────────────────────────────
export interface CeoProfileData {
  name: string;
  title: string;
  titleTh?: string;
  titleEn?: string;
  background: string;
  backgroundTh?: string;
  backgroundEn?: string;
  ceoImageUrl?: string;
  executionTrackRecord: {
    claim: string;
    claimTh?: string;
    claimEn?: string;
    result: string;
    resultTh?: string;
    resultEn?: string;
    verdict: "delivered" | "partial" | "missed";
    source: string;
  }[];
  earningsCallHighlights: string[];
  earningsCallHighlightsTh?: string[];
  earningsCallHighlightsEn?: string[];
  beatMissRecord: {
    metric: string;
    metricTh?: string;
    metricEn?: string;
    target: string;
    actual: string;
    verdict: "beat" | "meet" | "miss";
  }[];
  summary: string;
  summaryTh?: string;
  summaryEn?: string;
}

// ─── Optional: Shareholders ──────────────────────────────────────────────────
export interface ShareholdersData {
  majorShareholders: {
    name: string;
    percentage: number;
    type: string; // "Institution" | "Individual" | "Government"
  }[];
  freeFloat: number;
  lastUpdated: string;
}

// ─── Optional: Recent News ───────────────────────────────────────────────────
export interface RecentNewsData {
  news: {
    title: string;
    date: string;
    source: string;
    summary: string;
    sentiment: "positive" | "neutral" | "negative";
  }[];
}

// ─── Portfolio Types ──────────────────────────────────────────────────────────
export interface PortfolioItem {
  id: string;
  portfolioId: string;
  stockId: string;
  symbol: string;
  shares: number | null;
  avgCost: number | null;
  notes: string | null;
  addedAt: Date;
}

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  items: PortfolioItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PortfolioItemWithStock extends PortfolioItem {
  stock?: {
    id: string;
    symbol: string;
    name: string;
    sector: string;
    exchange: string;
    logoUrl: string | null;
  };
}

// ─── Transaction Types ───────────────────────────────────────────────────────
export type TransactionType = "buy" | "sell" | "dividend";

export interface Transaction {
  id: string;
  portfolioId: string;
  stockId: string;
  symbol: string;
  type: TransactionType;
  shares: number;
  price: number;
  fees: number;
  currency: string;
  date: Date;
  notes: string | null;
  createdAt: Date;
}

// ─── Portfolio Snapshot ──────────────────────────────────────────────────────
export interface PortfolioSnapshot {
  id: string;
  portfolioId: string;
  totalValue: number;
  totalCost: number;
  currency: string;
  date: Date;
  breakdown: string | null;
}

// ─── Price Alert ─────────────────────────────────────────────────────────────
export type AlertDirection = "above" | "below";

export interface Alert {
  id: string;
  userId: string;
  symbol: string;
  targetPrice: number;
  direction: AlertDirection;
  isTriggered: boolean;
  triggeredAt: Date | null;
  createdAt: Date;
}

// ─── Dividend Record ─────────────────────────────────────────────────────────
export interface DividendRecord {
  id: string;
  portfolioId: string;
  stockId: string;
  symbol: string;
  amount: number;
  perShare: number | null;
  exDate: Date | null;
  payDate: Date | null;
  currency: string;
  createdAt: Date;
}

// ─── Chart Data ──────────────────────────────────────────────────────────────
export interface ChartDataPoint {
  timestamp: number;
  date: string;
  close: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalPL: number;
  totalPLPct: number;
  dailyPL: number;
  dailyPLPct: number;
  stockCount: number;
}

// ─── AI Health Score ─────────────────────────────────────────────────────────
export interface HealthScoreBreakdown {
  score: number;
  label: string;
}

export interface HealthScore {
  score: number;
  breakdown: {
    diversification: HealthScoreBreakdown;
    sectorBalance: HealthScoreBreakdown;
    riskQuality: HealthScoreBreakdown;
    growthPotential: HealthScoreBreakdown;
  };
  summary: string;
  topAction: string;
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

// AI fetch result
export interface AIFetchResult {
  symbol: string;
  coreBusiness: string;
  customerBase: string;
  revenueModel: string;
  financials: string;
  sevenPowers: string;
  storyAndSCurve: string;
  risks: string;
  ceoProfile: string;
  shareholders?: string;
  recentNews?: string;
}

// ─── UI Helper Types ──────────────────────────────────────────────────────────
export type SectionKey =
  | "coreBusiness"
  | "customerBase"
  | "revenueModel"
  | "financials"
  | "sevenPowers"
  | "storyAndSCurve"
  | "risks"
  | "ceoProfile";

export const SECTION_LABELS: Record<SectionKey, string> = {
  coreBusiness: "ธุรกิจหลัก / Core Business",
  customerBase: "ฐานลูกค้า / Customer Base",
  revenueModel: "Model รายได้ / Revenue Model",
  financials: "งบการเงิน / Financial Statements",
  sevenPowers: "7 Powers Analysis",
  storyAndSCurve: "Story & New S-Curve",
  risks: "ความเสี่ยง / Investment Risks",
  ceoProfile: "CEO Profile & Execution",
};

export const SECTION_ICONS: Record<SectionKey, string> = {
  coreBusiness: "Building2",
  customerBase: "Users",
  revenueModel: "PieChart",
  financials: "BarChart3",
  sevenPowers: "Shield",
  storyAndSCurve: "Rocket",
  risks: "AlertTriangle",
  ceoProfile: "UserCheck",
};
