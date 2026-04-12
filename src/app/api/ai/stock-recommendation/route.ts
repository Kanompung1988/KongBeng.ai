// AI Stock Recommendation — suggests complementary stocks based on portfolio
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { buildPortfolioContext } from "@/lib/ai-portfolio-context";

export const dynamic = "force-dynamic";

const typhoon = createOpenAI({
  baseURL: "https://api.opentyphoon.ai/v1",
  apiKey: process.env.TYPHOON_API_KEY!,
});
const typhoonModel = typhoon("typhoon-v2.5-30b-a3b-instruct");

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const lang = body.lang === "en" ? "en" : "th";

    const portfolio = await buildPortfolioContext(user.id);

    if (portfolio.items.length === 0) {
      return new Response(JSON.stringify({ error: "No stocks in portfolio. Add stocks first." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get the user's current symbols
    const ownedSymbols = portfolio.items.map((i) => i.symbol);

    // Fetch top 20 published stocks NOT in user's portfolio
    const availableStocks = await prisma.stock.findMany({
      where: {
        isPublished: true,
        symbol: { notIn: ownedSymbols },
      },
      select: {
        symbol: true,
        name: true,
        sector: true,
        exchange: true,
      },
      orderBy: { viewCount: "desc" },
      take: 20,
    });

    if (availableStocks.length === 0) {
      return new Response(JSON.stringify({ error: "No available stocks to recommend. You may already own all published stocks." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const langInstruction = lang === "th"
      ? "ตอบเป็นภาษาไทยเท่านั้น (ยกเว้นชื่อหุ้นและตัวเลข)"
      : "Respond in English only.";

    const systemPrompt = `You are ขงเบ้ง AI (Khongbeng Strategist AI) — a strategic stock recommendation engine.
Disclaimer: This is for educational purposes only, not financial advice.
${langInstruction}

Based on the user's current portfolio, recommend 3-5 complementary stocks from the available list.
For each recommendation:
1. **${lang === "th" ? "ชื่อหุ้นและสัญลักษณ์" : "Stock name and symbol"}**
2. **${lang === "th" ? "เหตุผลที่เหมาะสม" : "Why it fits"}** — How it complements the existing portfolio (diversification, sector gap, growth balance)
3. **${lang === "th" ? "จุดเด่น" : "Key strength"}** — What makes this stock attractive on its own merits
4. **${lang === "th" ? "ความเสี่ยงที่ควรพิจารณา" : "Risk to consider"}** — One key risk to watch

Format as a numbered list with clear markdown. Do NOT use markdown tables — use bullet points instead.
Be specific about WHY each stock complements their particular portfolio.
Consider: sector gaps, geographic diversification, growth vs value balance, risk management.`;

    const userPrompt = `My current portfolio:
${portfolio.summary}

Holdings:
${portfolio.items.map((i) => `- ${i.symbol} (${i.name}) — ${i.sector}, weight ${i.weight}%`).join("\n")}

Sector allocation:
${Object.entries(portfolio.sectorWeights).sort((a, b) => b[1] - a[1]).map(([s, w]) => `- ${s}: ${w}%`).join("\n")}

Available stocks I could add (NOT in my portfolio):
${availableStocks.map((s) => `- ${s.symbol} (${s.name}) — ${s.sector}, ${s.exchange}`).join("\n")}

Recommend 3-5 stocks from the available list that would best complement my portfolio.`;

    const result = streamText({
      model: typhoonModel,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.6,
      maxTokens: 4096,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.textStream) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    console.error("[ai/stock-recommendation] Error:", err);
    return new Response(JSON.stringify({
      error: err instanceof Error ? err.message : "Failed to generate recommendations",
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
