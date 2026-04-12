// AI Market Brief — personalized daily market brief based on portfolio + news
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

    // Fetch latest 5 trend articles
    const articles = await prisma.trendArticle.findMany({
      orderBy: { publishedAt: "desc" },
      take: 5,
      select: {
        title: true,
        summary: true,
        category: true,
        tags: true,
        publishedAt: true,
      },
    });

    const langInstruction = lang === "th"
      ? "ตอบเป็นภาษาไทยเท่านั้น (ยกเว้นชื่อหุ้นและตัวเลข)"
      : "Respond in English only.";

    const systemPrompt = `You are ขงเบ้ง AI (Khongbeng Strategist AI) — a personalized market brief writer.
Disclaimer: This is for educational purposes only, not financial advice.
${langInstruction}

Create a personalized daily market brief for the user. Your brief should:
1. **${lang === "th" ? "ผลกระทบต่อพอร์ต" : "Portfolio Impact Summary"}** — How today's news affects their specific holdings
2. **${lang === "th" ? "ข่าวสำคัญ" : "Key Market Movers"}** — Top 2-3 news items most relevant to their portfolio
3. **${lang === "th" ? "ภาพรวมกลุ่มอุตสาหกรรม" : "Sector Watch"}** — Any sector-specific developments affecting their allocation
4. **${lang === "th" ? "สิ่งที่ควรทำ" : "Action Items"}** — 2-3 concise, actionable takeaways

Rules:
- Focus on news that DIRECTLY affects the user's holdings or sectors
- Be concise and scannable — use bullet points and bold key terms. Do NOT use markdown tables.
- If no news directly relates to their holdings, mention the closest connections
- Include specific stock symbols from their portfolio when referencing impacts
- Keep the entire brief under 500 words
- Use markdown formatting: headers (##), bold, bullet points`;

    const newsSection = articles.length > 0
      ? articles.map((a) => `- [${a.category}] ${a.title} (${a.publishedAt.toISOString().split("T")[0]}): ${a.summary.substring(0, 200)}`).join("\n")
      : "No recent news articles available.";

    const userPrompt = `Today's date: ${new Date().toISOString().split("T")[0]}

My portfolio:
${portfolio.summary}

Holdings by sector:
${Object.entries(portfolio.sectorWeights).sort((a, b) => b[1] - a[1]).map(([s, w]) => `- ${s}: ${w}%`).join("\n")}

My stocks:
${portfolio.items.map((i) => `- ${i.symbol} (${i.name}) — ${i.sector} | P/L: ${i.plPct > 0 ? "+" : ""}${i.plPct}%`).join("\n")}

Latest market news:
${newsSection}

Create my personalized daily market brief.`;

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
    console.error("[ai/market-brief] Error:", err);
    return new Response(JSON.stringify({
      error: err instanceof Error ? err.message : "Failed to generate market brief",
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
