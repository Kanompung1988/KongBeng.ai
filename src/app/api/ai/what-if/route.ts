// AI What-If — simulates buy/sell and analyzes the impact
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { buildPortfolioContext } from "@/lib/ai-portfolio-context";
import { getQuote } from "@/lib/yahoo";

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

    const body = await req.json();
    const { symbol, shares, action, lang: reqLang } = body as {
      symbol: string;
      shares: number;
      action: "buy" | "sell";
      lang?: string;
    };
    const lang = reqLang === "en" ? "en" : "th";

    if (!symbol || !shares || !action || !["buy", "sell"].includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid request. Required: symbol, shares, action (buy|sell)" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch current portfolio
    const portfolio = await buildPortfolioContext(user.id);

    // Find the target stock info
    const stock = await prisma.stock.findFirst({
      where: { symbol: symbol.toUpperCase() },
      select: { symbol: true, name: true, sector: true, exchange: true },
    });

    if (!stock) {
      return new Response(JSON.stringify({ error: `Stock ${symbol} not found` }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get live quote for target symbol
    const quote = await getQuote(stock.symbol, stock.exchange);
    const targetPrice = quote.price ?? 0;
    const tradeValue = targetPrice * shares;

    // Calculate before/after
    const beforeTotalValue = portfolio.totalValue;
    const afterTotalValue = action === "buy"
      ? beforeTotalValue + tradeValue
      : beforeTotalValue - tradeValue;

    // Sector impact
    const beforeSectorWeights = { ...portfolio.sectorWeights };
    const afterSectorWeights: Record<string, number> = {};

    if (afterTotalValue > 0) {
      // Recompute all sector values
      const sectorValues: Record<string, number> = {};
      for (const item of portfolio.items) {
        const itemValue = item.price != null ? item.price * item.shares : 0;
        sectorValues[item.sector] = (sectorValues[item.sector] || 0) + itemValue;
      }
      // Apply the trade
      const sectorKey = stock.sector;
      sectorValues[sectorKey] = (sectorValues[sectorKey] || 0) + (action === "buy" ? tradeValue : -tradeValue);

      for (const [sector, value] of Object.entries(sectorValues)) {
        if (value > 0) {
          afterSectorWeights[sector] = Math.round((value / afterTotalValue) * 10000) / 100;
        }
      }
    }

    const beforeAfter = {
      action,
      symbol: stock.symbol,
      stockName: stock.name,
      shares,
      pricePerShare: targetPrice,
      tradeValue,
      before: {
        totalValue: beforeTotalValue,
        sectorWeights: beforeSectorWeights,
        stockCount: portfolio.items.length,
      },
      after: {
        totalValue: afterTotalValue,
        sectorWeights: afterSectorWeights,
        stockCount: action === "buy"
          ? (portfolio.items.some((i) => i.symbol === stock.symbol)
            ? portfolio.items.length
            : portfolio.items.length + 1)
          : portfolio.items.length,
      },
    };

    const langInstruction = lang === "th"
      ? "ตอบเป็นภาษาไทยเท่านั้น (ยกเว้นชื่อหุ้นและตัวเลข)"
      : "Respond in English only.";

    const systemPrompt = `You are ขงเบ้ง AI (Khongbeng Strategist AI) — a what-if trade scenario analyst.
Disclaimer: This is for educational purposes only, not financial advice.
${langInstruction}

The user wants to simulate a trade. Analyze the impact on their portfolio.
Cover:
1. **${lang === "th" ? "สรุปการซื้อขาย" : "Trade Summary"}** — What they're doing and at what price
2. **${lang === "th" ? "ผลกระทบต่อพอร์ต" : "Portfolio Impact"}** — How value, sector allocation, and diversification change
3. **${lang === "th" ? "การวิเคราะห์ความเสี่ยง" : "Risk Analysis"}** — Does this trade increase or decrease risk?
4. **${lang === "th" ? "คำแนะนำ" : "Recommendation"}** — Is this a good trade for their portfolio? Why or why not?

Use markdown. Be specific with numbers. Compare before/after clearly using bullet points (not tables).`;

    const userPrompt = `I want to simulate: **${action.toUpperCase()} ${shares} shares of ${stock.symbol} (${stock.name})** at $${targetPrice.toFixed(2)}/share (total: $${tradeValue.toFixed(2)}).

Current portfolio:
${portfolio.summary}

Holdings:
${portfolio.items.map((i) => `- ${i.symbol} (${i.sector}): ${i.shares} shares, weight ${i.weight}%`).join("\n")}

**Before trade:**
- Total value: $${beforeTotalValue.toFixed(2)}
- Sectors: ${Object.entries(beforeSectorWeights).map(([s, w]) => `${s} ${w}%`).join(", ")}

**After trade:**
- Total value: $${afterTotalValue.toFixed(2)}
- Sectors: ${Object.entries(afterSectorWeights).map(([s, w]) => `${s} ${w}%`).join(", ") || "N/A"}
- Target stock sector: ${stock.sector}`;

    const result = streamText({
      model: typhoonModel,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.5,
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
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Before-After": JSON.stringify(beforeAfter),
      },
    });
  } catch (err) {
    console.error("[ai/what-if] Error:", err);
    return new Response(JSON.stringify({
      error: err instanceof Error ? err.message : "Failed to simulate trade",
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
