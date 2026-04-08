/**
 * Populate All Stocks — Gemini 3.1 Pro Preview + google_search grounding
 *
 * Fetches accurate stock analysis data for all 8 sections and writes directly
 * to PostgreSQL via Prisma. No web UI needed.
 *
 * Usage:
 *   npx tsx scripts/populate-all-stocks.ts
 *   npx tsx scripts/populate-all-stocks.ts --only=CPALL
 *   npx tsx scripts/populate-all-stocks.ts --exchange=SET --force
 *   npx tsx scripts/populate-all-stocks.ts --dry
 *
 * Flags:
 *   --force          Re-generate even if stock already has AI data
 *   --only=SYMBOL    Process only this symbol
 *   --exchange=SET   Process only SET, NYSE, or NASDAQ stocks
 *   --dry            Preview what would be processed, don't call API
 *   --delay=5000     Delay between API calls in ms (default 3000)
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env from project root (no external dependency needed)
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
      // Strip surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // .env file not found — rely on existing env vars
  }
}
loadEnv();

const prisma = new PrismaClient();

// ── Config ───────────────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-pro-preview";

if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY not set in .env");
  process.exit(1);
}

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// ── CLI Argument Parsing ─────────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name: string): string | undefined {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split("=")[1] : undefined;
}
const hasFlag = (name: string) => args.includes(`--${name}`);

const FORCE = hasFlag("force");
const DRY = hasFlag("dry");
const DEBUG = hasFlag("debug");
const ONLY = getArg("only")?.toUpperCase();
const EXCHANGE = getArg("exchange")?.toUpperCase();
const DELAY = parseInt(getArg("delay") || "3000", 10);

// ── Company Domain Mapping (for Clearbit logos) ──────────────────────────────
const COMPANY_DOMAINS: Record<string, string> = {
  // ─── Thai Stocks (SET100) ───
  PTT: "pttplc.com",
  PTTEP: "pttep.com",
  TOP: "thaioilgroup.com",
  IRPC: "irpc.co.th",
  PTTGC: "pttgcgroup.com",
  GULF: "gulf.co.th",
  GPSC: "gpscgroup.com",
  OR: "pttor.com",
  BANPU: "banpu.com",
  BCP: "bangchak.co.th",
  RATCH: "ratch.co.th",
  EGCO: "egco.com",
  BGRIM: "bgrimmpower.com",
  SPRC: "sprc.co.th",
  EA: "energyabsolute.co.th",
  BCPG: "bcpggroup.com",
  GUNKUL: "gunkul.com",
  PTG: "ptgenergy.co.th",
  SCB: "scb.co.th",
  KBANK: "kasikornbank.com",
  BBL: "bangkokbank.com",
  KTB: "krungthai.com",
  TTB: "ttbbank.com",
  TISCO: "tisco.co.th",
  KKP: "kkpfg.com",
  KTC: "ktc.co.th",
  MTC: "muangthaicap.com",
  TCAP: "thanachartcapital.co.th",
  SAWAD: "srisawadpower.com",
  TLI: "thailife.com",
  BLA: "bangkoklife.com",
  TIDLOR: "tidlor.com",
  AEONTS: "aeon.co.th",
  BAM: "bam.co.th",
  ADVANC: "ais.th",
  TRUE: "true.th",
  DELTA: "deltathailand.com",
  HANA: "hanagroup.com",
  KCE: "kce.co.th",
  CCET: "calcomp.co.th",
  JTS: "jas.co.th",
  CPALL: "cpall.co.th",
  CPN: "centralpattana.co.th",
  CRC: "centralretail.com",
  HMPRO: "homepro.co.th",
  GLOBAL: "siamglobalhouse.com",
  DOHOME: "dohome.co.th",
  COM7: "com7.co.th",
  BJC: "bjc.co.th",
  MINT: "minor.com",
  CENTEL: "centarahotelsresorts.com",
  ERW: "theerawan.com",
  CPF: "cpfworldwide.com",
  TU: "thaiunion.com",
  TFG: "thaifoodsgroup.com",
  BTG: "betagro.com",
  OSP: "osotspa.com",
  CBG: "carabaogroup.com",
  M: "mkrestaurant.com",
  ICHI: "ichitangroup.com",
  GFPT: "gfpt.co.th",
  BDMS: "bdms.co.th",
  BH: "bumrungrad.com",
  BCH: "bangkokchainhospital.com",
  CHG: "chularat.com",
  PR9: "praram9.com",
  MEGA: "megawecare.com",
  SCC: "scg.com",
  SCGP: "scgpackaging.com",
  IVL: "indoramaventures.com",
  WHA: "wha-group.com",
  AMATA: "amata.com",
  TOA: "toagroup.com",
  STA: "sritranggroup.com",
  STGT: "sritranggloves.com",
  TASCO: "tipcoasphalt.com",
  CK: "ch-karnchang.co.th",
  AOT: "airportthai.co.th",
  BTS: "btsgroup.co.th",
  BEM: "bangkokmetro.co.th",
  BA: "bangkokair.com",
  AAV: "asiaaviation.com",
  RCL: "rclgroup.com",
  SJWD: "scgjwdlogistics.com",
  LH: "lh.co.th",
  SPALI: "supalai.com",
  AP: "apthai.com",
  SIRI: "sansiri.com",
  AWC: "assetworldcorp-th.com",
  QH: "qh.co.th",
  VGI: "vgigroup.com",
  PLANB: "planbmedia.co.th",
  JMT: "jmtnetwork.co.th",

  // ─── US Stocks ───
  AAPL: "apple.com",
  MSFT: "microsoft.com",
  GOOGL: "google.com",
  NVDA: "nvidia.com",
  META: "meta.com",
  AVGO: "broadcom.com",
  AMD: "amd.com",
  INTC: "intel.com",
  QCOM: "qualcomm.com",
  TXN: "ti.com",
  CRM: "salesforce.com",
  ORCL: "oracle.com",
  SAP: "sap.com",
  IBM: "ibm.com",
  CSCO: "cisco.com",
  HPQ: "hp.com",
  DELL: "dell.com",
  AMZN: "amazon.com",
  TSLA: "tesla.com",
  NFLX: "netflix.com",
  DIS: "disney.com",
  NKE: "nike.com",
  MCD: "mcdonalds.com",
  SBUX: "starbucks.com",
  "BRK-B": "berkshirehathaway.com",
  JPM: "jpmorganchase.com",
  BAC: "bankofamerica.com",
  WFC: "wellsfargo.com",
  GS: "goldmansachs.com",
  MS: "morganstanley.com",
  C: "citigroup.com",
  V: "visa.com",
  MA: "mastercard.com",
  AXP: "americanexpress.com",
  JNJ: "jnj.com",
  LLY: "lilly.com",
  ABBV: "abbvie.com",
  MRK: "merck.com",
  PFE: "pfizer.com",
  UNH: "unitedhealthgroup.com",
  AMGN: "amgen.com",
  WMT: "walmart.com",
  COST: "costco.com",
  HD: "homedepot.com",
  LOW: "lowes.com",
  TGT: "target.com",
  KO: "coca-cola.com",
  PEP: "pepsico.com",
  PG: "pg.com",
  PM: "pmi.com",
  CVX: "chevron.com",
  XOM: "exxonmobil.com",
  CAT: "caterpillar.com",
  GE: "geaerospace.com",
  RTX: "rtx.com",
  T: "att.com",
  VZ: "verizon.com",
};

// ── Analysis Schema (mirrors src/lib/typhoon.ts) ────────────────────────────
const ANALYSIS_SCHEMA = `{
  "coreBusiness": {
    "summary": "string — explain what the company does in 2-3 paragraphs",
    "businessUnits": [
      {"name": "string", "description": "string — brief description", "revenuePercentage": number, "color": "#hex"}
    ],
    "totalRevenue": "string — e.g. '150 billion THB' or '$50 billion'",
    "fiscalYear": "string — e.g. '2024'"
  },
  "customerBase": {
    "model": "string — e.g. 'B2B', 'B2C', 'B2B2C'",
    "description": "string — explain customer model in 1-2 paragraphs",
    "customerSegments": [
      {"name": "string", "percentage": number, "description": "string"}
    ],
    "stickiness": [
      {"factor": "string", "description": "string — why it's sticky", "strength": "high|medium|low"}
    ],
    "summary": "string — summarize customer base strength"
  },
  "revenueModel": {
    "revenueTypes": [
      {"type": "string — e.g. 'Recurring', 'Subscription', 'Backlog', 'One-Time', 'Transaction Fee'", "percentage": number, "description": "string", "color": "#hex"}
    ],
    "qualitySummary": "string — revenue quality summary",
    "revenueEvolution": "string — 1-2 paragraphs on future revenue direction",
    "keyMetrics": [{"label": "string", "value": "string"}]
  },
  "financials": {
    "years": ["2020", "2021", "2022", "2023", "2024"],
    "revenue": [number, number, number, number, number],
    "netProfit": [number, number, number, number, number],
    "operatingExpenses": [number, number, number, number, number],
    "cashOnHand": [number, number, number, number, number],
    "totalDebt": [number, number, number, number, number],
    "dividendYield": [number, number, number, number, number],
    "currency": "THB|USD",
    "unit": "million|billion",
    "keyTakeawayRatios": [
      {"name": "string", "value": "string", "explanation": "string", "relevance": "string — why this ratio matters for THIS specific business model"}
    ],
    "summary": "string — financial overview summary"
  },
  "sevenPowers": {
    "powers": [
      {"name": "Scale Economies", "level": "high|medium|low", "score": 1-5, "analysis": "string"},
      {"name": "Network Economies", "level": "high|medium|low", "score": 1-5, "analysis": "string"},
      {"name": "Counter-Positioning", "level": "high|medium|low", "score": 1-5, "analysis": "string"},
      {"name": "Switching Costs", "level": "high|medium|low", "score": 1-5, "analysis": "string"},
      {"name": "Branding", "level": "high|medium|low", "score": 1-5, "analysis": "string"},
      {"name": "Cornered Resource", "level": "high|medium|low", "score": 1-5, "analysis": "string"},
      {"name": "Process Power", "level": "high|medium|low", "score": 1-5, "analysis": "string"}
    ],
    "summary": "string — summarize strongest powers"
  },
  "storyAndSCurve": {
    "currentStory": "string — 2-3 paragraphs on company's growth narrative",
    "newSCurves": [
      {"title": "string", "description": "string", "potential": "high|medium|low"}
    ],
    "hiddenGems": [
      {"title": "string", "description": "string — things the market may not see yet"}
    ],
    "summary": "string"
  },
  "risks": {
    "risks": [
      {"title": "string", "severity": "high|medium|low", "description": "string", "mitigation": "string — how to mitigate or factors that could help"}
    ],
    "summary": "string — key risks summary"
  },
  "ceoProfile": {
    "name": "string — CEO name",
    "title": "string — CEO title",
    "background": "string — brief bio 1-2 paragraphs",
    "executionTrackRecord": [
      {"claim": "string — what CEO said/promised", "result": "string — what actually happened", "verdict": "delivered|partial|missed", "source": "string — e.g. 'Earnings Call Q3 2024'"}
    ],
    "earningsCallHighlights": ["string — key quotes from recent earnings calls"],
    "beatMissRecord": [
      {"metric": "string", "target": "string", "actual": "string", "verdict": "beat|meet|miss"}
    ],
    "summary": "string — summarize CEO execution quality"
  }
}`;

// ── Prompt Builder ───────────────────────────────────────────────────────────
function buildPrompt(symbol: string, companyName: string, isThai: boolean): string {
  const lang = isThai
    ? "Write the analysis in Thai language."
    : "Write the analysis in English.";

  return `You are "Khongbeng Strategist" — a world-class investment analyst with deep expertise in fundamental analysis, competitive strategy (Hamilton Helmer's 7 Powers), and CEO execution assessment.

Your stock analysis must be:
- Factual, data-driven, sourced from the latest annual reports (10-K / 56-1 One Report), earnings calls, and Investor Relations materials
- Written clearly and with insight — not generic
- Organized into exactly the 8 JSON fields below
${lang}

Analyze the stock: ${symbol} (${companyName})

Search for the most recent data from:
1. Annual report (10-K for US stocks, 56-1 One Report for Thai SET stocks)
2. Latest quarterly earnings and earnings call transcripts
3. Investor Relations materials and presentations
4. Financial statements for the past 5 years (2020-2024)
5. CEO statements and execution track record
6. Hamilton Helmer's 7 Powers framework applied to this company

Fill this exact JSON schema with real, accurate data:
${ANALYSIS_SCHEMA}

IMPORTANT:
- For coreBusiness.businessUnits colors, use: ["#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4", "#f97316"]
- For revenueModel.revenueTypes colors, use: ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444"]
- All financial numbers should be actual figures. Use the currency and unit appropriate for the stock's market.
- For 7 Powers: analyze ALL 7 powers. Score each from 1-5. Be honest — if a power is weak, say so.
- For CEO: reference specific earnings calls or reports where possible.
- keyTakeawayRatios should be business-model specific (e.g. subscription: Retention Rate, CAC/LTV; banks: NIM, NPL ratio)

Return ONLY the JSON object. No markdown fences, no explanations.`;
}

// ── Gemini API Call ──────────────────────────────────────────────────────────
async function callGemini(symbol: string, companyName: string, isThai: boolean): Promise<string> {
  const prompt = buildPrompt(symbol, companyName, isThai);

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    tools: [{ google_search: {} }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 16384,
    },
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120000), // 2 minute timeout
  });

  if (res.status === 429) {
    throw new Error("RATE_LIMITED");
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API ${res.status}: ${errText.substring(0, 500)}`);
  }

  const data = await res.json();

  // Debug: log if no candidates
  if (!data.candidates || data.candidates.length === 0) {
    const feedback = data.promptFeedback ? JSON.stringify(data.promptFeedback) : "no feedback";
    throw new Error(`No candidates returned. Feedback: ${feedback}`);
  }

  // Extract text parts from response (skip grounding metadata parts)
  const textParts = data.candidates?.[0]?.content?.parts?.filter(
    (p: { text?: string }) => p.text
  );
  const text = textParts?.map((p: { text: string }) => p.text).join("") || "{}";

  // Debug: dump raw response to file
  if (DEBUG) {
    const { writeFileSync } = await import("fs");
    writeFileSync(`scripts/debug-${symbol}.txt`, text, "utf-8");
    console.log(`\n  [debug] Raw response saved to scripts/debug-${symbol}.txt`);
  }

  return text;
}

// ── JSON Parser with cleanup ─────────────────────────────────────────────────
function parseJSON(text: string): Record<string, unknown> {
  // Strategy 1: Extract JSON from markdown fences
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  let clean = fenceMatch ? fenceMatch[1].trim() : text.trim();

  // Strategy 2: If text has preamble/postamble, find the outermost { ... }
  if (!clean.startsWith("{")) {
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start !== -1 && end > start) {
      clean = clean.substring(start, end + 1);
    }
  }

  // Strategy 3: Fix common JSON issues
  // Remove single-line comments (// ...)
  clean = clean.replace(/\/\/[^\n]*/g, "");
  // Remove multi-line comments
  clean = clean.replace(/\/\*[\s\S]*?\*\//g, "");
  // Remove trailing commas before } or ]
  clean = clean.replace(/,\s*([}\]])/g, "$1");

  try {
    return JSON.parse(clean);
  } catch {
    // Strategy 4: Try fixing unquoted property names
    const fixed = clean.replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');
    try {
      return JSON.parse(fixed);
    } catch (e) {
      throw new Error(`JSON parse failed: ${(e as Error).message}\nFirst 200 chars: ${clean.substring(0, 200)}`);
    }
  }
}

