/**
 * Bulk fetch logos for ALL stocks using yahoo-finance2 quoteSummary.
 * Gets company website from Yahoo Finance, then uses Google favicon service.
 *
 * Usage: npx tsx scripts/fetch-all-logos.ts
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

const prisma = new PrismaClient();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const YahooFinance = require("yahoo-finance2").default;
const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

function getYahooSymbol(symbol: string, exchange: string): string {
  if (exchange === "SET") return `${symbol}.BK`;
  return symbol;
}

async function fetchWebsite(symbol: string, exchange: string): Promise<string | null> {
  const yahooSym = getYahooSymbol(symbol, exchange);
  try {
    const result = await yf.quoteSummary(yahooSym, { modules: ["assetProfile"] });
    const website: string | undefined = result?.assetProfile?.website;
    if (!website) return null;
    const domain = new URL(website.startsWith("http") ? website : `https://${website}`).hostname.replace(/^www\./, "");
    return domain;
  } catch {
    return null;
  }
}

async function main() {
  const stocks = await prisma.stock.findMany({
    where: { logoUrl: null },
    select: { id: true, symbol: true, exchange: true, name: true },
    orderBy: { symbol: "asc" },
  });

  console.log(`Stocks without logo: ${stocks.length}`);
  console.log(`Fetching website domains from Yahoo Finance...\n`);

  let updated = 0;
  let failed = 0;

  for (let i = 0; i < stocks.length; i++) {
    const s = stocks[i];
    const idx = `[${String(i + 1).padStart(3)}/${stocks.length}]`;

    process.stdout.write(`${idx} ${s.symbol.padEnd(12)}`);

    const domain = await fetchWebsite(s.symbol, s.exchange);

    if (domain) {
      const logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      await prisma.stock.update({ where: { id: s.id }, data: { logoUrl } });
      console.log(`${domain}`);
      updated++;
    } else {
      console.log(`-- no website`);
      failed++;
    }

    // Rate limit: 300ms between Yahoo Finance API calls
    if (i < stocks.length - 1) {
      await sleep(300);
    }
  }

  const totalWith = await prisma.stock.count({ where: { logoUrl: { not: null } } });
  const total = await prisma.stock.count();
  console.log(`\n=== Done ===`);
  console.log(`Updated: ${updated}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total with logo: ${totalWith}/${total}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
