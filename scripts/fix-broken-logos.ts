/**
 * Fix broken logos:
 * 1. Google favicon 404 → try Clearbit using the same domain
 * 2. Malformed domain (e.g. "asiaaviation.") → clear logoUrl (shows initials)
 * 3. If Clearbit also 404s → clear logoUrl (shows initials)
 *
 * Usage: npx tsx scripts/fix-broken-logos.ts
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

function isValidDomain(domain: string): boolean {
  return /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/.test(domain);
}

async function checkImage(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(6000) });
    const ct = res.headers.get("content-type") ?? "";
    return res.ok && ct.startsWith("image/");
  } catch {
    return false;
  }
}

async function main() {
  // Get all stocks with broken or malformed logos
  const stocks = await prisma.stock.findMany({
    select: { id: true, symbol: true, exchange: true, logoUrl: true },
    orderBy: { symbol: "asc" },
  });

  const candidates = stocks.filter((s) => {
    if (!s.logoUrl) return false;
    const fd = s.logoUrl.match(/https?:\/\/www\.google\.com\/s2\/favicons\?domain=([^&]+)/)?.[1];
    return !!fd; // only process Google favicon URLs (could be 404 or malformed)
  });

  console.log(`Checking ${candidates.length} Google favicon logos...\n`);

  let fixed = 0;
  let cleared = 0;
  let skipped = 0;

  for (let i = 0; i < candidates.length; i++) {
    const s = candidates[i];
    const idx = `[${String(i + 1).padStart(3)}/${candidates.length}]`;
    const faviconDomain = s.logoUrl!.match(/https?:\/\/www\.google\.com\/s2\/favicons\?domain=([^&]+)/)?.[1]!;

    process.stdout.write(`${idx} ${s.symbol.padEnd(12)} `);

    // Step 1: Check if current favicon URL works
    const faviconOk = isValidDomain(faviconDomain) && await checkImage(s.logoUrl!);
    if (faviconOk) {
      console.log(`OK  (favicon works)`);
      skipped++;
      await sleep(150);
      continue;
    }

    // Step 2: Malformed domain → clear
    if (!isValidDomain(faviconDomain)) {
      console.log(`MALFORMED  "${faviconDomain}" → clearing`);
      await prisma.stock.update({ where: { id: s.id }, data: { logoUrl: null } });
      cleared++;
      continue;
    }

    // Step 3: Try Clearbit for the same domain
    const clearbitUrl = `https://logo.clearbit.com/${faviconDomain}`;
    const clearbitOk = await checkImage(clearbitUrl);

    if (clearbitOk) {
      console.log(`FIXED  → ${clearbitUrl}`);
      await prisma.stock.update({ where: { id: s.id }, data: { logoUrl: clearbitUrl } });
      fixed++;
    } else {
      console.log(`CLEARED  (Clearbit also 404 for ${faviconDomain})`);
      await prisma.stock.update({ where: { id: s.id }, data: { logoUrl: null } });
      cleared++;
    }

    await sleep(300);
  }

  console.log("\n" + "═".repeat(60));
  console.log(`Already OK : ${skipped}`);
  console.log(`Fixed      : ${fixed}  (updated to Clearbit URL)`);
  console.log(`Cleared    : ${cleared}  (set to null → shows initials)`);
  console.log("═".repeat(60));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
