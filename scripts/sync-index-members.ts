#!/usr/bin/env tsx
/**
 * Sync US index membership data from Wikipedia
 * Usage: npx tsx scripts/sync-index-members.ts [--dry-run]
 *
 * Scrapes S&P 500, Nasdaq 100, and Dow Jones constituent lists from Wikipedia.
 * Thai index data is preserved as-is (update manually from SET website).
 */

import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";

const DRY_RUN = process.argv.includes("--dry-run");

const WIKIPEDIA_URLS: Record<string, string> = {
  SP500: "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies",
  NASDAQ100: "https://en.wikipedia.org/wiki/Nasdaq-100",
  DOW_JONES: "https://en.wikipedia.org/wiki/Dow_Jones_Industrial_Average",
};

// Minimum expected counts to detect parsing failures
const MIN_EXPECTED: Record<string, number> = {
  SP500: 400,
  NASDAQ100: 90,
  DOW_JONES: 25,
};

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "KongbengBot/1.0 (index-sync-script)" },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

function normalizeSymbol(sym: string): string {
  return sym.trim().replace(/\./g, "-").toUpperCase();
}

async function scrapeSP500(): Promise<string[]> {
  console.log("Scraping S&P 500...");
  const html = await fetchPage(WIKIPEDIA_URLS.SP500);
  const $ = cheerio.load(html);

  const symbols: string[] = [];
  // First wikitable on the page is the constituents table
  $("table.wikitable").first().find("tbody tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length > 0) {
      const sym = $(cells[0]).text().trim();
      if (sym) symbols.push(normalizeSymbol(sym));
    }
  });

  return [...new Set(symbols)].sort();
}

async function scrapeNasdaq100(): Promise<string[]> {
  console.log("Scraping Nasdaq 100...");
  const html = await fetchPage(WIKIPEDIA_URLS.NASDAQ100);
  const $ = cheerio.load(html);

  const symbols: string[] = [];
  // Look for the sortable wikitable with ticker data
  $("table.wikitable.sortable").first().find("tbody tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length >= 2) {
      // Ticker is typically in the second column
      const sym = $(cells[1]).text().trim();
      if (sym && /^[A-Z]/.test(sym)) symbols.push(normalizeSymbol(sym));
    }
  });

  // Fallback: try first column if second didn't work
  if (symbols.length < MIN_EXPECTED.NASDAQ100) {
    symbols.length = 0;
    $("table.wikitable.sortable").first().find("tbody tr").each((_, row) => {
      const cells = $(row).find("td");
      if (cells.length > 0) {
        const sym = $(cells[0]).text().trim();
        if (sym && /^[A-Z]/.test(sym)) symbols.push(normalizeSymbol(sym));
      }
    });
  }

  return [...new Set(symbols)].sort();
}

async function scrapeDowJones(): Promise<string[]> {
  console.log("Scraping Dow Jones...");
  const html = await fetchPage(WIKIPEDIA_URLS.DOW_JONES);
  const $ = cheerio.load(html);

  const symbols: string[] = [];
  // Each row: <th>Company</th><td>Exchange</td><td>Symbol</td><td>Sector</td>...
  // Symbol is in td[1] (second td column)
  $("table.wikitable").first().find("tbody tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length >= 2) {
      const sym = $(cells[1]).text().trim();
      if (sym && /^[A-Z]/.test(sym)) symbols.push(normalizeSymbol(sym));
    }
  });

  return [...new Set(symbols)].sort();
}