// ── Logo Resolution ──────────────────────────────────────────────────────────
function resolveLogoUrl(symbol: string): string | null {
  const domain = COMPANY_DOMAINS[symbol];
  if (!domain) return null;
  // Clearbit logo API — deterministic URL, no verification needed
  // Frontend handles 404 with fallback placeholder
  return `https://logo.clearbit.com/${domain}`;
}

// ── Sleep helper ─────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Section counter ──────────────────────────────────────────────────────────
const SECTION_KEYS = [
  "coreBusiness",
  "customerBase",
  "revenueModel",
  "financials",
  "sevenPowers",
  "storyAndSCurve",
  "risks",
  "ceoProfile",
] as const;

function countFilledSections(parsed: Record<string, unknown>): number {
  return SECTION_KEYS.filter((k) => {
    const val = parsed[k];
    return val && typeof val === "object" && Object.keys(val as object).length > 0;
  }).length;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n═══════════════════════════════════════════════════");
  console.log("  Khongbeng Strategist — Stock Data Population");
  console.log("═══════════════════════════════════════════════════");
  console.log(`  Model:    ${GEMINI_MODEL}`);
  console.log(`  Delay:    ${DELAY}ms between calls`);
  console.log(`  Force:    ${FORCE}`);
  console.log(`  Only:     ${ONLY || "all"}`);
  console.log(`  Exchange: ${EXCHANGE || "all"}`);
  console.log(`  Dry run:  ${DRY}`);
  console.log("═══════════════════════════════════════════════════\n");

  // Query stocks from DB
  const where: Record<string, unknown> = {};
  if (ONLY) where.symbol = ONLY;
  if (EXCHANGE) where.exchange = EXCHANGE;

  const stocks = await prisma.stock.findMany({
    where,
    orderBy: { symbol: "asc" },
    select: {
      id: true,
      symbol: true,
      name: true,
      exchange: true,
      coreBusiness: true,
    },
  });

  if (stocks.length === 0) {
    console.log("❌ No stocks found matching criteria. Run seed first:\n   npx tsx scripts/seed-stocks.ts\n");
    return;
  }

  // Filter out already-populated stocks (unless --force)
  const toProcess = FORCE
    ? stocks
    : stocks.filter((s) => !s.coreBusiness);

  const setCount = toProcess.filter((s) => s.exchange === "SET").length;
  const usCount = toProcess.length - setCount;

  console.log(
    `🚀 Starting: ${toProcess.length} stocks to process (${setCount} SET + ${usCount} US)` +
      (stocks.length !== toProcess.length
        ? ` — skipping ${stocks.length - toProcess.length} already populated`
        : "")
  );
  console.log("");

  if (DRY) {
    console.log("📋 Dry run — stocks that would be processed:\n");
    toProcess.forEach((s, i) =>
      console.log(`  [${String(i + 1).padStart(3)}] ${s.symbol.padEnd(8)} ${s.exchange.padEnd(7)} ${s.name}`)
    );
    console.log(`\nTotal: ${toProcess.length} stocks. Run without --dry to execute.\n`);
    return;
  }

  let succeeded = 0;
  let failed = 0;
  const failures: string[] = [];

  for (let i = 0; i < toProcess.length; i++) {
    const stock = toProcess[i];
    const idx = `[${String(i + 1).padStart(3)}/${toProcess.length}]`;
    const isThai = stock.exchange === "SET";
    const startTime = Date.now();

    process.stdout.write(`${idx} ${stock.symbol.padEnd(10)} `);

    let retries = 0;
    const MAX_RETRIES = 3;

    while (retries <= MAX_RETRIES) {
      try {
        // 1. Call Gemini
        const rawText = await callGemini(stock.symbol, stock.name, isThai);

        // 2. Parse JSON
        const parsed = parseJSON(rawText);
        const filledCount = countFilledSections(parsed);

        // 3. Resolve logo
        const logoUrl = resolveLogoUrl(stock.symbol);

        // 4. Write to DB
        await prisma.stock.update({
          where: { id: stock.id },
          data: {
            coreBusiness: parsed.coreBusiness ? JSON.stringify(parsed.coreBusiness) : null,
            customerBase: parsed.customerBase ? JSON.stringify(parsed.customerBase) : null,
            revenueModel: parsed.revenueModel ? JSON.stringify(parsed.revenueModel) : null,
            financials: parsed.financials ? JSON.stringify(parsed.financials) : null,
            sevenPowers: parsed.sevenPowers ? JSON.stringify(parsed.sevenPowers) : null,
            storyAndSCurve: parsed.storyAndSCurve ? JSON.stringify(parsed.storyAndSCurve) : null,
            risks: parsed.risks ? JSON.stringify(parsed.risks) : null,
            ceoProfile: parsed.ceoProfile ? JSON.stringify(parsed.ceoProfile) : null,
            logoUrl: logoUrl,
            isPublished: true,
          },
        });

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const logoStatus = logoUrl ? " + logo" : "";
        const retryNote = retries > 0 ? ` [retry ${retries}]` : "";

        if (filledCount === 8) {
          console.log(`✅ ${filledCount}/8 sections${logoStatus} (${elapsed}s)${retryNote}`);
        } else {
          const missing = SECTION_KEYS.filter(
            (k) => !parsed[k] || Object.keys(parsed[k] as object).length === 0
          );
          console.log(
            `⚠️  ${filledCount}/8 (missing: ${missing.join(", ")})${logoStatus} (${elapsed}s)${retryNote}`
          );
        }

        succeeded++;
        break; // Success — exit retry loop

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);

        if (msg === "RATE_LIMITED" && retries < MAX_RETRIES) {
          process.stdout.write("⏳ Rate limited, waiting 60s... ");
          await sleep(60000);
          retries++;
          continue;
        }

        if (msg.startsWith("Gemini API 5") && retries < MAX_RETRIES) {
          process.stdout.write("🔄 Server error, retrying in 10s... ");
          await sleep(10000);
          retries++;
          continue;
        }

        if (msg.includes("JSON") && retries < MAX_RETRIES) {
          process.stdout.write("🔄 JSON parse error, retrying... ");
          await sleep(3000);
          retries++;
          continue;
        }

        // Final failure
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`❌ Failed (${elapsed}s): ${msg.substring(0, 200)}`);
        failed++;
        failures.push(stock.symbol);
        break;
      }
    }

    // Delay between calls (skip on last stock)
    if (i < toProcess.length - 1) {
      await sleep(DELAY);
    }
  }

  // Summary
  console.log("\n═══════════════════════════════════════════════════");
  console.log(`✅ Done! ${succeeded}/${toProcess.length} succeeded, ${failed} failed`);
  if (failures.length > 0) {
    console.log(`❌ Failed: [${failures.join(", ")}]`);
    console.log(`   Re-run with: npx tsx scripts/populate-all-stocks.ts --only=${failures[0]} --force`);
  }
  console.log("═══════════════════════════════════════════════════\n");
}

main()
  .catch((e) => {
    console.error("💥 Fatal error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
