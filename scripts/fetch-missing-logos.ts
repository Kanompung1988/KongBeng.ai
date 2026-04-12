/**
 * Multi-strategy logo fetcher for broken/missing stocks.
 *
 * Strategy 1: TradingView SVG  — try ticker slug, then known name slug
 * Strategy 2: Wikipedia API    — search company → get infobox logo image
 * Strategy 3: Report unfixable — what still needs manual attention
 *
 * Usage:  npx tsx scripts/fetch-missing-logos.ts
 *         npx tsx scripts/fetch-missing-logos.ts --dry-run
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

// ── TradingView name-slug overrides ──────────────────────────────────────────
// Multiple slug candidates per symbol — first working one wins
const TV_SLUG_CANDIDATES: Record<string, string[]> = {
  // US
  "BRK-B": ["berkshire-hathaway", "brk-b"],
  "AMP":   ["ameriprise-financial", "ameriprise"],
  "CHD":   ["church-and-dwight", "church-dwight"],
  "DVN":   ["devon-energy", "devon"],
  "FANG":  ["diamondback-energy", "diamondback"],
  "ICE":   ["intercontinental-exchange", "ice"],
  "KHC":   ["kraft-heinz", "kraft-heinz-company"],
  "PCG":   ["pacific-gas-and-electric", "pge", "pgecorp"],
  "PDD":   ["pdd-holdings", "pinduoduo", "pdd"],
  "ROP":   ["roper-technologies", "roper"],
  "SJM":   ["jm-smucker", "smucker", "sjm"],
  "STLD":  ["steel-dynamics", "stld"],
  "TRGP":  ["targa-resources", "targa"],
  "BAX":   ["baxter-international", "baxter"],
  "DECK":  ["deckers-brands", "deckers", "deck"],
  "CSX":   ["csx", "csx-transportation"],
  "NVR":   ["nvr", "nvr-inc"],
  "DOW":   ["dow", "dow-inc"],
  // Thai
  "BBL":     ["bangkok-bank"],
  "KBANK":   ["kasikornbank", "kasikorn-bank"],
  "PTT":     ["ptt", "ptt-public-company"],
  "BANPU":   ["banpu"],
  "BTS":     ["bts", "bts-group", "bts-skytrain"],
  "OR":      ["ptt-oil-and-retail", "or"],
  "TOP":     ["thai-oil", "thaioil"],
  "GPSC":    ["global-power-synergy", "gpsc"],
  "INTOUCH": ["intouch", "intouch-holdings"],
  "SCGP":    ["scg-packaging", "scgp"],
  "TU":      ["thai-union", "thaiunion"],
  "BJC":     ["berli-jucker", "bjc"],
  "BTG":     ["betagro", "btg"],
  "CBG":     ["carabao", "carabao-group"],
  "CHG":     ["chularat-hospital", "chularat"],
  "RATCH":   ["ratch-group", "ratch"],
  "SAWAD":   ["sawad", "srisawad-corporation"],
  "AAV":     ["asia-aviation", "aav"],
  "BLA":     ["bangkok-life-assurance", "bangkok-life"],
  "OSP":     ["osotspa", "osotspa-public"],
  "BPP":     ["banpu-power", "bpp"],
  "TASCO":   ["tipco-asphalt", "tasco"],
  "KCE":     ["kce-electronics", "kce"],
  "PTL":     ["polyplex-thailand", "polyplex"],
  "M":       ["mk-restaurants", "mk-group"],
  "RCL":     ["regional-container-lines", "rcl"],
  "SAPPE":   ["sappe", "sappe-public"],
  "THANI":   ["ratchthani-leasing", "ratchthani"],
  "DOHOME":  ["dohome", "do-home"],
  "CCET":    ["cal-comp-electronics", "calcomp"],
  "PR9":     ["praram-9-hospital", "praram9"],
  "SUPER":   ["super-energy", "super"],
  "TPCH":    ["tpc-consolidated", "tpch"],
  "TFG":     ["thai-foods-group", "tfg"],
  "WAVE":    ["wave-entertainment", "wave"],
  "SOLAR":   ["solartron", "solar"],
};

// ── Wikipedia search terms ────────────────────────────────────────────────────
const WIKI_SEARCH: Record<string, string> = {
  // US
  "AMP":   "Ameriprise Financial",
  "BAX":   "Baxter International",
  "BRK-B": "Berkshire Hathaway",
  "CHD":   "Church Dwight",
  "CSX":   "CSX Corporation",
  "DECK":  "Deckers Brands",
  "DOW":   "Dow Inc",
  "DVN":   "Devon Energy",
  "FANG":  "Diamondback Energy",
  "ICE":   "Intercontinental Exchange",
  "KHC":   "Kraft Heinz",
  "NVR":   "NVR Inc",
  "PCG":   "Pacific Gas and Electric",
  "PDD":   "PDD Holdings",
  "ROP":   "Roper Technologies",
  "SJM":   "J.M. Smucker",
  "STLD":  "Steel Dynamics",
  "TRGP":  "Targa Resources",
  // Thai
  // "AAV": removed — Wikipedia search finds "Asia Aviation Capital" (wrong co.), accept initials
  "BANPU":   "Banpu",
  "BBL":     "Bangkok Bank",
  "BJC":     "Berli Jucker",
  "BLA":     "Bangkok Life Assurance",
  "BPP":     "Banpu Power",
  "BTG":     "Betagro",
  "BTS":     "BTS Group Holdings",
  "CBG":     "Carabao Group",
  "CCET":    "Cal-Comp Electronics",
  "CHG":     "Chularat Hospital",
  "DOHOME":  "Dohome",
  "GPSC":    "Global Power Synergy",
  "INTOUCH": "Intouch Holdings",
  "KBANK":   "Kasikorn Bank",
  "KCE":     "KCE Electronics",
  "M":       "MK Restaurants",
  "OR":      "PTT Oil and Retail Business",
  "OSP":     "Osotspa",
  "PJW":     "PJW Group",
  "PR9":     "Praram 9 Hospital",
  "PTL":     "Polyplex Thailand",
  "RATCH":   "Ratch Group",
  "RCL":     "Regional Container Lines",
  "SAPPE":   "Sappe",
  "SAWAD":   "Sawad Corporation",
  "SCGP":    "SCG Packaging",
  "SOLAR":   "Solartron",
  "SUPER":   "Super Energy",
  "TASCO":   "Tipco Asphalt",
  "TFG":     "Thai Foods Group",
  "THANI":   "Ratchthani Leasing",
  "TOP":     "Thai Oil",
  "TPCH":    "TPC Consolidated",
  "TU":      "Thai Union",
  "WAVE":    "Wave Entertainment",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
async function isImage(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(7000) });
    const ct = res.headers.get("content-type") ?? "";
    return res.ok && (ct.startsWith("image/") || ct.includes("svg"));
  } catch {
    return false;
  }
}

async function tryTradingView(symbol: string): Promise<string | null> {
  const ticker = symbol.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const seen = new Set<string>();
  const candidates: string[] = [];

  // 1. ticker slug first
  candidates.push(`https://s3-symbol-logo.tradingview.com/${ticker}--big.svg`);
  seen.add(ticker);

  // 2. known slug candidates
  for (const slug of (TV_SLUG_CANDIDATES[symbol] ?? [])) {
    if (!seen.has(slug)) {
      candidates.push(`https://s3-symbol-logo.tradingview.com/${slug}--big.svg`);
      seen.add(slug);
    }
  }

  for (const url of candidates) {
    if (await isImage(url)) return url;
    await sleep(80);
  }
  return null;
}

async function tryWikipedia(symbol: string): Promise<string | null> {
  const searchTerm = WIKI_SEARCH[symbol];
  if (!searchTerm) return null;

  try {
    // Step 1: Search for article
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(searchTerm)}&limit=1&format=json&origin=*`;
    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(8000) });
    if (!searchRes.ok) return null;

    const [, titles] = await searchRes.json() as [string, string[], string[], string[]];
    if (!titles?.length) return null;
    const title = titles[0];

    // Stricter title check — ignore generic words, require company-specific name to match
    const titleLower = title.toLowerCase();
    const GENERIC = new Set(["group", "holdings", "inc", "corp", "company", "public", "limited", "pcl", "and", "the"]);
    const specificWords = searchTerm.toLowerCase().split(/\s+/).filter((w) => w.length > 2 && !GENERIC.has(w));
    const titleRelevant = specificWords.length > 0 && specificWords.every((w) => titleLower.includes(w));
    if (!titleRelevant) return null;

    // Step 2: Get page's main image
    const imgUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&piprop=original&format=json&origin=*`;
    const imgRes = await fetch(imgUrl, { signal: AbortSignal.timeout(8000) });
    if (!imgRes.ok) return null;

    const imgData = await imgRes.json() as {
      query: { pages: Record<string, { original?: { source: string } }> };
    };
    const source = Object.values(imgData.query?.pages ?? {})[0]?.original?.source;
    if (!source) return null;

    // Only accept if the filename clearly contains "logo" — reject building photos, portraits, maps
    const filename = source.split("/").pop()?.toLowerCase() ?? "";
    if (!filename.includes("logo")) return null;

    if (await isImage(source)) return source;
  } catch {
    // ignore
  }
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const stocks = await prisma.stock.findMany({
    where: { logoUrl: null },
    select: { id: true, symbol: true, exchange: true, name: true },
    orderBy: { symbol: "asc" },
  });

  if (!stocks.length) {
    console.log("No stocks with missing logos. Run audit-logos.ts first.");
    return;
  }

  console.log(`Stocks missing logos: ${stocks.length}`);
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE (updating DB)"}\n`);

  const results: { symbol: string; url: string; source: string }[] = [];
  const failed: string[] = [];

  for (let i = 0; i < stocks.length; i++) {
    const s = stocks[i];
    const idx = `[${String(i + 1).padStart(2)}/${stocks.length}]`;
    process.stdout.write(`${idx} ${s.symbol.padEnd(12)} `);

    // Strategy 1: TradingView
    let url = await tryTradingView(s.symbol);
    let source = "TradingView";
    await sleep(200);

    // Strategy 2: Wikipedia
    if (!url) {
      url = await tryWikipedia(s.symbol);
      source = "Wikipedia";
      await sleep(300);
    }

    if (url) {
      console.log(`✓ ${source.padEnd(12)} ${url}`);
      results.push({ symbol: s.symbol, url, source });
      if (!DRY_RUN) {
        await prisma.stock.update({ where: { id: s.id }, data: { logoUrl: url } });
      }
    } else {
      console.log(`✗ not found`);
      failed.push(s.symbol);
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(70));
  console.log(`Fixed   : ${results.length}/${stocks.length}`);
  console.log(`Failed  : ${failed.length}`);

  const bySource: Record<string, number> = {};
  results.forEach((r) => { bySource[r.source] = (bySource[r.source] ?? 0) + 1; });
  Object.entries(bySource).forEach(([src, n]) => console.log(`  ${src}: ${n}`));

  if (failed.length) {
    console.log(`\nStill missing (${failed.length}):`);
    console.log("  " + failed.join(", "));
    console.log("\nOptions for remaining:");
    console.log("  • Download manually → place in /public/logos/{symbol}.png");
    console.log("  • Sign up at brandfetch.io (free 100/day) then run with --brandfetch");
  }

  console.log("═".repeat(70));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
