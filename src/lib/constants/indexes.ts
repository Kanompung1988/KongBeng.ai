// Market index constants for stock categorization

export const THAI_INDEXES = ["SET50", "SET100", "MAI", "sSet"] as const;
export const US_INDEXES = ["SP500", "NASDAQ100", "DOW_JONES", "RUSSELL_2000"] as const;

export const ALL_INDEXES = [...THAI_INDEXES, ...US_INDEXES] as const;
export type MarketIndex = (typeof ALL_INDEXES)[number];

export const INDEX_LABELS: Record<string, { th: string; en: string }> = {
  SET50: { th: "SET 50", en: "SET 50" },
  SET100: { th: "SET 100", en: "SET 100" },
  MAI: { th: "MAI", en: "MAI" },
  sSet: { th: "sSet", en: "sSet" },
  SP500: { th: "S&P 500", en: "S&P 500" },
  NASDAQ100: { th: "Nasdaq 100", en: "Nasdaq 100" },
  DOW_JONES: { th: "Dow Jones", en: "Dow Jones" },
  RUSSELL_2000: { th: "Russell 2000", en: "Russell 2000" },
};

export function getIndexesForExchange(exchange: string): readonly string[] {
  if (exchange === "SET") return THAI_INDEXES;
  return US_INDEXES;
}
