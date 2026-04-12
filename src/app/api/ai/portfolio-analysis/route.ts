// AI Portfolio Analysis — streaming portfolio analysis
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createClient } from "@/lib/supabase/server";
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
      return new Response(JSON.stringify({ error: "No stocks in portfolio." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const langInstruction = lang === "th"
      ? "ตอบเป็นภาษาไทยเท่านั้น (ยกเว้นชื่อหุ้นและตัวเลข)"
      : "Respond in English only.";

    const systemPrompt = `You are ขงเบ้ง AI (Khongbeng Strategist AI) — a world-class portfolio analyst.
Disclaimer: This is for educational purposes only, not financial advice.
${langInstruction}

Analyze the user's portfolio comprehensively. Cover these areas in order:
1. **${lang === "th" ? "การกระจายความเสี่ยง" : "Diversification Assessment"}** — Number of holdings, geographic spread, market cap distribution
2. **${lang === "th" ? "สัดส่วนตามกลุ่มอุตสาหกรรม" : "Sector Concentration"}** — Which sectors are over/under-weighted relative to benchmarks
3. **${lang === "th" ? "การประเมินความเสี่ยง" : "Risk Assessment"}** — Overall risk level, correlation between holdings, downside exposure
4. **${lang === "th" ? "คำแนะนำ" : "Suggested Changes"}** — Specific, actionable recommendations to improve the portfolio

Be specific about each stock — reference actual symbols, weights, and P/L figures.
Use markdown formatting: headers (##), bold, bullet points. Do NOT use markdown tables — use bullet points or bold key-value pairs instead for data presentation.
Write in a clear, professional tone. Be honest about weaknesses.`;

    const userPrompt = `Here is my portfolio to analyze:

${portfolio.summary}

Detailed holdings:
${portfolio.items.map((i) => `- **${i.symbol}** (${i.name}) — ${i.sector}, ${i.exchange} | ${i.shares} shares @ weight ${i.weight}% | P/L: ${i.plPct > 0 ? "+" : ""}${i.plPct}% | Price: ${i.price != null ? "$" + i.price.toFixed(2) : "N/A"}`).join("\n")}

Sector allocation:
${Object.entries(portfolio.sectorWeights).sort((a, b) => b[1] - a[1]).map(([s, w]) => `- ${s}: ${w}%`).join("\n")}

Total value: $${portfolio.totalValue.toFixed(2)}
Total cost: $${portfolio.totalCost.toFixed(2)}
Overall P/L: ${portfolio.totalValue - portfolio.totalCost >= 0 ? "+" : ""}$${(portfolio.totalValue - portfolio.totalCost).toFixed(2)} (${portfolio.totalCost > 0 ? (((portfolio.totalValue - portfolio.totalCost) / portfolio.totalCost) * 100).toFixed(1) : "0"}%)`;

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
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    console.error("[ai/portfolio-analysis] Error:", err);
    return new Response(JSON.stringify({
      error: err instanceof Error ? err.message : "Failed to analyze portfolio",
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
