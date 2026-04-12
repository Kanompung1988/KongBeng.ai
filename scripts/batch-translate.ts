/**
 * Batch translate stock analysis content between Thai and English.
 *
 * Usage:
 *   npx tsx scripts/batch-translate.ts                    # translate all
 *   npx tsx scripts/batch-translate.ts --only=AAPL        # single stock
 *   npx tsx scripts/batch-translate.ts --exchange=SET      # SET stocks only
 *   npx tsx scripts/batch-translate.ts --dry               # preview only
 *   npx tsx scripts/batch-translate.ts --force             # re-translate even if exists
 *   npx tsx scripts/batch-translate.ts --concurrency=10     # parallel workers (default 5)
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env
function loadEnv() {
  try {
    const envPath = resolve(__dirname, "..", ".env");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.substring(0, eqIdx).trim();
      let val = trimmed.substring(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {}
}
loadEnv();

// Dynamic import translate after env is loaded
async function loadTranslate() {
  // We need to use require since translate.ts uses env vars at import time
  const OpenAI = (await import("openai")).default;

  function getClient() {
    return new OpenAI({
      apiKey: process.env.TYPHOON_API_KEY!,
      baseURL: "https://api.opentyphoon.ai/v1",
    });
  }

  const TYPHOON_MODEL = "typhoon-v2.5-30b-a3b-instruct";

  // Inline the translation logic to avoid module resolution issues
  const SECTION_FIELDS: Record<string, { field: string; arrayKey?: string }[]> = {
    coreBusiness: [
      { field: "summary" },
      { field: "name", arrayKey: "businessUnits" },
      { field: "description", arrayKey: "businessUnits" },
      { field: "totalRevenue" },
    ],
    customerBase: [
      { field: "description" },
      { field: "name", arrayKey: "customerSegments" },
      { field: "description", arrayKey: "customerSegments" },
      { field: "factor", arrayKey: "stickiness" },
      { field: "description", arrayKey: "stickiness" },
      { field: "summary" },
    ],
    revenueModel: [
      { field: "type", arrayKey: "revenueTypes" },
      { field: "description", arrayKey: "revenueTypes" },
      { field: "qualitySummary" },
      { field: "revenueEvolution" },
      { field: "label", arrayKey: "keyMetrics" },
    ],
    financials: [
      { field: "name", arrayKey: "keyTakeawayRatios" },
      { field: "explanation", arrayKey: "keyTakeawayRatios" },
      { field: "relevance", arrayKey: "keyTakeawayRatios" },
      { field: "summary" },
    ],
    sevenPowers: [
      { field: "analysis", arrayKey: "powers" },
      { field: "summary" },
    ],
    storyAndSCurve: [
      { field: "currentStory" },
      { field: "title", arrayKey: "newSCurves" },
      { field: "description", arrayKey: "newSCurves" },
      { field: "title", arrayKey: "hiddenGems" },
      { field: "description", arrayKey: "hiddenGems" },
      { field: "summary" },
    ],
    risks: [
      { field: "title", arrayKey: "risks" },
      { field: "description", arrayKey: "risks" },
      { field: "mitigation", arrayKey: "risks" },
      { field: "summary" },
    ],
    ceoProfile: [
      { field: "title" },
      { field: "background" },
      { field: "claim", arrayKey: "executionTrackRecord" },
      { field: "result", arrayKey: "executionTrackRecord" },
      { field: "metric", arrayKey: "beatMissRecord" },
      { field: "summary" },
    ],
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function extractTexts(sectionKey: string, data: any): Record<string, string> {
    const specs = SECTION_FIELDS[sectionKey];
    if (!specs) return {};
    const texts: Record<string, string> = {};
    for (const spec of specs) {
      if (spec.arrayKey) {
        const arr = data[spec.arrayKey];
        if (Array.isArray(arr)) {
          arr.forEach((item: Record<string, unknown>, i: number) => {
            const val = item[spec.field];
            if (typeof val === "string" && val) {
              texts[`${spec.arrayKey}.${i}.${spec.field}`] = val;
            }
          });
        }
      } else {
        const val = data[spec.field];
        if (typeof val === "string" && val) {
          texts[spec.field] = val;
        }
      }
    }
    if (sectionKey === "ceoProfile" && Array.isArray(data.earningsCallHighlights)) {
      data.earningsCallHighlights.forEach((h: string, i: number) => {
        if (h) texts[`earningsCallHighlights.${i}`] = h;
      });
    }
    return texts;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function mergeTranslations(sectionKey: string, data: any, translations: Record<string, string>, suffix: "Th" | "En"): any {
    const result = JSON.parse(JSON.stringify(data));
    for (const [key, value] of Object.entries(translations)) {
      if (!value) continue;
      const parts = key.split(".");
      if (parts.length === 1) {
        result[parts[0] + suffix] = value;
      } else if (parts.length === 3) {
        const [arrKey, idxStr, field] = parts;
        const idx = parseInt(idxStr, 10);
        if (Array.isArray(result[arrKey]) && result[arrKey][idx]) {
          result[arrKey][idx][field + suffix] = value;
        }
      } else if (parts.length === 2 && parts[0] === "earningsCallHighlights") {
        if (!result["earningsCallHighlights" + suffix]) {
          result["earningsCallHighlights" + suffix] = [...(result.earningsCallHighlights || [])];
        }
        const idx = parseInt(parts[1], 10);
        result["earningsCallHighlights" + suffix][idx] = value;
      }
    }
    return result;
  }

  function hasTranslation(raw: string | null, targetLang: "th" | "en"): boolean {
    if (!raw) return false;
    const suffix = targetLang === "th" ? "Th" : "En";
    try {
      const data = JSON.parse(raw);
      if (data["summary" + suffix]) return true;
      if (data["currentStory" + suffix]) return true;
      if (data["background" + suffix]) return true;
      if (data["qualitySummary" + suffix]) return true;
      if (data["description" + suffix]) return true;
      return false;
    } catch {
      return false;
    }
  }

  async function translateStock(
    sections: Record<string, string | null>,
    sourceLang: "th" | "en",
    targetLang: "th" | "en"
  ): Promise<Record<string, string>> {
    const suffix = targetLang === "th" ? "Th" : "En";
    const langNames = { th: "Thai", en: "English" };
    const allTexts: Record<string, string> = {};
    const sectionKeys = Object.keys(SECTION_FIELDS);

    for (const sectionKey of sectionKeys) {
      const raw = sections[sectionKey];
      if (!raw) continue;
      try {
        const data = JSON.parse(raw);
        const texts = extractTexts(sectionKey, data);
        for (const [k, v] of Object.entries(texts)) {
          allTexts[`${sectionKey}::${k}`] = v;
        }
      } catch {}
    }

    if (Object.keys(allTexts).length === 0) return {};

    const prompt = `Translate the following stock analysis texts from ${langNames[sourceLang]} to ${langNames[targetLang]}.

RULES:
- Preserve company names, ticker symbols, and numbers exactly as-is
- Keep standard financial terms (P/E ratio, NIM, NPL, ROE, EPS, etc.)
- Maintain the same tone, detail level, and paragraph structure
- Return ONLY a valid JSON object with the same keys and translated values
- Do NOT add markdown fences or extra text

TEXTS:
${JSON.stringify(allTexts, null, 2)}`;

    const response = await getClient().chat.completions.create({
      model: TYPHOON_MODEL,
      messages: [
        {
          role: "system",
          content: `You are a professional financial translator. Translate stock analysis content accurately between Thai and English. Return only valid JSON.`,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 8192,
    });

    const text = response.choices[0].message.content || "{}";
    const clean = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
    let translated: Record<string, string>;
    try {
      translated = JSON.parse(clean);
    } catch {
      throw new Error(`Failed to parse translation response`);
    }

    const result: Record<string, string> = {};
    for (const sectionKey of sectionKeys) {
      const raw = sections[sectionKey];
      if (!raw) continue;
      try {
        let data = JSON.parse(raw);
        const sectionTranslations: Record<string, string> = {};
        const prefix = `${sectionKey}::`;
        for (const [k, v] of Object.entries(translated)) {
          if (k.startsWith(prefix) && typeof v === "string") {
            sectionTranslations[k.slice(prefix.length)] = v;
          }
        }
        if (Object.keys(sectionTranslations).length > 0) {
          data = mergeTranslations(sectionKey, data, sectionTranslations, suffix);
          result[sectionKey] = JSON.stringify(data);
        }
      } catch {}
    }

    return result;
  }

  return { translateStock, hasTranslation, extractTexts };
}

// ─── Main ───────────────────────────────────────────────────────────────────

const prisma = new PrismaClient();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const args = process.argv.slice(2);
const getArg = (name: string) => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split("=")[1] : null;
};
const hasFlag = (name: string) => args.includes(`--${name}`);

async function main() {
  const { translateStock, hasTranslation, extractTexts } = await loadTranslate();

  const only = getArg("only");
  const exchangeFilter = getArg("exchange");
  const isDry = hasFlag("dry");
  const isForce = hasFlag("force");
  const concurrency = parseInt(getArg("concurrency") || "5", 10);

  const SECTION_KEYS = [
    "coreBusiness", "customerBase", "revenueModel", "financials",
    "sevenPowers", "storyAndSCurve", "risks", "ceoProfile",
  ];

  // Build query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { coreBusiness: { not: null } };
  if (only) where.symbol = only.toUpperCase();
  if (exchangeFilter) where.exchange = exchangeFilter.toUpperCase();

  const stocks = await prisma.stock.findMany({
    where,
    select: {
      id: true, symbol: true, exchange: true,
      coreBusiness: true, customerBase: true, revenueModel: true,
      financials: true, sevenPowers: true, storyAndSCurve: true,
      risks: true, ceoProfile: true,
    },
    orderBy: { symbol: "asc" },
  });

  console.log(`Found ${stocks.length} stocks with AI data`);
  if (exchangeFilter) console.log(`Filtered by exchange: ${exchangeFilter.toUpperCase()}`);
  if (!isDry) console.log(`Concurrency: ${concurrency}`);

  let translated = 0;
  let skipped = 0;
  let failed = 0;
  let completed = 0;

  // Filter out already-translated and prepare work items
  type WorkItem = { index: number; stock: typeof stocks[number]; sourceLang: "th" | "en"; targetLang: "th" | "en"; textCount: number; sections: Record<string, string | null> };
  const work: WorkItem[] = [];

  for (let i = 0; i < stocks.length; i++) {
    const stock = stocks[i];
    const sourceLang: "th" | "en" = stock.exchange === "SET" ? "th" : "en";
    const targetLang: "th" | "en" = sourceLang === "th" ? "en" : "th";

    if (!isForce && hasTranslation(stock.coreBusiness, targetLang)) {
      skipped++;
      continue;
    }

    const sections: Record<string, string | null> = {};
    let textCount = 0;
    for (const key of SECTION_KEYS) {
      const raw = stock[key as keyof typeof stock] as string | null;
      sections[key] = raw;
      if (raw) {
        try { textCount += Object.keys(extractTexts(key, JSON.parse(raw))).length; } catch {}
      }
    }

    work.push({ index: i, stock, sourceLang, targetLang, textCount, sections });
  }

  console.log(`Skipped (already translated): ${skipped}`);
  console.log(`To translate: ${work.length}\n`);

  if (isDry) {
    for (const w of work) {
      console.log(`[${String(w.index + 1).padStart(3)}/${stocks.length}] ${w.stock.symbol.padEnd(12)} ${w.sourceLang}→${w.targetLang}  ${w.textCount} fields`);
    }
    translated = work.length;
  } else {
    // Process in parallel batches
    async function processItem(w: WorkItem): Promise<void> {
      const idx = `[${String(w.index + 1).padStart(3)}/${stocks.length}]`;
      try {
        const start = Date.now();
        const result = await translateStock(w.sections, w.sourceLang, w.targetLang);
        const elapsed = ((Date.now() - start) / 1000).toFixed(1);

        if (Object.keys(result).length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const updateData: any = {};
          for (const [key, val] of Object.entries(result)) {
            updateData[key] = val;
          }
          await prisma.stock.update({ where: { id: w.stock.id }, data: updateData });
          completed++;
          console.log(`${idx} ${w.stock.symbol.padEnd(12)} ${w.sourceLang}→${w.targetLang} ✓ ${Object.keys(result).length} sections (${elapsed}s) [${completed}/${work.length} done]`);
          translated++;
        } else {
          completed++;
          console.log(`${idx} ${w.stock.symbol.padEnd(12)} no translatable content [${completed}/${work.length} done]`);
          skipped++;
        }
      } catch (err) {
        completed++;
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`${idx} ${w.stock.symbol.padEnd(12)} FAILED: ${msg.slice(0, 100)} [${completed}/${work.length} done]`);
        failed++;
      }
    }

    // Concurrency pool
    let cursor = 0;
    async function worker() {
      while (cursor < work.length) {
        const item = work[cursor++];
        await processItem(item);
        // Small delay to avoid hammering the API
        await sleep(500);
      }
    }

    const workers = Array.from({ length: Math.min(concurrency, work.length) }, () => worker());
    await Promise.all(workers);
  }

  console.log(`\n=== Done ===`);
  console.log(`Translated: ${translated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${stocks.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
