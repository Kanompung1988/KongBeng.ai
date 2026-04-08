// Trend Article Generator — Gemini AI with google_search grounding
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const CRON_SECRET = process.env.CRON_SECRET || "";

const CATEGORIES = ["macro", "tech", "commodities", "crypto", "thai-market"] as const;

interface TrendResult {
  title: string;
  titleTh: string;
  summary: string;
  summaryTh: string;
  content: string;
  contentTh: string;
  category: string;
  tags: string[];
  source: string;
}

function parseJSON(text: string): Record<string, unknown> {
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  let clean = fenceMatch ? fenceMatch[1].trim() : text.trim();
  if (!clean.startsWith("{")) {
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start !== -1 && end > start) clean = clean.substring(start, end + 1);
  }
  clean = clean.replace(/\/\/[^\n]*/g, "");
  clean = clean.replace(/\/\*[\s\S]*?\*\//g, "");
  clean = clean.replace(/,\s*([}\]])/g, "$1");
  try {
    return JSON.parse(clean);
  } catch {
    const fixed = clean.replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');
    return JSON.parse(fixed);
  }
}

async function generateArticle(): Promise<TrendResult> {
  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

  const prompt = `You are Khongbeng AI Trend analyst. Research the LATEST global investment news and market developments as of TODAY.

Focus on category: "${category}"

Generate a well-researched, insightful investment trend article. Use real, current data from your search.

Return ONLY valid JSON in this exact format:
{
  "title": "English title (max 100 chars)",
  "titleTh": "Thai translation of title",
  "summary": "English summary, 2-3 sentences",
  "summaryTh": "Thai translation of summary",
  "content": "English article in markdown format, 500-800 words. Include ## headings, bullet points, and bold key terms.",
  "contentTh": "Thai translation of the full article in markdown format",
  "category": "${category}",
  "tags": ["tag1", "tag2", "tag3"],
  "source": "Primary source attribution"
}

Important:
- Content must be based on REAL, CURRENT market data from your search
- Include specific numbers, dates, and source references
- Write in professional financial journalism style
- Both English and Thai content must be high quality`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    }),
    signal: AbortSignal.timeout(55000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err.substring(0, 200)}`);
  }

  const data = await res.json();
  const parts = data.candidates?.[0]?.content?.parts;
  if (!parts) throw new Error("No content in Gemini response");

  const textPart = parts.find((p: { text?: string }) => p.text);
  if (!textPart?.text) throw new Error("No text in Gemini response");

  const parsed = parseJSON(textPart.text) as unknown as TrendResult;

  // Validate required fields
  if (!parsed.title || !parsed.content || !parsed.category) {
    throw new Error("Missing required fields in generated article");
  }

  // Ensure valid category
  if (!CATEGORIES.includes(parsed.category as typeof CATEGORIES[number])) {
    parsed.category = category;
  }

  return parsed;
}

export async function POST(req: Request) {
  // Auth check
  const authHeader = req.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Debounce: skip if latest article is less than 5 hours old
    const latest = await prisma.trendArticle.findFirst({
      orderBy: { publishedAt: "desc" },
      select: { publishedAt: true },
    });

    if (latest) {
      const hoursSince = (Date.now() - latest.publishedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSince < 5) {
        return Response.json({
          skipped: true,
          message: `Latest article is ${hoursSince.toFixed(1)}h old, skipping`,
        });
      }
    }

    const article = await generateArticle();

    const saved = await prisma.trendArticle.create({
      data: {
        title: article.title,
        titleTh: article.titleTh || null,
        summary: article.summary,
        summaryTh: article.summaryTh || null,
        content: article.content,
        contentTh: article.contentTh || null,
        category: article.category,
        tags: article.tags || [],
        source: article.source || null,
      },
    });

    return Response.json({ success: true, articleId: saved.id, title: saved.title });
  } catch (err) {
    console.error("[trend/generate] Error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to generate article" },
      { status: 500 }
    );
  }
}

// GET: status check
export async function GET() {
  const count = await prisma.trendArticle.count();
  const latest = await prisma.trendArticle.findFirst({
    orderBy: { publishedAt: "desc" },
    select: { id: true, title: true, publishedAt: true, category: true },
  });
  return Response.json({ totalArticles: count, latest });
}
