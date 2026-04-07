// Typhoon AI — drop-in replacement for Gemini
// Uses OpenAI-compatible API at opentyphoon.ai
import OpenAI from "openai";
import type { AIFetchResult } from "@/types";

// Lazy init — avoids build-time error when env vars aren't available
function getClient() {
  return new OpenAI({
    apiKey: process.env.TYPHOON_API_KEY!,
    baseURL: "https://api.opentyphoon.ai/v1",
  });
}

const TYPHOON_MODEL = "typhoon-v2.5-30b-a3b-instruct";

const SYSTEM_PROMPT = `You are an AI assistant named Typhoon created by SCB 10X to be helpful, harmless, and honest.
You are also "KongBeng Strategist" — a world-class investment analyst with the strategic clarity of Sun Tzu, the financial rigor of Warren Buffett, and the macro insight of Ray Dalio.

Your stock analysis must be:
- Factual, data-driven, and sourced from the latest annual reports (10-K / 56-1 One Report)
- Written in a "strategic and insightful" tone — not generic, not vague
- Organized into exactly the 8 JSON fields below
- Confident and decisive, like a master strategist advising a general

Typhoon responds directly without unnecessary affirmations or filler phrases.
Return ONLY valid JSON, no markdown fences, no extra text.`;

const ANALYSIS_SCHEMA = `{
  "businessOverview": "string — 3-4 paragraphs covering: what the company does, its core business model, key markets, and strategic position",
  "revenueStructure": {
    "segments": [{"name": "string", "percentage": number, "amount": number, "currency": "THB|USD", "color": "#hex"}],
    "totalRevenue": number,
    "currency": "THB|USD",
    "fiscalYear": "string",
    "note": "string"
  },
  "financialHealth": {
    "pe": number,
    "pb": number,
    "roe": number,
    "roa": number,
    "debtToEquity": number,
    "dividendYield": number,
    "eps": number,
    "marketCap": number,
    "currency": "string",
    "currentRatio": number,
    "grossMargin": number,
    "netMargin": number,
    "revenueGrowthYoY": number,
    "fiscalYear": "string",
    "lastUpdated": "ISO date string"
  },
  "growthStrategy": "string — 3-4 paragraphs on expansion plans, capex allocation, M&A targets, and digital transformation",
  "moat": "string — 3-4 paragraphs on sustainable competitive advantages: brand, distribution, cost leadership, network effects, IP",
  "risks": "string — 3-4 paragraphs covering macro risks, competitive threats, regulatory exposure, and key man risk",
  "industryLandscape": "string — 3-4 paragraphs on sector dynamics, TAM, key competitors, disruption threats, and tailwinds",
  "strategistVerdict": {
    "score": number,
    "rating": "STRONG BUY|BUY|HOLD|REDUCE|SELL",
    "summary": "string — 2-3 decisive sentences summarizing the investment thesis",
    "bullPoints": ["string", "string", "string"],
    "bearPoints": ["string", "string"],
    "targetPrice": number,
    "currency": "string",
    "timeHorizon": "12 months"
  }
}`;

export async function fetchStockAnalysis(symbol: string): Promise<AIFetchResult> {
  const userPrompt = `Analyze the stock with ticker symbol: ${symbol.toUpperCase()}

Search for the most recent:
1. Annual report (10-K for US stocks, 56-1 One Report for Thai SET stocks)
2. Latest quarterly earnings
3. Recent analyst reports and news (last 6 months)

Fill in this exact JSON schema with real, accurate data:
${ANALYSIS_SCHEMA}

For the revenueStructure colors, use a palette that fits a dark fintech theme:
["#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4", "#f97316"]

Return ONLY the JSON object. No markdown fences, no explanations.`;

  const response = await getClient().chat.completions.create({
    model: TYPHOON_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    top_p: 0.6,
    max_tokens: 4096,
    frequency_penalty: 0,
  });

  const text = response.choices[0].message.content || "{}";

  // Strip any accidental markdown fences
  const clean = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
  const parsed = JSON.parse(clean);

  return {
    symbol: symbol.toUpperCase(),
    businessOverview: parsed.businessOverview || "",
    revenueStructure: JSON.stringify(parsed.revenueStructure || {}),
    financialHealth: JSON.stringify(parsed.financialHealth || {}),
    growthStrategy: parsed.growthStrategy || "",
    moat: parsed.moat || "",
    risks: parsed.risks || "",
    industryLandscape: parsed.industryLandscape || "",
    strategistVerdict: JSON.stringify(parsed.strategistVerdict || {}),
  };
}
