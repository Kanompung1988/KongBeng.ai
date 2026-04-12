// Unified Khongbeng AI Chat — full RAG with intent-based context injection
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { detectIntent } from "@/lib/ai-router";
import {
  lookupStock,
  searchStocks,
  getStockQuote,
  searchNews,
  getPortfolio,
  compareStocks,
  listBySector,
} from "@/lib/ai-tools";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const typhoon = createOpenAI({
  apiKey: process.env.TYPHOON_API_KEY!,
  baseURL: "https://api.opentyphoon.ai/v1",
});

const TYPHOON_MODEL = "typhoon-v2.5-30b-a3b-instruct";

const BASE_SYSTEM_PROMPT = `You are "ขงเบ้ง AI" (Khongbeng AI) — an expert investment strategist for the Khongbeng Strategist platform.

Your personality:
- Strategic, insightful, and data-driven
- Uses Sun Tzu wisdom when appropriate
- Friendly but professional
- Explains complex financial concepts clearly

CAPABILITIES:
- Deep stock analysis (8 dimensions: business model, customers, revenue, financials, 7 Powers moat, growth story, risks, CEO)
- Live market quotes and prices
- Investment news and trend summaries
- User portfolio analysis and suggestions
- Sector comparisons and stock comparisons

STRICT RULES:
1. READ-ONLY: You cannot modify any data, add stocks, change settings, or perform admin operations
2. If asked to perform admin operations (create, delete, edit stocks, approve users, etc.), politely refuse and explain you are a read-only assistant
3. Never give specific buy/sell recommendations with price targets
4. Always include: "This is educational content, not financial advice" (or Thai equivalent)
5. Respond in the same language the user uses (Thai or English)
6. Use markdown formatting (bold, lists, tables) for clarity
7. Only use data provided in the CONTEXT section below — do not invent numbers or facts
8. If data is not available for a question, say so honestly and suggest checking the stock's analysis page on Khongbeng

Respond directly without filler phrases like "Certainly!", "Of course!", "Absolutely!".`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, stockSymbol } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response("Missing messages", { status: 400 });
    }

    // Filter messages: only keep valid user/assistant
    const validMessages = messages
      .filter((m: { role: string; content: string }) => m.role === "user" || m.role === "assistant")
      .filter((m: { content: string }) => m.content && m.content.trim().length > 0);

    const chatMessages = validMessages.length > 0 && validMessages[0].role === "assistant"
      ? validMessages.slice(1)
      : validMessages;

    if (chatMessages.length === 0) {
      return new Response("No messages to process", { status: 400 });
    }

    // Get authenticated user (optional — for portfolio access)
    let userId: string | null = null;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) userId = user.id;
    } catch { /* not authenticated, that's fine */ }

    // Get the latest user message for intent detection
    const lastUserMsg = [...chatMessages].reverse().find((m: { role: string }) => m.role === "user");
    const userQuery = lastUserMsg?.content || "";

    // Detect intent
    const intent = await detectIntent(userQuery, stockSymbol || undefined);

    console.log("[ai-chat] Intent:", intent.type, "Symbols:", intent.symbols, "StockContext:", stockSymbol);

    // Fetch context based on intent
    const contextParts: string[] = [];

    switch (intent.type) {
      case "stock_lookup": {
        const symbol = intent.symbols[0] || stockSymbol;
        if (symbol) {
          const [analysis, quote] = await Promise.all([
            lookupStock(symbol),
            getStockQuote(symbol),
          ]);
          contextParts.push(analysis, "\n**Live Quote:**\n" + quote);
        }
        break;
      }
      case "stock_compare": {
        const result = await compareStocks(intent.symbols);
        contextParts.push(result);
        break;
      }
      case "news": {
        // If specific symbol mentioned, search for it; otherwise get latest
        const q = intent.symbols.length > 0 ? intent.symbols[0] : undefined;
        const result = await searchNews(q);
        contextParts.push(result);
        break;
      }
      case "portfolio": {
        if (userId) {
          const result = await getPortfolio(userId);
          contextParts.push(result);
        } else {
          contextParts.push("User is not logged in. Suggest them to sign in at /login to access portfolio features.");
        }
        break;
      }
      case "price": {
        const quotes = await Promise.all(intent.symbols.map(s => getStockQuote(s)));
        contextParts.push(quotes.join("\n\n"));
        break;
      }
      case "sector": {
        // Extract sector name from query
        const sectorMatch = userQuery.match(/(?:sector|กลุ่ม|อุตสาหกรรม|industry)\s*[:\s]*([a-zA-Zก-๙\s]+)/i);
        const sectorQuery = sectorMatch ? sectorMatch[1].trim() : userQuery;
        const result = await listBySector(sectorQuery);
        contextParts.push(result);
        break;
      }
      case "general": {
        // If on a stock page, provide basic stock context
        if (stockSymbol) {
          const analysis = await lookupStock(stockSymbol);
          contextParts.push(analysis);
        }
        break;
      }
    }

    // Build the full system prompt
    let systemPrompt = BASE_SYSTEM_PROMPT;
    if (contextParts.length > 0) {
      systemPrompt += `\n\nCONTEXT DATA:\n---\n${contextParts.join("\n\n")}\n---`;
    }

    // Truncate system prompt if too long (keep under ~6000 chars to leave room for conversation)
    if (systemPrompt.length > 6000) {
      systemPrompt = systemPrompt.substring(0, 5900) + "\n...(data truncated)";
    }

    const result = streamText({
      model: typhoon(TYPHOON_MODEL),
      system: systemPrompt,
      messages: chatMessages,
      temperature: 0.6,
      topP: 0.7,
      maxTokens: 8192,
    });

    return result.toDataStreamResponse();
  } catch (err) {
    console.error("[ai-chat] Error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
