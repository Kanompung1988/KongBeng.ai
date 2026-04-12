/**
 * migrate-tv-logos.ts
 * Replace TradingView S3 CDN logo URLs with Clearbit equivalents.
 * TradingView's S3 bucket is an internal CDN — hotlinking it violates their ToS.
 * Clearbit logo.clearbit.com is the industry-standard logo source for fintech apps.
 *
 * Run: npx tsx scripts/migrate-tv-logos.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Known domain map for accuracy (derived from company names + manual verification)
const DOMAIN_MAP: Record<string, string> = {
  AMP:     "amp.com.au",
  BANPU:   "banpu.co.th",
  BAX:     "baxter.com",
  BJC:     "bjc.co.th",
  BLA:     "bangkoklife.co.th",
  "BRK-B": "berkshirehathaway.com",
  CBG:     "carabaogroup.com",
  CHD:     "churchdwight.com",
  CHG:     "chularat.com",
  CSX:     "csx.com",
  DOW:     "dow.com",
  DVN:     "devonenergy.com",
  FANG:    "diamondbackenergy.com",
  GPSC:    "gpsc.co.th",
  ICE:     "theice.com",
  INTOUCH: "intouchcompany.com",
  KBANK:   "kasikornbank.com",
  KCE:     "kce.co.th",
  KHC:     "kraftheinzcompany.com",
  NVR:     "nvrinc.com",
  OR:      "pttor.com",
  PCG:     "pge.com",
  PDD:     "pddholdings.com",
  PTL:     "polyplex.com",
  RCL:     "rclgroup.co.th",
  ROP:     "ropertech.com",
  SAWAD:   "sawad.co.th",
  SCGP:    "scgpackaging.com",
  SJM:     "smuckers.com",
  SOLAR:   "solar17.co.th",
  STLD:    "steeldynamics.com",
  TRGP:    "targaresources.com",
  TU:      "thaiunion.com",
  WAVE:    "waveentertainment.co.th",
};

async function checkClearbit(domain: string): Promise<boolean> {
  try {
    const url = `https://logo.clearbit.com/${domain}`;
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  const stocks = await prisma.stock.findMany({
    where: { logoUrl: { contains: "s3-symbol-logo.tradingview" } },
    select: { id: true, symbol: true, exchange: true, logoUrl: true },
  });

  console.log(`Found ${stocks.length} stocks with TradingView S3 logos\n`);

  let fixed = 0;
  let cleared = 0;

  for (const stock of stocks) {
    const domain = DOMAIN_MAP[stock.symbol];
    if (!domain) {
      console.log(`  [SKIP] ${stock.symbol} — no domain mapping, keeping TV logo`);
      continue;
    }

    const ok = await checkClearbit(domain);
    if (ok) {
      const newUrl = `https://logo.clearbit.com/${domain}`;
      await prisma.stock.update({ where: { id: stock.id }, data: { logoUrl: newUrl } });
      console.log(`  [OK]   ${stock.symbol} → clearbit/${domain}`);
      fixed++;
    } else {
      // Clearbit doesn't have this logo — clear the TV URL, show initials
      await prisma.stock.update({ where: { id: stock.id }, data: { logoUrl: null } });
      console.log(`  [NULL] ${stock.symbol} — Clearbit 404, cleared`);
      cleared++;
    }
  }

  console.log(`\nDone: ${fixed} migrated to Clearbit, ${cleared} cleared`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
