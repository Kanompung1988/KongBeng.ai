/**
 * Use Gemini AI to find official website domains for stocks without logos,
 * then fetch the best available logo (Clearbit > Google favicon).
 *
 * Strategy:
 *   1. Query DB for stocks where logoUrl is null (or use --overwrite flag to redo all)
 *   2. Ask Gemini for each company's official website domain
 *   3. Try Clearbit logo first (high-quality PNG) — verify with HEAD request
 *   4. Fall back to Google favicon @ 128px if Clearbit has no entry
 *   5. Save the working URL to DB
 *
 * Usage:
 *   npx tsx scripts/gemini-logo-finder.ts
 *   npx tsx scripts/gemini-logo-finder.ts --exchange SET
 *   npx tsx scripts/gemini-logo-finder.ts --exchange US
 *   npx tsx scripts/gemini-logo-finder.ts --limit 50
 *   npx tsx scripts/gemini-logo-finder.ts --overwrite    (re-process stocks that already have logos)
 *   npx tsx scripts/gemini-logo-finder.ts --dry-run      (preview without saving to DB)
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { resolve } from "path";

// ─── Load .env ───────────────────────────────────────────────────────────────
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

const prisma = new PrismaClient();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Gemini: Find company domain ─────────────────────────────────────────────
async function callGemini(prompt: string, useGrounding: boolean): Promise<string | null> {
  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 256 },
  };
  if (useGrounding) {
    body.tools = [{ google_search: {} }];
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) return null;
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
}

async function askGeminiForDomain(
  symbol: string,
  name: string,
  exchange: string
): Promise<string | null> {
  const isThaiStock = exchange === "SET";

  const prompt = isThaiStock
    ? `บริษัท "${name}" (ชื่อย่อหุ้น: ${symbol} ตลาดหลักทรัพย์ SET ประเทศไทย)
มีเว็บไซต์ทางการที่ domain อะไร?
ตอบเฉพาะ domain เช่น "example.co.th" เท่านั้น ห้ามมี https:// หรือ www. หรือ / หรือคำอธิบาย`
    : `The company "${name}" (ticker: ${symbol}, exchange: ${exchange})
What is their official website domain?
Reply with ONLY the domain like "example.com" — no https://, no www., no slash, no explanation.`;

  try {
    // Try with Google Search grounding first (better for obscure companies)
    let raw = await callGemini(prompt, true);

    // Fallback: retry without grounding if it failed
    if (!raw) {
      await sleep(500);
      raw = await callGemini(prompt, false);
    }

    if (!raw) return null;

    // Extract domain: strip protocol, www, paths, whitespace
    const domain = raw
      .toLowerCase()
      .replace(/^(https?:\/\/)?(www\.)?/, "")
      .replace(/[/\s?#].*$/, "")
      .replace(/['"]/g, "")
      .trim();

    // Basic validation: must have at least one dot and no spaces
    if (!domain.includes(".") || domain.includes(" ")) return null;

    return domain;
  } catch (e) {
    console.error(`Gemini fetch error: ${e}`);
    return null;
  }
}

// ─── Verify a URL actually returns an image ──────────────────────────────────
async function verifyImageUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!res.ok) return false;
    const ct = res.headers.get("content-type") ?? "";
    return ct.startsWith("image/");
  } catch {
    return false;
  }
}

// ─── Find best logo URL for a domain ─────────────────────────────────────────
async function getBestLogoUrl(domain: string): Promise<{ url: string; source: string } | null> {
  // 1. Try Clearbit (high-quality logo PNG)
  const clearbitUrl = `https://logo.clearbit.com/${domain}`;
  if (await verifyImageUrl(clearbitUrl)) {
    return { url: clearbitUrl, source: "clearbit" };
  }

  // 2. Fall back to Google favicon @ 128px (no verification — always returns something)
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  return { url: faviconUrl, source: "google-favicon" };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!GEMINI_API_KEY) {
    console.error("❌  GEMINI_API_KEY not set in .env");
    process.exit(1);
  }

  // Parse CLI args
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : null;
  };
  const has = (flag: string) => args.includes(flag);

  const exchangeFilter = get("--exchange");
  const limitArg = get("--limit");
  const overwrite = has("--overwrite");
  const dryRun = has("--dry-run");
  const limit = limitArg ? parseInt(limitArg) : undefined;

  console.log(`\n🔍  Gemini Logo Finder`);
  console.log(`    Model  : ${GEMINI_MODEL}`);
  console.log(`    Filter : exchange=${exchangeFilter ?? "all"}, limit=${limit ?? "none"}`);
  console.log(`    Mode   : ${dryRun ? "dry-run (no DB writes)" : "live"}, overwrite=${overwrite}\n`);

  // Fetch stocks to process
  const stocks = await prisma.stock.findMany({
    where: {
      ...(exchangeFilter ? { exchange: exchangeFilter } : {}),
      ...(overwrite ? {} : { logoUrl: null }),
    },
    select: { id: true, symbol: true, name: true, exchange: true, logoUrl: true },
    orderBy: { symbol: "asc" },
    take: limit,
  });

  if (stocks.length === 0) {
    console.log("✅  No stocks to process (all have logos). Use --overwrite to re-process.");
    return;
  }

  console.log(`📋  ${stocks.length} stocks to process\n`);

  let updated = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < stocks.length; i++) {
    const s = stocks[i];
    const idx = `[${String(i + 1).padStart(3)}/${stocks.length}]`;
    const label = `${s.symbol.padEnd(12)} ${s.name.substring(0, 35).padEnd(37)}`;

    process.stdout.write(`${idx} ${label}`);

    // Ask Gemini for the domain
    const domain = await askGeminiForDomain(s.symbol, s.name, s.exchange);

    if (!domain) {
      console.log("✗  no domain");
      failed++;
      await sleep(800);
      continue;
    }

    // Get best logo
    const logo = await getBestLogoUrl(domain);

    if (!logo) {
      console.log(`✗  domain=${domain} — no logo found`);
      failed++;
      await sleep(800);
      continue;
    }

    if (dryRun) {
      console.log(`[dry-run] → ${domain}  (${logo.source})`);
      skipped++;
    } else {
      await prisma.stock.update({
        where: { id: s.id },
        data: { logoUrl: logo.url },
      });
      console.log(`✓  ${domain}  [${logo.source}]`);
      updated++;
    }

    // Rate limit: 1 request/sec for Gemini free tier safety
    if (i < stocks.length - 1) {
      await sleep(1100);
    }
  }

  // Final summary
  const totalWithLogo = await prisma.stock.count({ where: { logoUrl: { not: null } } });
  const totalMissing = await prisma.stock.count({ where: { logoUrl: null } });
  const total = await prisma.stock.count();

  console.log(`\n${"─".repeat(60)}`);
  console.log(`✅  Done`);
  console.log(`    Updated  : ${updated}`);
  console.log(`    Failed   : ${failed}`);
  if (dryRun) console.log(`    Dry-run  : ${skipped}`);
  console.log(`\n    DB status: ${totalWithLogo}/${total} have logos (${totalMissing} still missing)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
