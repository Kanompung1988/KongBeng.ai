// Intent detection for Khongbeng AI chat
// Parses user messages to determine what data to pre-fetch

import { prisma } from "@/lib/prisma";

export interface ChatIntent {
  type: "stock_lookup" | "stock_compare" | "news" | "portfolio" | "price" | "sector" | "general";
  symbols: string[];
  query: string;
}

// Known stock symbols cache (refreshed every 10 minutes)
let knownSymbols: Set<string> | null = null;
let symbolsCacheExpiry = 0;

async function getKnownSymbols(): Promise<Set<string>> {
  if (knownSymbols && Date.now() < symbolsCacheExpiry) return knownSymbols;

  const stocks = await prisma.stock.findMany({
    where: { isPublished: true },
    select: { symbol: true },
  });
  knownSymbols = new Set(stocks.map(s => s.symbol.toUpperCase()));
  symbolsCacheExpiry = Date.now() + 10 * 60 * 1000;
  return knownSymbols;
}

// Extract potential stock symbols from text
function extractSymbols(text: string, symbols: Set<string>): string[] {
  // Match uppercase words that look like stock symbols (1-6 chars)
  const words = text.match(/\b[A-Z][A-Z0-9]{0,5}\b/g) || [];
  // Also check for Thai stock symbols that might be mixed case
  const allWords = text.split(/[\s,;.!?()]+/).map(w => w.toUpperCase());

  const found = new Set<string>();
  for (const word of [...words, ...allWords]) {
    if (symbols.has(word) && word.length >= 1) {
      found.add(word);
    }
  }
  return Array.from(found);
}

// Keyword patterns for intent detection
const NEWS_KEYWORDS = /\b(news|ข่าว|trend|เทรนด์|article|บทความ|ข่าวสาร|latest|ล่าสุด|สรุปข่าว|headline)\b/i;
const PORTFOLIO_KEYWORDS = /\b(portfolio|พอร์ต|watchlist|my stocks|หุ้นของ|หุ้นฉัน|พอร์ตฉัน|พอร์ตของฉัน|dashboard|แดชบอร์ด)\b/i;
const COMPARE_KEYWORDS = /\b(compare|เปรียบเทียบ|versus|vs\.?|เทียบ|ต่างกัน|อันไหนดี|เลือก)\b/i;
const PRICE_KEYWORDS = /\b(price|ราคา|quote|มูลค่า|ตลาด|market cap|pe ratio|p\/e)\b/i;
const SECTOR_KEYWORDS = /\b(sector|กลุ่ม|อุตสาหกรรม|industry|ภาค|หมวด)\b/i;

export async function detectIntent(message: string, stockContext?: string): Promise<ChatIntent> {
  const symbols = await getKnownSymbols();
  const detectedSymbols = extractSymbols(message, symbols);

  // Check for portfolio intent
  if (PORTFOLIO_KEYWORDS.test(message)) {
    return {
      type: "portfolio",
      symbols: detectedSymbols,
      query: message,
    };
  }

  // Check for news intent
  if (NEWS_KEYWORDS.test(message)) {
    return {
      type: "news",
      symbols: detectedSymbols,
      query: message,
    };
  }

  // Check for compare intent (need 2+ symbols)
  if (COMPARE_KEYWORDS.test(message) && detectedSymbols.length >= 2) {
    return {
      type: "stock_compare",
      symbols: detectedSymbols,
      query: message,
    };
  }

  // If 2+ symbols detected without explicit compare keyword, still compare
  if (detectedSymbols.length >= 2) {
    return {
      type: "stock_compare",
      symbols: detectedSymbols,
      query: message,
    };
  }

  // Check for price/quote intent
  if (PRICE_KEYWORDS.test(message)) {
    const syms = detectedSymbols.length > 0 ? detectedSymbols : (stockContext ? [stockContext] : []);
    if (syms.length > 0) {
      return { type: "price", symbols: syms, query: message };
    }
  }

  // Check for sector query
  if (SECTOR_KEYWORDS.test(message)) {
    return { type: "sector", symbols: detectedSymbols, query: message };
  }

  // If specific symbol mentioned, look it up
  if (detectedSymbols.length === 1) {
    return {
      type: "stock_lookup",
      symbols: detectedSymbols,
      query: message,
    };
  }

  // If on a stock page and asking about the stock
  if (stockContext && detectedSymbols.length === 0) {
    // Check if the message is about the current stock
    const isAboutStock = /\b(stock|หุ้น|บริษัท|company|analysis|วิเคราะห์|ธุรกิจ|business|financials|งบการเงิน|risk|ความเสี่ยง|ceo|revenue|รายได้|moat|power|growth|โต|dividend|ปันผล|ผู้ถือหุ้น|shareholder)\b/i.test(message);
    if (isAboutStock) {
      return {
        type: "stock_lookup",
        symbols: [stockContext],
        query: message,
      };
    }
  }

  // Default: general chat
  return {
    type: "general",
    symbols: detectedSymbols,
    query: message,
  };
}
