// Core TypeScript types for Khongbeng AI

// ─── Stock Types ──────────────────────────────────────────────────────────────
export interface Stock {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  exchange: string;
  logoUrl?: string | null;

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
  businessUnits: {
    name: string;
    description: string;
    revenuePercentage: number;
    color: string;
  }[];
  totalRevenue: string;
  fiscalYear: string;
}

// ─── Section 2: Customer Base (ฐานลูกค้า) ───────────────────────────────────
export interface CustomerBaseData {
  model: string; // "B2B", "B2C", "B2B2C"
  description: string;
  customerSegments: {
    name: string;
    percentage: number;
    description: string;
  }[];
  stickiness: {
    factor: string;
    description: string;
    strength: "high" | "medium" | "low";
  }[];
  summary: string;
}

// ─── Section 3: Revenue Model & Quality (Model รายได้) ───────────────────────
export interface RevenueModelData {
  revenueTypes: {
    type: string; // "Recurring" | "Subscription" | "Backlog" | "One-Time"
    percentage: number;
    description: string;
    color: string;
  }[];
  qualitySummary: string;
  revenueEvolution: string;
  keyMetrics: { label: string; value: string }[];
}

// ─── Section 4: Financial Statements (งบการเงิน) ─────────────────────────────
export interface FinancialsData {
  years: string[]; // ["2020","2021","2022","2023","2024"]
  revenue: number[];
  netProfit: number[];
  operatingExpenses: number[];
  cashOnHand: number[];
  totalDebt: number[];
  dividendYield: number[]; // percentage per year
  currency: string;
  unit: string; // "million" | "billion"
  keyTakeawayRatios: {
    name: string;
    value: string;
    explanation: string;
    relevance: string;
  }[];
  summary: string;
}

// ─── Section 5: 7 Powers ─────────────────────────────────────────────────────
export interface SevenPowersData {
  powers: {
    name: string; // Scale Economies, Network Economies, Counter-Positioning, Switching Costs, Branding, Cornered Resource, Process Power
    level: "high" | "medium" | "low";
    score: number; // 1-5 for radar chart
    analysis: string;
  }[];
  summary: string;
}

// ─── Section 6: Story & New S-Curve ──────────────────────────────────────────
export interface StorySCurveData {
  currentStory: string;
  newSCurves: {
    title: string;
    description: string;
    potential: "high" | "medium" | "low";
  }[];
  hiddenGems: {
    title: string;
    description: string;
  }[];
  summary: string;
}

// ─── Section 7: Risks (ความเสี่ยง) ──────────────────────────────────────────
export interface RisksData {
  risks: {
    title: string;
    severity: "high" | "medium" | "low";
    description: string;
    mitigation: string;
  }[];
  summary: string;
}

// ─── Section 8: CEO Profile & Execution ──────────────────────────────────────
export interface CeoProfileData {
  name: string;
  title: string;
  background: string;
  ceoImageUrl?: string;
  executionTrackRecord: {
    claim: string;
    result: string;
    verdict: "delivered" | "partial" | "missed";
    source: string;
  }[];
  earningsCallHighlights: string[];
  beatMissRecord: {
    metric: string;
    target: string;
    actual: string;
    verdict: "beat" | "meet" | "miss";
  }[];
  summary: string;
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
