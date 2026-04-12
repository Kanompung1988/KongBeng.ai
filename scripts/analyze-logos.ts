/**
 * Analyze logo quality for all stocks.
 * Downloads each Google favicon and checks if it's the generic globe (16x16, ~726 bytes)
 * vs a real logo (larger size/file).
 *
 * Usage: npx tsx scripts/analyze-logos.ts
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

async function checkLogo(url: string): Promise<{ size: number; width: string; ok: boolean }> {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return { size: 0, width: "error", ok: false };
    const buf = await res.arrayBuffer();
    const bytes = buf.byteLength;
    // PNG header check: width is at bytes 16-19 (big-endian)
    const view = new DataView(buf);
    let width = "?";
    // Check PNG signature
    if (bytes > 24 && view.getUint8(0) === 0x89 && view.getUint8(1) === 0x50) {
      const w = view.getUint32(16, false);
      width = `${w}px`;
    }
    // ICO files
    if (bytes > 6 && view.getUint16(0, true) === 0 && view.getUint16(2, true) === 1) {
      const w = view.getUint8(6) || 256;
      width = `${w}px (ico)`;
    }
    const ok = bytes > 1000 || (width !== "16px" && width !== "?");
    return { size: bytes, width, ok };
  } catch {
    return { size: 0, width: "fetch-error", ok: false };
  }
}

async function main() {
  const stocks = await prisma.stock.findMany({
    where: { logoUrl: { not: null } },
    select: { symbol: true, exchange: true, logoUrl: true },
    orderBy: [{ exchange: "asc" }, { symbol: "asc" }],
  });

  console.log(`Checking ${stocks.length} stock logos...\n`);

  const results = { good: 0, bad: 0, error: 0 };
  const badLogos: { symbol: string; exchange: string; domain: string; size: number; width: string }[] = [];

  // Check in batches of 10
  for (let i = 0; i < stocks.length; i += 10) {
    const batch = stocks.slice(i, i + 10);
    const checks = await Promise.all(
      batch.map(async (s) => {
        const logo = await checkLogo(s.logoUrl!);
        const domain = s.logoUrl!.match(/domain=([^&]+)/)?.[1] || "?";
        return { ...s, ...logo, domain };
      })
    );

    for (const c of checks) {
      if (c.ok) {
        results.good++;
      } else {
        results.bad++;
        badLogos.push({ symbol: c.symbol, exchange: c.exchange, domain: c.domain, size: c.size, width: c.width });
      }
    }

    process.stdout.write(`\r  Checked ${Math.min(i + 10, stocks.length)}/${stocks.length}`);
    if (i + 10 < stocks.length) await sleep(200);
  }

  console.log(`\n\n=== Results ===`);
  console.log(`Good logos (>1KB or >16px): ${results.good}`);
  console.log(`Bad logos (16x16 generic globe): ${results.bad}`);

  // Group by exchange
  const setBad = badLogos.filter((b) => b.exchange === "SET");
  const usBad = badLogos.filter((b) => b.exchange !== "SET");

  console.log(`\n--- SET stocks with bad logos (${setBad.length}) ---`);
  setBad.forEach((b) => console.log(`  ${b.symbol.padEnd(10)} ${b.domain.padEnd(30)} ${b.size}B ${b.width}`));

  console.log(`\n--- US stocks with bad logos (${usBad.length}) ---`);
  usBad.forEach((b) => console.log(`  ${b.symbol.padEnd(10)} ${b.domain.padEnd(30)} ${b.size}B ${b.width}`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
