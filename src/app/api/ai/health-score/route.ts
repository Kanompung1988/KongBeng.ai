// AI Health Score — generates a portfolio health score (0-100) with breakdown
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createClient } from "@/lib/supabase/server";
import { buildPortfolioContext } from "@/lib/ai-portfolio-context";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const typhoon = createOpenAI({
  baseURL: "https://api.opentyphoon.ai/v1",
  apiKey: process.env.TYPHOON_API_KEY!,
});
const typhoonModel = typhoon("typhoon-v2.5-30b-a3b-instruct");

// In-memory cache: userId -> { data, expires }
const healthScoreCache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const lang = body.lang === "en" ? "en" : "th";

    // Check cache (include lang in cache key)
    const cacheKey = `${user.id}:${lang}`;
    const cached = healthScoreCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return NextResponse.json(cached.data);
    }

    const portfolio = await buildPortfolioContext(user.id);

    if (portfolio.items.length === 0) {
      return NextResponse.json({
        error: "No stocks in portfolio. Add stocks to get a health score.",
      }, { status: 400 });
    }

    const langInstruction = lang === "th"
      ? "ตอบเป็นภาษาไทยเท่านั้น (ยกเว้นชื่อหุ้นและตัวเลข)"
      : "Respond in English only.";

    const systemPrompt = `You are ขงเบ้ง AI (Khongbeng Strategist AI). You are a portfolio health analyst.
Disclaimer: This is for educational purposes only, not financial advice.
${langInstruction}

Analyze the portfolio and return ONLY valid JSON (no markdown fences, no extra text) with this exact structure:
{
  "score": <number 0-100>,
  "breakdown": {
    "diversification": { "score": <number 0-100>, "label": "<brief assessment>" },
    "sectorBalance": { "score": <number 0-100>, "label": "<brief assessment>" },
    "riskQuality": { "score": <number 0-100>, "label": "<brief assessment>" },
    "growthPotential": { "score": <number 0-100>, "label": "<brief assessment>" }
  },
  "summary": "<2-3 sentence overall assessment>",
  "topAction": "<single most impactful action the investor should take>"
}

All "label", "summary", and "topAction" values must be in ${lang === "th" ? "Thai" : "English"}.

Scoring guidelines:
- diversification: How many unique stocks & sectors? <5 stocks = low, 5-10 = medium, >10 = good
- sectorBalance: Is one sector >50%? Any sector >40% reduces score
- riskQuality: Consider P/L distribution, loss-heavy = lower score
- growthPotential: Mix of growth vs value, overall portfolio direction
- Overall score is a weighted average: diversification 25%, sectorBalance 25%, riskQuality 25%, growthPotential 25%`;

    const userPrompt = `Analyze this portfolio:

${portfolio.summary}

Detailed holdings:
${portfolio.items.map((i) => `- ${i.symbol} (${i.sector}): ${i.shares} shares, weight ${i.weight}%, P/L ${i.plPct}%`).join("\n")}

Sector weights:
${Object.entries(portfolio.sectorWeights).map(([s, w]) => `- ${s}: ${w}%`).join("\n")}

Total value: $${portfolio.totalValue.toFixed(2)}
Total cost: $${portfolio.totalCost.toFixed(2)}`;

    const { text } = await generateText({
      model: typhoonModel,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.3,
      maxTokens: 2048,
    });

    // Parse JSON from response
    const clean = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
    const result = JSON.parse(clean);

    // Validate structure
    const response = {
      score: typeof result.score === "number" ? result.score : 50,
      breakdown: {
        diversification: result.breakdown?.diversification || { score: 50, label: "Unknown" },
        sectorBalance: result.breakdown?.sectorBalance || { score: 50, label: "Unknown" },
        riskQuality: result.breakdown?.riskQuality || { score: 50, label: "Unknown" },
        growthPotential: result.breakdown?.growthPotential || { score: 50, label: "Unknown" },
      },
      summary: result.summary || "Unable to generate summary.",
      topAction: result.topAction || "Review your portfolio diversification.",
    };

    // Cache the result
    healthScoreCache.set(cacheKey, { data: response, expires: Date.now() + CACHE_TTL });

    return NextResponse.json(response);
  } catch (err) {
    console.error("[ai/health-score] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate health score" },
      { status: 500 }
    );
  }
}
