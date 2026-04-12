#!/usr/bin/env tsx
/**
 * Master script: seed ALL index member stocks into DB + sync marketIndexes
 *
 * Strategy:
 *  1. Scrape Wikipedia for S&P 500 / Nasdaq 100 / Dow Jones → get name + sector + exchange
 *  2. For remaining (Thai + missing US), use Yahoo Finance quote → get name + exchange
 *  3. Create missing stocks in DB
 *  4. Sync marketIndexes for all stocks
 *
 * Usage:
 *   npx tsx scripts/seed-all-index-stocks.ts              # full run
 *   npx tsx scripts/seed-all-index-stocks.ts --dry-run     # preview only
 *   npx tsx scripts/seed-all-index-stocks.ts --delay=2000  # custom delay between Yahoo calls (ms)
 */

import { PrismaClient } from "@prisma/client";
import YahooFinance from "yahoo-finance2";
import * as cheerio from "cheerio";
import { INDEX_MEMBERS, getIndexesForSymbol } from "../src/lib/constants/index-members";
import { getLogoUrl } from "../src/lib/logo";

const prisma = new PrismaClient();
const yahoo = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const DRY_RUN = process.argv.includes("--dry-run");
const DELAY = parseInt(process.argv.find((a) => a.startsWith("--delay="))?.split("=")[1] || "1200");

// ── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

interface StockMeta {
  symbol: string;
  name: string;
  sector: string;
  exchange: string;
  logoUrl: string | null;
}

// ── Phase 1: Scrape Wikipedia for US stock metadata ─────────────────────────

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "KongbengBot/1.0 (stock-seed)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.text();
}

function normalizeSymbol(sym: string): string {
  return sym.trim().replace(/\./g, "-").toUpperCase();
}

async function scrapeWikipediaStocks(): Promise<Map<string, StockMeta>> {
  const metaMap = new Map<string, StockMeta>();

  // ── S&P 500: columns = Symbol | Security | GICS Sector | ...
  console.log("  Scraping S&P 500 from Wikipedia...");
  try {
    const html = await fetchPage("https://en.wikipedia.org/wiki/List_of_S%26P_500_companies");
    const $ = cheerio.load(html);
    $("table.wikitable").first().find("tbody tr").each((_, row) => {
      const cells = $(row).find("td");
      if (cells.length >= 4) {
        const symbol = normalizeSymbol($(cells[0]).text());
        const name = $(cells[1]).text().trim();
        const sector = $(cells[2]).text().trim() || "Other";
        if (symbol && name) {
          metaMap.set(symbol, { symbol, name, sector, exchange: "NYSE", logoUrl: null });
        }
      }
    });
    console.log(`    → ${metaMap.size} stocks`);
  } catch (e) {
    console.error("    Failed to scrape S&P 500:", e);
  }

  // ── Nasdaq 100: columns = Company | Ticker | GICS Sector | GICS Sub-Industry
  console.log("  Scraping Nasdaq 100 from Wikipedia...");
  try {
    const html = await fetchPage("https://en.wikipedia.org/wiki/Nasdaq-100");
    const $ = cheerio.load(html);
    $("table.wikitable.sortable").first().find("tbody tr").each((_, row) => {
      const cells = $(row).find("td");
      if (cells.length >= 3) {
        const name = $(cells[0]).text().trim();
        const symbol = normalizeSymbol($(cells[1]).text());
        const sector = $(cells[2]).text().trim() || "Other";
        if (symbol && name && /^[A-Z]/.test(symbol)) {
          // Override exchange to NASDAQ for these
          metaMap.set(symbol, { symbol, name, sector, exchange: "NASDAQ", logoUrl: null });
        }
      }
    });
    console.log(`    → total US meta: ${metaMap.size}`);
  } catch (e) {
    console.error("    Failed to scrape Nasdaq 100:", e);
  }

  // ── Dow Jones: row = <th>Company</th><td>Exchange</td><td>Symbol</td><td>Sector</td>...
  console.log("  Scraping Dow Jones from Wikipedia...");
  try {
    const html = await fetchPage("https://en.wikipedia.org/wiki/Dow_Jones_Industrial_Average");
    const $ = cheerio.load(html);
    $("table.wikitable").first().find("tbody tr").each((_, row) => {
      const th = $(row).find("th").first().text().trim();
      const cells = $(row).find("td");
      if (cells.length >= 3 && th) {
        const exchangeRaw = $(cells[0]).text().trim();
        const symbol = normalizeSymbol($(cells[1]).text());
        const sector = $(cells[2]).text().trim() || "Other";
        const exchange = exchangeRaw === "NASDAQ" ? "NASDAQ" : "NYSE";
        if (symbol && /^[A-Z]/.test(symbol)) {
          // Don't override if already exists with richer data
          if (!metaMap.has(symbol)) {
            metaMap.set(symbol, { symbol, name: th, sector, exchange, logoUrl: null });
          }
        }
      }
    });
    console.log(`    → total US meta: ${metaMap.size}`);
  } catch (e) {
    console.error("    Failed to scrape Dow Jones:", e);
  }

  // Set logo URLs
  for (const [sym, meta] of metaMap) {
    meta.logoUrl = getLogoUrl(sym, meta.exchange);
  }

  return metaMap;
}

