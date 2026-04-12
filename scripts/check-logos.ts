import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Check THANI
  const thani = await prisma.stock.findFirst({
    where: { symbol: "THANI" },
    select: { symbol: true, logoUrl: true, exchange: true },
  });
  console.log("THANI:", JSON.stringify(thani));

  // Count stocks without logos
  const noLogo = await prisma.stock.count({ where: { logoUrl: null } });
  const total = await prisma.stock.count();
  console.log(`\nLogos: ${total - noLogo}/${total} (${noLogo} missing)`);

  // Sample broken logos (Google favicon with generic domain)
  const withLogo = await prisma.stock.findMany({
    where: { logoUrl: { not: null } },
    select: { symbol: true, logoUrl: true },
    take: 10,
  });
  console.log("\nSample logos:");
  withLogo.forEach((s) => console.log(`  ${s.symbol}: ${s.logoUrl}`));

  // Check how many use Google favicons
  const all = await prisma.stock.findMany({
    where: { logoUrl: { not: null } },
    select: { symbol: true, logoUrl: true },
  });

  const googleFavicon = all.filter((s) => s.logoUrl?.includes("google.com/s2/favicons"));
  console.log(`\nGoogle favicon logos: ${googleFavicon.length}`);

  // Show some Thai stocks
  const thaiStocks = await prisma.stock.findMany({
    where: { exchange: "SET", logoUrl: { not: null } },
    select: { symbol: true, logoUrl: true },
    take: 5,
  });
  console.log("\nThai stock logos:");
  thaiStocks.forEach((s) => console.log(`  ${s.symbol}: ${s.logoUrl}`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
