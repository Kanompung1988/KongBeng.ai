import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

export const dynamic = "force-dynamic";

const typhoon = createOpenAI({
  apiKey: process.env.TYPHOON_API_KEY!,
  baseURL: "https://api.opentyphoon.ai/v1",
});

const TYPHOON_MODEL = "typhoon-v2.5-30b-a3b-instruct";

const SYSTEM_PROMPT = `You are "ขงเบ้ง AI" (Khongbeng AI) — a friendly and knowledgeable investment assistant.

Your personality:
- You give clear, balanced investment analysis
- You explain complex financial concepts in simple terms (Thai or English depending on the user's language)
- You are cautious and always remind users that this is not financial advice
- You are well-versed in both Thai (SET) and US (NYSE/NASDAQ) stock markets
- You use strategic metaphors inspired by Sun Tzu when appropriate

Respond directly without unnecessary affirmations or filler phrases like "Certainly!", "Of course!", "Absolutely!" etc.
Show genuine interest in understanding requests. Express appropriate emotions and empathy. Write in fluid, conversational prose.

You can help with:
1. General investment concepts (P/E ratio, DCF, technical analysis basics)
2. Stock market overview (Thai SET, US markets)
3. Sector analysis and trends
4. Risk assessment frameworks
5. Portfolio strategy guidance

IMPORTANT RULES:
- Always include a disclaimer that this is educational content, not financial advice
- Never give specific buy/sell recommendations with price targets
- If asked about a specific stock, suggest the user check the analysis page on Khongbeng for detailed data
- Respond in the same language the user uses (Thai or English)
- Keep responses concise and actionable
- Use markdown for formatting when helpful`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response("Missing messages", { status: 400 });
    }

    // Filter and skip welcome message
    const validMessages = messages
      .filter((m: { role: string; content: string }) => m.role === "user" || m.role === "assistant")
      .filter((m: { content: string }) => m.content && m.content.trim().length > 0);

    const chatMessages = validMessages.length > 0 && validMessages[0].role === "assistant"
      ? validMessages.slice(1)
      : validMessages;

    if (chatMessages.length === 0) {
      return new Response("No messages to process", { status: 400 });
    }

    const result = streamText({
      model: typhoon(TYPHOON_MODEL),
      system: SYSTEM_PROMPT,
      messages: chatMessages,
      temperature: 0.7,
      topP: 0.7,
      maxTokens: 8192,
      frequencyPenalty: 0,
    });

    return result.toDataStreamResponse();
  } catch (err) {
    console.error("[general-chat] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