// ── Phase 2: Yahoo Finance for Thai stocks + US stocks not in Wikipedia ─────

async function fetchYahooMeta(symbol: string, exchange: string): Promise<StockMeta | null> {
  const yahooSym = exchange === "SET" ? `${symbol}.BK` : symbol;
  try {
    const quote = await yahoo.quote(yahooSym) as Record<string, unknown>;
    const name = (quote.longName as string) || (quote.shortName as string) || symbol;

    // Determine correct exchange from Yahoo data
    const yahooExch = (quote.exchange as string) || "";
    let detectedExchange = exchange;
    if (yahooExch === "BKK" || yahooExch === "SET") detectedExchange = "SET";
    else if (["NMS", "NGM", "NCM"].includes(yahooExch)) detectedExchange = "NASDAQ";
    else if (["NYQ", "NYS"].includes(yahooExch)) detectedExchange = "NYSE";

    return {
      symbol,
      name,
      sector: "Other", // quote() doesn't return sector, would need quoteSummary
      exchange: detectedExchange,
      logoUrl: getLogoUrl(symbol, detectedExchange),
    };
  } catch {
    return null;
  }
}

// Try quoteSummary for sector (slower, use sparingly)
async function fetchSector(symbol: string, exchange: string): Promise<string | null> {
  const yahooSym = exchange === "SET" ? `${symbol}.BK` : symbol;
  try {
    const summary = await yahoo.quoteSummary(yahooSym, { modules: ["assetProfile"] }) as Record<string, unknown>;
    const profile = summary.assetProfile as Record<string, unknown> | undefined;
    return (profile?.sector as string) || null;
  } catch {
    return null;
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(DRY_RUN ? "=== DRY RUN ===" : "=== Seeding all index stocks ===");
  console.log(`Yahoo call delay: ${DELAY}ms\n`);

  // Step 1: Collect all unique symbols
  const allSymbols = new Set<string>();
  for (const [indexName, members] of Object.entries(INDEX_MEMBERS)) {
    for (const sym of members) allSymbols.add(sym);
    console.log(`  ${indexName}: ${members.length} members`);
  }
  console.log(`  Total unique: ${allSymbols.size}\n`);

  // Step 2: Check DB
  const existingStocks = await prisma.stock.findMany({ select: { symbol: true } });
  const existingSymbols = new Set(existingStocks.map((s) => s.symbol));
  const missing = [...allSymbols].filter((s) => !existingSymbols.has(s));
  console.log(`  Already in DB: ${existingSymbols.size}`);
  console.log(`  Missing: ${missing.length}\n`);

  if (missing.length === 0) {
    console.log("All stocks already in DB!\n");
  } else {
    // Step 3: Get Wikipedia metadata (fast, no rate limit)
    console.log("Phase 1: Scraping Wikipedia for US stock metadata...\n");
    const wikiMeta = await scrapeWikipediaStocks();

    // Step 4: For missing stocks, check Wikipedia first, then Yahoo
    console.log(`\nPhase 2: Creating ${missing.length} stocks...\n`);

    let created = 0;
    let failed = 0;
    let yahooCallCount = 0;

    for (let i = 0; i < missing.length; i++) {
      const symbol = missing[i];
      const progress = `[${i + 1}/${missing.length}]`;

      // Try Wikipedia first
      let meta = wikiMeta.get(symbol) || null;

      // If not in Wikipedia, use Yahoo
      if (!meta) {
        const isThai = ["SET50", "SET100", "MAI", "sSet"].some((idx) => INDEX_MEMBERS[idx]?.includes(symbol));
        const exchange = isThai ? "SET" : "NYSE";

        // Rate limit delay before Yahoo call
        if (yahooCallCount > 0) await sleep(DELAY);
        meta = await fetchYahooMeta(symbol, exchange);
        yahooCallCount++;

        // Try to get sector too (with extra delay)
        if (meta && meta.sector === "Other") {
          await sleep(DELAY);
          const sector = await fetchSector(symbol, meta.exchange);
          if (sector) meta.sector = sector;
          yahooCallCount++;
        }
      }

      if (meta) {
        if (!DRY_RUN) {
          try {
            await prisma.stock.create({
              data: {
                symbol: meta.symbol,
                name: meta.name,
                sector: meta.sector,
                exchange: meta.exchange,
                logoUrl: meta.logoUrl,
                isPublished: false,
              },
            });
            created++;
          } catch (err) {
            console.warn(`  ${progress} ⚠ DB error: ${err instanceof Error ? err.message : err}`);
            failed++;
            continue;
          }
        } else {
          created++;
        }
        const src = wikiMeta.has(symbol) ? "wiki" : "yahoo";
        console.log(`  ${progress} ✓ ${meta.symbol} — ${meta.name.substring(0, 40)} (${meta.exchange}, ${meta.sector}) [${src}]`);
      } else {
        // Last resort fallback
        const isThai = ["SET50", "SET100", "MAI", "sSet"].some((idx) => INDEX_MEMBERS[idx]?.includes(symbol));
        if (!DRY_RUN) {
          try {
            await prisma.stock.create({
              data: { symbol, name: symbol, sector: "Other", exchange: isThai ? "SET" : "NYSE", isPublished: false },
            });
            created++;
          } catch {
            failed++;
            continue;
          }
        }
        console.log(`  ${progress} ~ ${symbol} — (fallback, no data found)`);
        created++;
      }
    }

    console.log(`\n  Created: ${created}, Failed: ${failed}, Yahoo calls: ${yahooCallCount}\n`);
  }

  // Step 5: Sync marketIndexes for ALL stocks
  console.log("=== Phase 3: Syncing marketIndexes ===\n");

  const allStocks = await prisma.stock.findMany({
    select: { id: true, symbol: true, exchange: true, marketIndexes: true },
  });

  let updated = 0;
  for (const stock of allStocks) {
    const detected = getIndexesForSymbol(stock.symbol, stock.exchange);
    const current = stock.marketIndexes || [];
    const same = detected.length === current.length && detected.every((idx) => current.includes(idx));

    if (!same) {
      if (!DRY_RUN) {
        await prisma.stock.update({
          where: { id: stock.id },
          data: { marketIndexes: detected },
        });
      }
      updated++;
    }
  }

  console.log(`  Updated: ${updated}, Total stocks: ${allStocks.length}`);
  console.log("\n=== DONE ===");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
