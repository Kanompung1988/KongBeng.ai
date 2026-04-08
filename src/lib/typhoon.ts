// Typhoon AI — stock analysis engine for Khongbeng Strategist
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
You are also "Khongbeng Strategist" — a world-class investment analyst with deep expertise in fundamental analysis, competitive strategy (Hamilton Helmer's 7 Powers), and CEO execution assessment.

Your stock analysis must be:
- Factual, data-driven, and sourced from the latest annual reports (10-K / 56-1 One Report), earnings calls, and Investor Relations materials
- Written in a clear, insightful tone — not generic, not vague
- Organized into exactly the 8 JSON fields below
- For Thai stocks (SET): write analysis in Thai
- For US stocks (NYSE/NASDAQ): write analysis in English

Typhoon responds directly without unnecessary affirmations or filler phrases.
Return ONLY valid JSON, no markdown fences, no extra text.`;

const ANALYSIS_SCHEMA = `{
  "coreBusiness": {
    "summary": "string — อธิบายธุรกิจให้เข้าใจง่ายว่าบริษัททำอะไร ใน 2-3 paragraphs",
    "businessUnits": [
      {"name": "string", "description": "string — อธิบายสั้นๆ", "revenuePercentage": number, "color": "#hex"}
    ],
    "totalRevenue": "string — e.g. '150 billion THB' or '$50 billion'",
    "fiscalYear": "string — e.g. '2024'"
  },
  "customerBase": {
    "model": "string — e.g. 'B2B', 'B2C', 'B2B2C'",
    "description": "string — อธิบาย customer model ใน 1-2 paragraphs",
    "customerSegments": [
      {"name": "string", "percentage": number, "description": "string"}
    ],
    "stickiness": [
      {"factor": "string — ชื่อ factor", "description": "string — อธิบายว่าทำไม sticky", "strength": "high|medium|low"}
    ],
    "summary": "string — สรุป customer base strength"
  },
  "revenueModel": {
    "revenueTypes": [
      {"type": "string — e.g. 'Recurring', 'Subscription', 'Backlog', 'One-Time', 'Transaction Fee'", "percentage": number, "description": "string", "color": "#hex"}
    ],
    "qualitySummary": "string — สรุปคุณภาพรายได้",
    "revenueEvolution": "string — 1-2 paragraphs on future revenue direction",
    "keyMetrics": [{"label": "string", "value": "string"}]
  },
  "financials": {
    "years": ["2020", "2021", "2022", "2023", "2024"],
    "revenue": [number, number, number, number, number],
    "netProfit": [number, number, number, number, number],
    "operatingExpenses": [number, number, number, number, number],
    "cashOnHand": [number, number, number, number, number],
    "totalDebt": [number, number, number, number, number],
    "dividendYield": [number, number, number, number, number],
    "currency": "THB|USD",
    "unit": "million|billion",
    "keyTakeawayRatios": [
      {"name": "string — e.g. 'Retention Rate'", "value": "string — e.g. '95%'", "explanation": "string", "relevance": "string — why this ratio matters for THIS specific business model"}
    ],
    "summary": "string — สรุปภาพรวมงบการเงิน"
  },
  "sevenPowers": {
    "powers": [
      {"name": "Scale Economies", "level": "high|medium|low", "score": 1-5, "analysis": "string"},
      {"name": "Network Economies", "level": "high|medium|low", "score": 1-5, "analysis": "string"},
      {"name": "Counter-Positioning", "level": "high|medium|low", "score": 1-5, "analysis": "string"},
      {"name": "Switching Costs", "level": "high|medium|low", "score": 1-5, "analysis": "string"},
      {"name": "Branding", "level": "high|medium|low", "score": 1-5, "analysis": "string"},
      {"name": "Cornered Resource", "level": "high|medium|low", "score": 1-5, "analysis": "string"},
      {"name": "Process Power", "level": "high|medium|low", "score": 1-5, "analysis": "string"}
    ],
    "summary": "string — สรุปว่า Power ไหนแข็งแกร่งที่สุด"
  },
  "storyAndSCurve": {
    "currentStory": "string — 2-3 paragraphs on company's current growth narrative",
    "newSCurves": [
      {"title": "string", "description": "string", "potential": "high|medium|low"}
    ],
    "hiddenGems": [
      {"title": "string", "description": "string — สิ่งที่ตลาดอาจยังมองไม่เห็น"}
    ],
    "summary": "string"
  },
  "risks": {
    "risks": [
      {"title": "string", "severity": "high|medium|low", "description": "string", "mitigation": "string — วิธีรับมือหรือปัจจัยบรรเทา"}
    ],
    "summary": "string — สรุปความเสี่ยงหลัก"
  },
  "ceoProfile": {
    "name": "string — ชื่อ CEO",
    "title": "string — ตำแหน่ง",
    "background": "string — ประวัติคร่าวๆ 1-2 paragraphs",
    "executionTrackRecord": [
      {"claim": "string — สิ่งที่ CEO พูดหรือสัญญา", "result": "string — สิ่งที่เกิดขึ้นจริง", "verdict": "delivered|partial|missed", "source": "string — e.g. 'Earnings Call Q3 2024' or '56-1 One Report 2024'"}
    ],
    "earningsCallHighlights": ["string — key quotes or highlights from recent earnings calls"],
    "beatMissRecord": [
      {"metric": "string — e.g. 'Revenue'", "target": "string — เป้าที่ตั้งไว้", "actual": "string — ตัวเลขจริง", "verdict": "beat|meet|miss"}
    ],
    "summary": "string — สรุปว่า CEO execute ดีแค่ไหน Make Sense ไหม"
  }
}`;

export async function fetchStockAnalysis(symbol: string): Promise<AIFetchResult> {
  const userPrompt = `Analyze the stock with ticker symbol: ${symbol.toUpperCase()}

Search for the most recent data from:
1. Annual report (10-K for US stocks, 56-1 One Report for Thai SET stocks)
2. Latest quarterly earnings and earnings call transcripts
3. Investor Relations materials and presentations
4. Financial statements for the past 5 years (2020-2024)
5. CEO statements and execution track record
6. Hamilton Helmer's 7 Powers framework applied to this company

Fill in this exact JSON schema with real, accurate data:
${ANALYSIS_SCHEMA}

IMPORTANT:
- For the coreBusiness.businessUnits colors, use: ["#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4", "#f97316"]
- For the revenueModel.revenueTypes colors, use: ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444"]
- All financial numbers should be actual figures (not made up). Use the currency and unit appropriate for the stock's market.
- For 7 Powers: analyze ALL 7 powers. Score each from 1-5. Be honest — if a power is weak, say so.
- For CEO: reference specific earnings calls or reports where possible. Assess if the CEO's story makes sense and has materialized.
- keyTakeawayRatios should be business-model specific (e.g. for subscription businesses: Retention Rate, CAC/LTV; for banks: NIM, NPL ratio)

Return ONLY the JSON object. No markdown fences, no explanations.`;

  const response = await getClient().chat.completions.create({
    model: TYPHOON_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    top_p: 0.6,
    max_tokens: 8192,
    frequency_penalty: 0,
  });

  const text = response.choices[0].message.content || "{}";

  // Strip any accidental markdown fences
  const clean = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
  const parsed = JSON.parse(clean);

  return {
    symbol: symbol.toUpperCase(),
    coreBusiness: JSON.stringify(parsed.coreBusiness || {}),
    customerBase: JSON.stringify(parsed.customerBase || {}),
    revenueModel: JSON.stringify(parsed.revenueModel || {}),
    financials: JSON.stringify(parsed.financials || {}),
    sevenPowers: JSON.stringify(parsed.sevenPowers || {}),
    storyAndSCurve: JSON.stringify(parsed.storyAndSCurve || {}),
    risks: JSON.stringify(parsed.risks || {}),
    ceoProfile: JSON.stringify(parsed.ceoProfile || {}),
    shareholders: parsed.shareholders ? JSON.stringify(parsed.shareholders) : undefined,
    recentNews: parsed.recentNews ? JSON.stringify(parsed.recentNews) : undefined,
  };
}