// Read existing Thai data from the current file
function readExistingThaiData(): Record<string, string[]> {
  const filePath = path.resolve(__dirname, "../src/lib/constants/index-members.ts");
  try {
    const content = fs.readFileSync(filePath, "utf-8");

    const extractArray = (varName: string): string[] => {
      const regex = new RegExp(`const ${varName}:\\s*string\\[\\]\\s*=\\s*\\[([^\\]]+)\\]`, "s");
      const match = content.match(regex);
      if (!match) return [];
      return match[1]
        .split(",")
        .map((s) => s.trim().replace(/"/g, "").replace(/'/g, ""))
        .filter(Boolean);
    };

    return {
      SET50: extractArray("SET50"),
      SET100: extractArray("SET100"),
      MAI: extractArray("MAI"),
      SSET: extractArray("SSET"),
    };
  } catch {
    console.warn("Could not read existing file, using empty Thai data.");
    return { SET50: [], SET100: [], MAI: [], SSET: [] };
  }
}

function generateFileContent(
  us: Record<string, string[]>,
  thai: Record<string, string[]>,
): string {
  const formatArray = (arr: string[], indent = 2): string => {
    if (arr.length === 0) return "[]";
    const lines: string[] = [];
    for (let i = 0; i < arr.length; i += 14) {
      const chunk = arr.slice(i, i + 14).map((s) => `"${s}"`).join(",");
      lines.push(" ".repeat(indent) + chunk + ",");
    }
    return `[\n${lines.join("\n")}\n]`;
  };

  const today = new Date().toISOString().split("T")[0];

  return `// Static index membership maps — auto-generated + manually curated
// Run \`npm run sync:indexes\` to refresh US index data from Wikipedia

export const INDEX_MEMBERS_UPDATED = "${today}";

// ── S&P 500 ─────────────────────────────────────────────────────────────────
const SP500: string[] = ${formatArray(us.SP500)};

// ── Nasdaq 100 ──────────────────────────────────────────────────────────────
const NASDAQ100: string[] = ${formatArray(us.NASDAQ100)};

// ── Dow Jones Industrial Average ────────────────────────────────────────────
const DOW_JONES: string[] = ${formatArray(us.DOW_JONES)};

// ── Russell 2000 (not populated — too large, ~2000 stocks) ──────────────────
const RUSSELL_2000: string[] = [];

// ── SET50 ───────────────────────────────────────────────────────────────────
const SET50: string[] = ${formatArray(thai.SET50)};

// ── SET100 (includes SET50 + additional) ────────────────────────────────────
const SET100: string[] = ${formatArray(thai.SET100)};

// ── MAI (Market for Alternative Investment — notable stocks) ────────────────
const MAI: string[] = ${formatArray(thai.MAI)};

// ── sSet (SET Sustainability — ESG focused stocks) ──────────────────────────
const SSET: string[] = ${formatArray(thai.SSET)};

// ── Combined membership map ─────────────────────────────────────────────────
export const INDEX_MEMBERS: Record<string, string[]> = {
  SP500,
  NASDAQ100,
  DOW_JONES,
  RUSSELL_2000,
  SET50,
  SET100,
  MAI,
  sSet: SSET,
};

/**
 * Reverse lookup: given a stock symbol and exchange, return which indexes it belongs to.
 */
export function getIndexesForSymbol(symbol: string, exchange: string): string[] {
  const sym = symbol.toUpperCase();
  const relevantIndexes = exchange === "SET"
    ? ["SET50", "SET100", "MAI", "sSet"]
    : ["SP500", "NASDAQ100", "DOW_JONES", "RUSSELL_2000"];

  return relevantIndexes.filter((idx) => INDEX_MEMBERS[idx]?.includes(sym));
}
`;
}

async function main() {
  console.log(DRY_RUN ? "=== DRY RUN ===" : "=== Syncing index members ===");

  // Scrape US indexes
  const usData: Record<string, string[]> = { SP500: [], NASDAQ100: [], DOW_JONES: [] };

  for (const [key, scraper] of Object.entries({
    SP500: scrapeSP500,
    NASDAQ100: scrapeNasdaq100,
    DOW_JONES: scrapeDowJones,
  })) {
    try {
      const symbols = await scraper();
      const min = MIN_EXPECTED[key];
      if (symbols.length < min) {
        console.error(`WARNING: ${key} has only ${symbols.length} symbols (expected >= ${min}). Skipping — possible HTML structure change.`);
      } else {
        usData[key] = symbols;
        console.log(`  ${key}: ${symbols.length} members`);
      }
    } catch (err) {
      console.error(`ERROR scraping ${key}:`, err);
    }
  }

  // Read existing Thai data
  const thaiData = readExistingThaiData();
  console.log(`  SET50: ${thaiData.SET50.length} members (preserved)`);
  console.log(`  SET100: ${thaiData.SET100.length} members (preserved)`);
  console.log(`  MAI: ${thaiData.MAI.length} members (preserved)`);
  console.log(`  sSet: ${thaiData.SSET.length} members (preserved)`);

  // Generate output
  const content = generateFileContent(usData, thaiData);

  if (DRY_RUN) {
    console.log("\n--- Generated file content ---\n");
    console.log(content);
  } else {
    const outPath = path.resolve(__dirname, "../src/lib/constants/index-members.ts");
    fs.writeFileSync(outPath, content, "utf-8");
    console.log(`\nWritten to ${outPath}`);
  }

  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
