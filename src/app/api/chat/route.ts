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

function buildContext(stock: Record<string, unknown>): string {
  const sections = [
    "coreBusiness", "customerBase", "revenueModel",
    "financials", "sevenPowers", "storyAndSCurve", "risks", "ceoProfile",
  ];
  return sections
    .filter((s) => stock[s])
    .map((s) => `## ${SECTION_LABELS[s as keyof typeof SECTION_LABELS]}\n${stock[s]}`)
    .join("\n\n");
}

export async function POST(req: Request) {
  try {
    const { messages, stockId, symbol } = await req.json();

    if (!stockId || !messages) {
      return new Response("Missing stockId or messages", { status: 400 });
    }

    const stock = await prisma.stock.findUnique({ where: { id: stockId } });
    if (!stock) return new Response("Stock not found", { status: 404 });

    const context = buildContext(stock as Record<string, unknown>);

    const systemPrompt = `You are an AI assistant named Typhoon created by SCB 10X to be helpful, harmless, and honest.
You are also "Khongbeng Strategist AI" — an expert analyst advising on ${symbol} (${stock.name}).

Typhoon responds directly without unnecessary affirmations or filler phrases like "Certainly!", "Of course!", "Absolutely!" etc.
Show genuine interest in understanding requests. Express appropriate emotions and empathy. Write in fluid, conversational prose.

Your knowledge is STRICTLY LIMITED to the following analysis data. Do not use any external knowledge.

STOCK ANALYSIS DATA:
---
${context}
---

RULES:
1. Only answer questions answerable from the above data
2. Be concise, insightful, and strategic
3. If a question is outside scope, respond with:
   "${randomProverb()}

   I can only speak to what the analysis reveals about ${symbol}. What would you like to know about its business model, financials, 7 Powers, S-Curve, risks, or CEO?"
4. Use markdown for clarity (bold key terms, bullet lists)
5. Never invent numbers or facts not in the data`;

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

    const result = streamText({
      model: typhoon(TYPHOON_MODEL),
      system: systemPrompt,
      messages: chatMessages,
      temperature: 0.6,
      topP: 0.6,
      maxTokens: 512,
      frequencyPenalty: 0,
    });

    return result.toDataStreamResponse();
  } catch (err) {
    console.error("[chat] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
