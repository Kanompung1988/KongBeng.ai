/**
 * Audit all stock logos in the DB.
 * Tests each logoUrl with a real HTTP request and categorises the result.
 *
 * Usage:  npx tsx scripts/audit-logos.ts
 * Flags:  --fix   Update bad logos in DB using Clearbit where possible
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
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const FIX = process.argv.includes("--fix");

// ────────────────────────────────────────────────────────────────────────────
// Domain validity check (must have at least one dot with content both sides)
// e.g. "asiaaviation." → bad, "bangkokbank.com" → good
function isValidDomain(domain: string): boolean {
  return /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/.test(domain);
}

// ────────────────────────────────────────────────────────────────────────────
type Status = "ok" | "broken" | "malformed" | "null";

async function checkUrl(url: string): Promise<{ status: Status; code: number; reason: string }> {
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(6000) });
    const ct = res.headers.get("content-type") ?? "";
    if (res.ok && ct.startsWith("image/")) {
      return { status: "ok", code: res.status, reason: ct };
    }
    if (!res.ok) {
      return { status: "broken", code: res.status, reason: `HTTP ${res.status}` };
    }
    // 200 but not an image (HTML page / JSON)
    return { status: "broken", code: res.status, reason: `content-type: ${ct}` };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { status: "broken", code: 0, reason: msg.slice(0, 60) };
  }
}

// ────────────────────────────────────────────────────────────────────────────
async function main() {
  const stocks = await prisma.stock.findMany({
    select: { id: true, symbol: true, exchange: true, logoUrl: true },
    orderBy: { symbol: "asc" },
  });

  const total = stocks.length;
  const noLogo = stocks.filter((s) => !s.logoUrl).length;
  console.log(`Total stocks : ${total}`);
  console.log(`With logoUrl : ${total - noLogo}`);
  console.log(`Without logo : ${noLogo}`);
  console.log(`Mode         : ${FIX ? "FIX (will update DB)" : "audit-only (--fix to update)"}`);
  console.log("─".repeat(70));

  const results: { symbol: string; exchange: string; url: string | null; status: Status; reason: string }[] = [];

  for (let i = 0; i < stocks.length; i++) {
    const s = stocks[i];
    const idx = `[${String(i + 1).padStart(3)}/${total}]`;
    process.stdout.write(`${idx} ${s.symbol.padEnd(12)} `);

    if (!s.logoUrl) {
      console.log("── no logoUrl");
      results.push({ symbol: s.symbol, exchange: s.exchange, url: null, status: "null", reason: "no logoUrl" });
      continue;
    }

    // Check for malformed domain in Google Favicon URL
    const faviconDomain = s.logoUrl.match(/https?:\/\/www\.google\.com\/s2\/favicons\?domain=([^&]+)/)?.[1];
    if (faviconDomain && !isValidDomain(faviconDomain)) {
      console.log(`MALFORMED  domain="${faviconDomain}"`);
      results.push({ symbol: s.symbol, exchange: s.exchange, url: s.logoUrl, status: "malformed", reason: `truncated domain: ${faviconDomain}` });

      if (FIX) {
        // Try to fix: clear the bad URL so it falls back to initials cleanly
        await prisma.stock.update({ where: { id: s.id }, data: { logoUrl: null } });
        console.log(`       ↳ cleared logoUrl`);
      }
      continue;
    }

    const { status, code, reason } = await checkUrl(s.logoUrl);
    const tag = status === "ok" ? "OK " : "BAD";
    console.log(`${tag}  ${code}  ${reason.slice(0, 50)}`);
    results.push({ symbol: s.symbol, exchange: s.exchange, url: s.logoUrl, status, reason });

    // Rate limit: be gentle with Clearbit & Google
    if (i < stocks.length - 1) await sleep(200);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const ok        = results.filter((r) => r.status === "ok");
  const broken    = results.filter((r) => r.status === "broken");
  const malformed = results.filter((r) => r.status === "malformed");
  const nullLogo  = results.filter((r) => r.status === "null");

  console.log("\n" + "═".repeat(70));
  console.log(`OK          : ${ok.length}`);
  console.log(`Broken      : ${broken.length}`);
  console.log(`Malformed   : ${malformed.length}`);
  console.log(`No logo     : ${nullLogo.length}`);
  console.log("═".repeat(70));

  if (broken.length) {
    console.log("\nBroken logos:");
    broken.forEach((r) => console.log(`  ${r.symbol.padEnd(12)} ${r.reason}  ${r.url}`));
  }
  if (malformed.length) {
    console.log("\nMalformed domains:");
    malformed.forEach((r) => console.log(`  ${r.symbol.padEnd(12)} ${r.reason}`));
  }
  if (nullLogo.length) {
    console.log("\nNo logo (showing initials):");
    console.log("  " + nullLogo.map((r) => r.symbol).join(", "));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
