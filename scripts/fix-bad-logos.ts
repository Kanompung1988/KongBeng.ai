/**
 * Fix bad stock logos by switching from Google favicon to DuckDuckGo icons.
 *
 * Google favicon service has degraded — many domains now return a 16x16 generic globe.
 * DuckDuckGo returns consistent 48x48 PNGs for most domains.
 *
 * Usage:
 *   npx tsx scripts/fix-bad-logos.ts              # fix all bad logos
 *   npx tsx scripts/fix-bad-logos.ts --dry         # preview only
 *   npx tsx scripts/fix-bad-logos.ts --all         # re-check ALL logos (not just Google ones)
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { resolve } from "path";

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

const args = process.argv.slice(2);
const isDry = args.includes("--dry");
const checkAll = args.includes("--all");

async function checkLogo(url: string): Promise<{ ok: boolean; size: number; width: number }> {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return { ok: false, size: 0, width: 0 };
    const buf = await res.arrayBuffer();
    const bytes = buf.byteLength;
    const view = new DataView(buf);
    let width = 0;
    // PNG check
    if (bytes > 24 && view.getUint8(0) === 0x89 && view.getUint8(1) === 0x50) {
      width = view.getUint32(16, false);
    }
    // ICO check
    if (bytes > 6 && view.getUint16(0, true) === 0 && view.getUint16(2, true) === 1) {
      width = view.getUint8(6) || 256;
    }
    const ok = bytes > 1000 || (width > 16);
    return { ok, size: bytes, width };
  } catch {
    return { ok: false, size: 0, width: 0 };
  }
}

async function main() {
  // Get all stocks with Google favicon URLs (or all logos if --all)
  const stocks = await prisma.stock.findMany({
    where: checkAll
      ? { logoUrl: { not: null } }
      : { logoUrl: { contains: "google.com/s2/favicons" } },
    select: { id: true, symbol: true, exchange: true, logoUrl: true },
    orderBy: [{ exchange: "asc" }, { symbol: "asc" }],
  });

  console.log(`Found ${stocks.length} stocks with ${checkAll ? "any" : "Google favicon"} logo URLs`);
  if (isDry) console.log("DRY RUN — no database changes\n");

  let fixed = 0;
  let alreadyGood = 0;
  let ddgBad = 0;

  for (let i = 0; i < stocks.length; i += 10) {
    const batch = stocks.slice(i, i + 10);

    await Promise.all(batch.map(async (stock) => {
      const idx = `[${String(stocks.indexOf(stock) + 1).padStart(3)}/${stocks.length}]`;

      // Extract domain from current URL
      const domain = stock.logoUrl!.match(/domain=([^&]+)/)?.[1]
        || stock.logoUrl!.match(/ip3\/([^.]+\.[^/]+)\.ico/)?.[1]
        || null;

      if (!domain) {
        console.log(`${idx} ${stock.symbol.padEnd(12)} -- can't extract domain from: ${stock.logoUrl}`);
        return;
      }

      // Check current logo quality
      const current = await checkLogo(stock.logoUrl!);

      if (current.ok && !checkAll) {
        alreadyGood++;
        return;
      }

      if (current.ok) {
        alreadyGood++;
        process.stdout.write(`${idx} ${stock.symbol.padEnd(12)} OK (${current.size}B ${current.width}px)\n`);
        return;
      }

      // Current logo is bad — try DuckDuckGo
      const ddgUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
      const ddg = await checkLogo(ddgUrl);

      if (ddg.ok) {
        if (!isDry) {
          await prisma.stock.update({
            where: { id: stock.id },
            data: { logoUrl: ddgUrl },
          });
        }
        console.log(`${idx} ${stock.symbol.padEnd(12)} ${domain.padEnd(30)} FIXED → DDG (${ddg.size}B)`);
        fixed++;
      } else {
        // DuckDuckGo also bad — clear the logo so the fallback initials show
        if (!isDry) {
          await prisma.stock.update({
            where: { id: stock.id },
            data: { logoUrl: null },
          });
        }
        console.log(`${idx} ${stock.symbol.padEnd(12)} ${domain.padEnd(30)} CLEARED (DDG also bad: ${ddg.size}B)`);
        ddgBad++;
      }
    }));

    process.stdout.write(`\r  Checked ${Math.min(i + 10, stocks.length)}/${stocks.length}...`);
    if (i + 10 < stocks.length) await sleep(300);
  }

  console.log(`\n\n=== Results ===`);
  console.log(`Already good: ${alreadyGood}`);
  console.log(`Fixed (→ DuckDuckGo): ${fixed}`);
  console.log(`Cleared (no good source): ${ddgBad}`);
  console.log(`Total checked: ${stocks.length}`);
  if (isDry) console.log("\nDRY RUN — run without --dry to apply changes");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
