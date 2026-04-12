/**
 * Round 2: Wikipedia direct article title lookup for remaining stocks.
 * Uses exact article titles instead of search — more accurate than search.
 * Usage: npx tsx scripts/fetch-missing-logos-wiki.ts [--dry-run]
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  try {
    const content = readFileSync(resolve(__dirname, "..", ".env"), "utf-8");
    for (const line of content.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq === -1) continue;
      const key = t.substring(0, eq).trim();
      let val = t.substring(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
        val = val.slice(1, -1);
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {}
}
loadEnv();

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry-run");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Direct Wikipedia article title → no search needed, more accurate
const WIKI_DIRECT: Record<string, string> = {
  "AAV":    "Asia Aviation",
  "BBL":    "Bangkok Bank",
  "BPP":    "Banpu Power",
  "BTG":    "Betagro",
  "BTS":    "BTS Group Holdings",
  "CCET":   "Cal-Comp Electronics (Thailand)",
  "DECK":   "Deckers Brands",
  "DOHOME": "Dohome",
  "M":      "MK Restaurants",
  "OSP":    "Osotspa",
  "PJW":    "Panya Indra Gems",
  "PR9":    "Praram 9 Hospital",
  "PTT":    "PTT (company)",
  "RATCH":  "Ratch Group",
  "SAPPE":  "Sappe",
  "SAWAD":  "Srisawad Corporation",
  "SUPER":  "Super Energy Corporation",
  "TASCO":  "Tipco Asphalt",
  "TFG":    "Thai Foods Group",
  "THANI":  "Ratchthani Leasing Company",
  "TOP":    "Thai Oil",
  "TPCH":   "TPC (company)",
  "TU":     "Thai Union",
};

async function isImage(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(7000) });
    const ct = res.headers.get("content-type") ?? "";
    return res.ok && (ct.startsWith("image/") || ct.includes("svg"));
  } catch {
    return false;
  }
}

async function wikiLogo(articleTitle: string): Promise<string | null> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(articleTitle)}&prop=pageimages&piprop=original&format=json&origin=*`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;

    const data = await res.json() as {
      query: { pages: Record<string, { original?: { source: string } }> };
    };
    const source = Object.values(data.query?.pages ?? {})[0]?.original?.source;
    if (!source) return null;

    // Only accept files with "logo" in the filename
    const filename = source.split("/").pop()?.toLowerCase() ?? "";
    if (!filename.includes("logo")) return null;

    if (await isImage(source)) return source;
  } catch { /* ignore */ }
  return null;
}

async function main() {
  const stocks = await prisma.stock.findMany({
    where: { logoUrl: null },
    select: { id: true, symbol: true, exchange: true },
    orderBy: { symbol: "asc" },
  });

  if (!stocks.length) {
    console.log("No stocks with missing logos.");
    return;
  }

  console.log(`Missing logos: ${stocks.length}`);
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}\n`);

  const fixed: string[] = [];
  const failed: string[] = [];

  for (let i = 0; i < stocks.length; i++) {
    const s = stocks[i];
    const idx = `[${String(i + 1).padStart(2)}/${stocks.length}]`;
    const articleTitle = WIKI_DIRECT[s.symbol];

    process.stdout.write(`${idx} ${s.symbol.padEnd(12)} `);

    if (!articleTitle) {
      console.log(`-- no Wikipedia mapping`);
      failed.push(s.symbol);
      continue;
    }

    const url = await wikiLogo(articleTitle);
    await sleep(300);

    if (url) {
      console.log(`✓ ${url}`);
      fixed.push(s.symbol);
      if (!DRY_RUN) {
        await prisma.stock.update({ where: { id: s.id }, data: { logoUrl: url } });
      }
    } else {
      console.log(`✗ no logo found (article: "${articleTitle}")`);
      failed.push(s.symbol);
    }
  }

  console.log("\n" + "═".repeat(70));
  console.log(`Fixed  : ${fixed.length}  →  ${fixed.join(", ") || "none"}`);
  console.log(`Failed : ${failed.length}  →  ${failed.join(", ") || "none"}`);
  console.log("═".repeat(70));

  if (failed.length) {
    console.log("\nSuggestion for remaining: accept initials or use Brandfetch API");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
