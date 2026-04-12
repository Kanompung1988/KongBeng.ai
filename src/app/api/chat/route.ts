// Chat API — RAG with Typhoon (OpenAI-compatible streaming via Vercel AI SDK)
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { prisma } from "@/lib/prisma";
import { SECTION_LABELS } from "@/types";

const typhoon = createOpenAI({
  apiKey: process.env.TYPHOON_API_KEY!,
  baseURL: "https://api.opentyphoon.ai/v1",
});

const TYPHOON_MODEL = "typhoon-v2.5-30b-a3b-instruct";

const PROVERBS = [
  "As Sun Tzu said: 'Know your enemy and know yourself.' Let me guide you back to the data at hand.",
  "The wise strategist knows the limits of the battlefield. My counsel is bound to this analysis.",
  "A sword is only useful if you know your battlefield. Let us return to what the data reveals.",
];

function randomProverb() {
  return PROVERBS[Math.floor(Math.random() * PROVERBS.length)];
}

function extractSummary(val: unknown): string {
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      // If JSON object with summary, return summary
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        const obj = parsed as Record<string, unknown>;
        if (typeof obj.summary === "string") return obj.summary;
        if (typeof obj.overall === "string") return obj.overall;
        if (typeof obj.verdict === "string") return obj.verdict;
      }
      // If parsed is a string, return it
      if (typeof parsed === "string") return parsed;
      // Otherwise stringify briefly
      return JSON.stringify(parsed).substring(0, 200);
    } catch {
      // Plain text
      return val.substring(0, 300);
    }
  }
  return String(val).substring(0, 200);
}

function buildContext(stock: Record<string, unknown>): string {
  const sections = [
    "coreBusiness", "financials", "risks",
  ];
  const parts: string[] = [];
  let totalLen = 0;

  for (const s of sections) {
    if (!stock[s]) continue;
    const label = SECTION_LABELS[s as keyof typeof SECTION_LABELS].split("/").pop()?.trim() || s;
    const summary = extractSummary(stock[s]);
    // Limit each section to 150 chars to stay within Typhoon token budget
    const truncated = summary.length > 150 ? summary.substring(0, 150) + "..." : summary;
    if (truncated && totalLen + truncated.length < 500) {
      parts.push(`${label}: ${truncated}`);
      totalLen += truncated.length;
    }
  }
  return parts.join("\n");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, stockId, symbol } = body;

    if (!stockId || !messages) {
      return new Response("Missing stockId or messages", { status: 400 });
    }

    const stock = await prisma.stock.findUnique({ where: { id: stockId } });
    if (!stock) return new Response("Stock not found", { status: 404 });

    const context = buildContext(stock as Record<string, unknown>);

    const systemPrompt = `You are "ขงเบ้ง AI" (Khongbeng Strategist AI) — an expert analyst advising on ${symbol} (${stock.name}).

Respond directly without unnecessary affirmations or filler phrases like "Certainly!", "Of course!", "Absolutely!" etc.
Show genuine interest in understanding requests. Express appropriate emotions and empathy. Write in fluid, conversational prose.

Your knowledge is STRICTLY LIMITED to the following analysis data. Do not use any external knowledge.

STOCK ANALYSIS DATA:
---
${context}
---

RULES:
1. Only answer questions answerable from the above data
2. Be concise, insightful, and strategic
3. If a question is outside scope, say: "${randomProverb()}"
4. Use markdown for clarity (bold key terms, bullet lists)
5. Never invent numbers or facts not in the data
6. Respond in the same language the user uses`;

    // Filter messages: only keep valid user/assistant messages
    const validMessages = messages
      .filter((m: { role: string; content: string }) => m.role === "user" || m.role === "assistant")
      .filter((m: { content: string }) => m.content && m.content.trim().length > 0);

    // Skip the welcome message (first assistant message)
    const chatMessages = validMessages.length > 0 && validMessages[0].role === "assistant"
      ? validMessages.slice(1)
      : validMessages;

    if (chatMessages.length === 0) {
      return new Response("No messages to process", { status: 400 });
    }

    console.log("[chat] Sending to Typhoon:", { symbol, msgCount: chatMessages.length, contextLen: context.length });

    try {
      const result = streamText({
        model: typhoon(TYPHOON_MODEL),
        system: systemPrompt,
        messages: chatMessages,
        temperature: 0.6,
        topP: 0.6,
        maxTokens: 8192,
      });

      return result.toDataStreamResponse();
    } catch (streamErr) {
      console.error("[chat] streamText error:", streamErr);
      return Response.json({ error: "Stream error: " + (streamErr instanceof Error ? streamErr.message : String(streamErr)) }, { status: 500 });
    }
  } catch (err) {
    console.error("[chat] Error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
