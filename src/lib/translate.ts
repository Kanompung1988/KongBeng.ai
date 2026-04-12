// Translation utility for stock analysis content
// Extracts text fields from section JSON, sends to Typhoon for translation,
// and merges translated fields back with Th/En suffix.

import OpenAI from "openai";

function getClient() {
  return new OpenAI({
    apiKey: process.env.TYPHOON_API_KEY!,
    baseURL: "https://api.opentyphoon.ai/v1",
  });
}

const TYPHOON_MODEL = "typhoon-v2.5-30b-a3b-instruct";

// Field specs: which text fields to translate per section
interface FieldSpec {
  field: string;
  arrayKey?: string; // if inside an array, the parent array field name
}

const SECTION_FIELDS: Record<string, FieldSpec[]> = {
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
    // earningsCallHighlights handled separately (string[])
  ],
};

// Extract all translatable text fields from a section into a flat map
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

  // Special: earningsCallHighlights (string[])
  if (sectionKey === "ceoProfile" && Array.isArray(data.earningsCallHighlights)) {
    data.earningsCallHighlights.forEach((h: string, i: number) => {
      if (h) texts[`earningsCallHighlights.${i}`] = h;
    });
  }

  return texts;
}

// Merge translated texts back into the section data with suffix
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mergeTranslations(sectionKey: string, data: any, translations: Record<string, string>, suffix: "Th" | "En"): any {
  const result = JSON.parse(JSON.stringify(data)); // deep clone

  for (const [key, value] of Object.entries(translations)) {
    if (!value) continue;

    const parts = key.split(".");
    if (parts.length === 1) {
      // Top-level field: summary → summaryTh
      result[parts[0] + suffix] = value;
    } else if (parts.length === 3) {
      // Array field: businessUnits.0.name → businessUnits[0].nameTh
      const [arrKey, idxStr, field] = parts;
      const idx = parseInt(idxStr, 10);
      if (Array.isArray(result[arrKey]) && result[arrKey][idx]) {
        result[arrKey][idx][field + suffix] = value;
      }
    } else if (parts.length === 2 && parts[0] === "earningsCallHighlights") {
      // earningsCallHighlights.0 → earningsCallHighlightsTh[0]
      if (!result["earningsCallHighlights" + suffix]) {
        result["earningsCallHighlights" + suffix] = [...(result.earningsCallHighlights || [])];
      }
      const idx = parseInt(parts[1], 10);
      result["earningsCallHighlights" + suffix][idx] = value;
    }
  }

  return result;
}

// Translate all 8 sections of a stock in a single API call
export async function translateStock(
  sections: Record<string, string | null>,
  sourceLang: "th" | "en",
  targetLang: "th" | "en"
): Promise<Record<string, string>> {
  const suffix = targetLang === "th" ? "Th" : "En";
  const langNames = { th: "Thai", en: "English" };

  // Extract texts from all sections
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
    } catch {
      // skip unparseable sections
    }
  }

  if (Object.keys(allTexts).length === 0) {
    return {};
  }

  // Send to Typhoon for translation
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
    throw new Error(`Failed to parse translation response: ${clean.slice(0, 200)}`);
  }

  // Merge translations back into each section
  const result: Record<string, string> = {};

  for (const sectionKey of sectionKeys) {
    const raw = sections[sectionKey];
    if (!raw) continue;

    try {
      let data = JSON.parse(raw);

      // Collect translations for this section
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
    } catch {
      // skip
    }
  }

  return result;
}

// Check if a section already has translations for a target language
export function hasTranslation(raw: string | null, targetLang: "th" | "en"): boolean {
  if (!raw) return false;
  const suffix = targetLang === "th" ? "Th" : "En";
  try {
    const data = JSON.parse(raw);
    // Check if summaryTh/summaryEn exists (common to most sections)
    if (data["summary" + suffix]) return true;
    // Check coreBusiness-specific
    if (data["currentStory" + suffix]) return true;
    if (data["background" + suffix]) return true;
    if (data["qualitySummary" + suffix]) return true;
    if (data["description" + suffix]) return true;
    return false;
  } catch {
    return false;
  }
}
