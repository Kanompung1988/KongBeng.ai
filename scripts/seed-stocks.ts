/**
 * Seed script — preload Thai (SET) and US (NYSE/NASDAQ) stocks into DB
 * Usage: npx ts-node --project tsconfig.json scripts/seed-stocks.ts
 *    or: docker compose exec app npx ts-node scripts/seed-stocks.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type StockSeed = {
  symbol: string;
  name: string;
  sector: string;
  exchange: string;
  country: "TH" | "US";
};

// ─── หุ้นไทย (SET100) ─────────────────────────────────────────────────────────
const thaiStocks: StockSeed[] = [
  // Energy
  { symbol: "PTT",    name: "PTT Public Company Limited",              sector: "Energy",      exchange: "SET", country: "TH" },
  { symbol: "PTTEP",  name: "PTT Exploration and Production PCL",      sector: "Energy",      exchange: "SET", country: "TH" },
  { symbol: "TOP",    name: "Thai Oil PCL",                            sector: "Energy",      exchange: "SET", country: "TH" },
  { symbol: "IRPC",   name: "IRPC PCL",                                sector: "Energy",      exchange: "SET", country: "TH" },
  { symbol: "PTTGC",  name: "PTT Global Chemical PCL",                 sector: "Energy",      exchange: "SET", country: "TH" },
  { symbol: "GULF",   name: "Gulf Energy Development PCL",             sector: "Energy",      exchange: "SET", country: "TH" },
  { symbol: "GPSC",   name: "Global Power Synergy PCL",                sector: "Energy",      exchange: "SET", country: "TH" },
  { symbol: "OR",     name: "PTT Oil and Retail Business PCL",         sector: "Energy",      exchange: "SET", country: "TH" },
  { symbol: "BANPU",  name: "Banpu PCL",                               sector: "Energy",      exchange: "SET", country: "TH" },
  { symbol: "BCP",    name: "Bangchak Corporation PCL",                sector: "Energy",      exchange: "SET", country: "TH" },
  { symbol: "RATCH",  name: "Ratch Group PCL",                         sector: "Energy",      exchange: "SET", country: "TH" },
  { symbol: "EGCO",   name: "Electricity Generating PCL",              sector: "Energy",      exchange: "SET", country: "TH" },
  { symbol: "BGRIM",  name: "B.Grimm Power PCL",                       sector: "Energy",      exchange: "SET", country: "TH" },
  { symbol: "SPRC",   name: "Star Petroleum Refining PCL",             sector: "Energy",      exchange: "SET", country: "TH" },
  { symbol: "EA",     name: "Energy Absolute PCL",                     sector: "Energy",      exchange: "SET", country: "TH" },
  { symbol: "BCPG",   name: "BCPG PCL",                                sector: "Energy",      exchange: "SET", country: "TH" },
  { symbol: "GUNKUL", name: "Gunkul Engineering PCL",                  sector: "Energy",      exchange: "SET", country: "TH" },
  // Finance / Banking / Insurance
  { symbol: "SCB",    name: "SCB X PCL",                               sector: "Finance",     exchange: "SET", country: "TH" },
  { symbol: "KBANK",  name: "Kasikornbank PCL",                        sector: "Finance",     exchange: "SET", country: "TH" },
  { symbol: "BBL",    name: "Bangkok Bank PCL",                        sector: "Finance",     exchange: "SET", country: "TH" },
  { symbol: "KTB",    name: "Krungthai Bank PCL",                      sector: "Finance",     exchange: "SET", country: "TH" },
  { symbol: "TTB",    name: "TMBThanachart Bank PCL",                  sector: "Finance",     exchange: "SET", country: "TH" },
  { symbol: "TISCO",  name: "TISCO Financial Group PCL",               sector: "Finance",     exchange: "SET", country: "TH" },
  { symbol: "KKP",    name: "Kiatnakin Phatra Bank PCL",               sector: "Finance",     exchange: "SET", country: "TH" },
  { symbol: "KTC",    name: "KrungThai Card PCL",                      sector: "Finance",     exchange: "SET", country: "TH" },
  { symbol: "MTC",    name: "Muangthai Capital PCL",                   sector: "Finance",     exchange: "SET", country: "TH" },
  { symbol: "TCAP",   name: "Thanachart Capital PCL",                  sector: "Finance",     exchange: "SET", country: "TH" },
  { symbol: "SAWAD",  name: "Srisawad Corporation PCL",                sector: "Finance",     exchange: "SET", country: "TH" },
  { symbol: "TLI",    name: "Thai Life Insurance PCL",                 sector: "Finance",     exchange: "SET", country: "TH" },
  { symbol: "BLA",    name: "Bangkok Life Assurance PCL",              sector: "Finance",     exchange: "SET", country: "TH" },
  { symbol: "TIDLOR", name: "TIDLOR Holdings PCL",                    sector: "Finance",     exchange: "SET", country: "TH" },
  { symbol: "AEONTS", name: "AEON Thana Sinsap (Thailand) PCL",       sector: "Finance",     exchange: "SET", country: "TH" },
  { symbol: "BAM",    name: "Bangkok Commercial Asset Management PCL", sector: "Finance",     exchange: "SET", country: "TH" },
  // Telecom / Tech
  { symbol: "ADVANC", name: "Advanced Info Service PCL",               sector: "Telecom",     exchange: "SET", country: "TH" },
  { symbol: "TRUE",   name: "True Corporation PCL",                    sector: "Telecom",     exchange: "SET", country: "TH" },
  { symbol: "DELTA",  name: "Delta Electronics (Thailand) PCL",        sector: "Technology",  exchange: "SET", country: "TH" },
  { symbol: "HANA",   name: "Hana Microelectronics PCL",               sector: "Technology",  exchange: "SET", country: "TH" },
  { symbol: "KCE",    name: "KCE Electronics PCL",                     sector: "Technology",  exchange: "SET", country: "TH" },
  { symbol: "CCET",   name: "Cal-Comp Electronics (Thailand) PCL",     sector: "Technology",  exchange: "SET", country: "TH" },
  { symbol: "JTS",    name: "Jasmine Technology Solution PCL",         sector: "Technology",  exchange: "SET", country: "TH" },
  // Retail / Consumer / Food
  { symbol: "CPALL",  name: "CP All PCL",                              sector: "Consumer",    exchange: "SET", country: "TH" },
  { symbol: "CPN",    name: "Central Pattana PCL",                     sector: "Consumer",    exchange: "SET", country: "TH" },
  { symbol: "CRC",    name: "Central Retail Corporation PCL",          sector: "Consumer",    exchange: "SET", country: "TH" },
  { symbol: "HMPRO",  name: "Home Product Center PCL",                 sector: "Consumer",    exchange: "SET", country: "TH" },
  { symbol: "GLOBAL", name: "Siam Global House PCL",                   sector: "Consumer",    exchange: "SET", country: "TH" },
  { symbol: "DOHOME", name: "Dohome PCL",                              sector: "Consumer",    exchange: "SET", country: "TH" },
  { symbol: "COM7",   name: "COM7 PCL",                                sector: "Consumer",    exchange: "SET", country: "TH" },
  { symbol: "BJC",    name: "Berli Jucker PCL",                        sector: "Consumer",    exchange: "SET", country: "TH" },
  { symbol: "MINT",   name: "Minor International PCL",                 sector: "Consumer",    exchange: "SET", country: "TH" },
  { symbol: "CENTEL", name: "Central Plaza Hotel PCL",                 sector: "Consumer",    exchange: "SET", country: "TH" },
  { symbol: "ERW",    name: "The Erawan Group PCL",                    sector: "Consumer",    exchange: "SET", country: "TH" },
  { symbol: "CPF",    name: "Charoen Pokphand Foods PCL",              sector: "Consumer",    exchange: "SET", country: "TH" },
  { symbol: "TU",     name: "Thai Union Group PCL",                    sector: "Consumer",    exchange: "SET", country: "TH" },
  { symbol: "TFG",    name: "Thaifoods Group PCL",                     sector: "Consumer",    exchange: "SET", country: "TH" },
  { symbol: "BTG",    name: "Betagro PCL",                             sector: "Consumer",    exchange: "SET", country: "TH" },
  { symbol: "OSP",    name: "Osotspa PCL",                             sector: "Consumer",    exchange: "SET", country: "TH" },
  { symbol: "CBG",    name: "Carabao Group PCL",                       sector: "Consumer",    exchange: "SET", country: "TH" },
  { symbol: "M",      name: "MK Restaurant Group PCL",                 sector: "Consumer",    exchange: "SET", country: "TH" },
  { symbol: "ICHI",   name: "Ichitan Group PCL",                       sector: "Consumer",    exchange: "SET", country: "TH" },
  { symbol: "GFPT",   name: "GFPT PCL",                                sector: "Consumer",    exchange: "SET", country: "TH" },
  // Healthcare
  { symbol: "BDMS",   name: "Bangkok Dusit Medical Services PCL",      sector: "Healthcare",  exchange: "SET", country: "TH" },
  { symbol: "BH",     name: "Bumrungrad Hospital PCL",                 sector: "Healthcare",  exchange: "SET", country: "TH" },
  { symbol: "BCH",    name: "Bangkok Chain Hospital PCL",              sector: "Healthcare",  exchange: "SET", country: "TH" },
  { symbol: "CHG",    name: "Chularat Hospital PCL",                   sector: "Healthcare",  exchange: "SET", country: "TH" },
  { symbol: "PR9",    name: "Praram 9 Hospital PCL",                   sector: "Healthcare",  exchange: "SET", country: "TH" },
  { symbol: "MEGA",   name: "Mega Lifesciences PCL",                   sector: "Healthcare",  exchange: "SET", country: "TH" },
  // Industrial / Materials
  { symbol: "SCC",    name: "SCG (Siam Cement Group) PCL",             sector: "Industrial",  exchange: "SET", country: "TH" },
  { symbol: "SCGP",   name: "SCG Packaging PCL",                       sector: "Industrial",  exchange: "SET", country: "TH" },
  { symbol: "IVL",    name: "Indorama Ventures PCL",                   sector: "Industrial",  exchange: "SET", country: "TH" },
  { symbol: "WHA",    name: "WHA Corporation PCL",                     sector: "Industrial",  exchange: "SET", country: "TH" },
  { symbol: "AMATA",  name: "Amata Corporation PCL",                   sector: "Industrial",  exchange: "SET", country: "TH" },
  { symbol: "TOA",    name: "TOA Paint (Thailand) PCL",                sector: "Industrial",  exchange: "SET", country: "TH" },
  { symbol: "STA",    name: "Sri Trang Agro-Industry PCL",             sector: "Industrial",  exchange: "SET", country: "TH" },
  { symbol: "STGT",   name: "Sri Trang Gloves (Thailand) PCL",         sector: "Industrial",  exchange: "SET", country: "TH" },
  { symbol: "TASCO",  name: "Tipco Asphalt PCL",                       sector: "Industrial",  exchange: "SET", country: "TH" },
  { symbol: "CK",     name: "CH. Karnchang PCL",                       sector: "Industrial",  exchange: "SET", country: "TH" },
  // Transport / Infrastructure
  { symbol: "AOT",    name: "Airports of Thailand PCL",                sector: "Transport",   exchange: "SET", country: "TH" },
  { symbol: "BTS",    name: "BTS Group Holdings PCL",                  sector: "Transport",   exchange: "SET", country: "TH" },
  { symbol: "BEM",    name: "Bangkok Expressway and Metro PCL",        sector: "Transport",   exchange: "SET", country: "TH" },
  { symbol: "BA",     name: "Bangkok Airways PCL",                     sector: "Transport",   exchange: "SET", country: "TH" },
  { symbol: "AAV",    name: "Asia Aviation PCL",                       sector: "Transport",   exchange: "SET", country: "TH" },
  { symbol: "RCL",    name: "Regional Container Lines PCL",            sector: "Transport",   exchange: "SET", country: "TH" },
  { symbol: "SJWD",   name: "SCGJWD Logistics PCL",                    sector: "Transport",   exchange: "SET", country: "TH" },
  // Real Estate
  { symbol: "LH",     name: "Land and Houses PCL",                     sector: "Real Estate", exchange: "SET", country: "TH" },
  { symbol: "SPALI",  name: "Supalai PCL",                             sector: "Real Estate", exchange: "SET", country: "TH" },
  { symbol: "AP",     name: "AP (Thailand) PCL",                       sector: "Real Estate", exchange: "SET", country: "TH" },
  { symbol: "SIRI",   name: "Sansiri PCL",                             sector: "Real Estate", exchange: "SET", country: "TH" },
  { symbol: "AWC",    name: "Asset World Corporation PCL",             sector: "Real Estate", exchange: "SET", country: "TH" },
  { symbol: "QH",     name: "Quality Houses PCL",                      sector: "Real Estate", exchange: "SET", country: "TH" },
  // Media / Services
  { symbol: "VGI",    name: "VGI PCL",                                 sector: "Services",    exchange: "SET", country: "TH" },
  { symbol: "PLANB",  name: "Plan B Media PCL",                        sector: "Services",    exchange: "SET", country: "TH" },
  { symbol: "JMT",    name: "JMT Network Services PCL",               sector: "Services",    exchange: "SET", country: "TH" },
  { symbol: "PTG",    name: "PTG Energy PCL",                          sector: "Energy",      exchange: "SET", country: "TH" },
];

// ─── หุ้น US (NYSE / NASDAQ) ─────────────────────────────────────────────────
const usStocks: StockSeed[] = [
  // Technology
  { symbol: "AAPL",   name: "Apple Inc.",                              sector: "Technology",  exchange: "NASDAQ", country: "US" },
  { symbol: "MSFT",   name: "Microsoft Corporation",                   sector: "Technology",  exchange: "NASDAQ", country: "US" },
  { symbol: "GOOGL",  name: "Alphabet Inc.",                           sector: "Technology",  exchange: "NASDAQ", country: "US" },
  { symbol: "NVDA",   name: "NVIDIA Corporation",                      sector: "Technology",  exchange: "NASDAQ", country: "US" },
  { symbol: "META",   name: "Meta Platforms Inc.",                     sector: "Technology",  exchange: "NASDAQ", country: "US" },
  { symbol: "AVGO",   name: "Broadcom Inc.",                           sector: "Technology",  exchange: "NASDAQ", country: "US" },
  { symbol: "AMD",    name: "Advanced Micro Devices Inc.",             sector: "Technology",  exchange: "NASDAQ", country: "US" },
  { symbol: "INTC",   name: "Intel Corporation",                       sector: "Technology",  exchange: "NASDAQ", country: "US" },
  { symbol: "QCOM",   name: "Qualcomm Inc.",                           sector: "Technology",  exchange: "NASDAQ", country: "US" },
  { symbol: "TXN",    name: "Texas Instruments Inc.",                  sector: "Technology",  exchange: "NASDAQ", country: "US" },
  { symbol: "CRM",    name: "Salesforce Inc.",                         sector: "Technology",  exchange: "NYSE",   country: "US" },
  { symbol: "ORCL",   name: "Oracle Corporation",                      sector: "Technology",  exchange: "NYSE",   country: "US" },
  { symbol: "SAP",    name: "SAP SE",                                  sector: "Technology",  exchange: "NYSE",   country: "US" },
  { symbol: "IBM",    name: "International Business Machines Corp.",   sector: "Technology",  exchange: "NYSE",   country: "US" },
  { symbol: "CSCO",   name: "Cisco Systems Inc.",                      sector: "Technology",  exchange: "NASDAQ", country: "US" },
  { symbol: "HPQ",    name: "HP Inc.",                                  sector: "Technology",  exchange: "NYSE",   country: "US" },
  { symbol: "DELL",   name: "Dell Technologies Inc.",                  sector: "Technology",  exchange: "NYSE",   country: "US" },
  // E-Commerce / Consumer Internet
  { symbol: "AMZN",   name: "Amazon.com Inc.",                         sector: "Consumer",    exchange: "NASDAQ", country: "US" },
  { symbol: "TSLA",   name: "Tesla Inc.",                              sector: "Consumer",    exchange: "NASDAQ", country: "US" },
  { symbol: "NFLX",   name: "Netflix Inc.",                            sector: "Consumer",    exchange: "NASDAQ", country: "US" },
  { symbol: "DIS",    name: "The Walt Disney Company",                 sector: "Consumer",    exchange: "NYSE",   country: "US" },
  { symbol: "NKE",    name: "Nike Inc.",                               sector: "Consumer",    exchange: "NYSE",   country: "US" },
  { symbol: "MCD",    name: "McDonald's Corporation",                  sector: "Consumer",    exchange: "NYSE",   country: "US" },
  { symbol: "SBUX",   name: "Starbucks Corporation",                   sector: "Consumer",    exchange: "NASDAQ", country: "US" },
  // Finance
  { symbol: "BRK-B",  name: "Berkshire Hathaway Inc.",                 sector: "Finance",     exchange: "NYSE",   country: "US" },
  { symbol: "JPM",    name: "JPMorgan Chase & Co.",                    sector: "Finance",     exchange: "NYSE",   country: "US" },
  { symbol: "BAC",    name: "Bank of America Corporation",             sector: "Finance",     exchange: "NYSE",   country: "US" },
  { symbol: "WFC",    name: "Wells Fargo & Company",                   sector: "Finance",     exchange: "NYSE",   country: "US" },
  { symbol: "GS",     name: "The Goldman Sachs Group Inc.",            sector: "Finance",     exchange: "NYSE",   country: "US" },
  { symbol: "MS",     name: "Morgan Stanley",                          sector: "Finance",     exchange: "NYSE",   country: "US" },
  { symbol: "C",      name: "Citigroup Inc.",                          sector: "Finance",     exchange: "NYSE",   country: "US" },
  { symbol: "V",      name: "Visa Inc.",                               sector: "Finance",     exchange: "NYSE",   country: "US" },
  { symbol: "MA",     name: "Mastercard Inc.",                         sector: "Finance",     exchange: "NYSE",   country: "US" },
  { symbol: "AXP",    name: "American Express Company",                sector: "Finance",     exchange: "NYSE",   country: "US" },
  // Healthcare
  { symbol: "JNJ",    name: "Johnson & Johnson",                       sector: "Healthcare",  exchange: "NYSE",   country: "US" },
  { symbol: "LLY",    name: "Eli Lilly and Company",                   sector: "Healthcare",  exchange: "NYSE",   country: "US" },
  { symbol: "ABBV",   name: "AbbVie Inc.",                             sector: "Healthcare",  exchange: "NYSE",   country: "US" },
  { symbol: "MRK",    name: "Merck & Co. Inc.",                        sector: "Healthcare",  exchange: "NYSE",   country: "US" },
  { symbol: "PFE",    name: "Pfizer Inc.",                             sector: "Healthcare",  exchange: "NYSE",   country: "US" },
  { symbol: "UNH",    name: "UnitedHealth Group Inc.",                 sector: "Healthcare",  exchange: "NYSE",   country: "US" },
  { symbol: "AMGN",   name: "Amgen Inc.",                              sector: "Healthcare",  exchange: "NASDAQ", country: "US" },
  // Retail / Consumer Staples
  { symbol: "WMT",    name: "Walmart Inc.",                            sector: "Consumer",    exchange: "NYSE",   country: "US" },
  { symbol: "COST",   name: "Costco Wholesale Corporation",            sector: "Consumer",    exchange: "NASDAQ", country: "US" },
  { symbol: "HD",     name: "The Home Depot Inc.",                     sector: "Consumer",    exchange: "NYSE",   country: "US" },
  { symbol: "LOW",    name: "Lowe's Companies Inc.",                   sector: "Consumer",    exchange: "NYSE",   country: "US" },
  { symbol: "TGT",    name: "Target Corporation",                      sector: "Consumer",    exchange: "NYSE",   country: "US" },
  { symbol: "KO",     name: "The Coca-Cola Company",                   sector: "Consumer",    exchange: "NYSE",   country: "US" },
  { symbol: "PEP",    name: "PepsiCo Inc.",                            sector: "Consumer",    exchange: "NASDAQ", country: "US" },
  { symbol: "PG",     name: "Procter & Gamble Co.",                    sector: "Consumer",    exchange: "NYSE",   country: "US" },
  { symbol: "PM",     name: "Philip Morris International Inc.",        sector: "Consumer",    exchange: "NYSE",   country: "US" },
  // Energy
  { symbol: "CVX",    name: "Chevron Corporation",                     sector: "Energy",      exchange: "NYSE",   country: "US" },
  { symbol: "XOM",    name: "Exxon Mobil Corporation",                 sector: "Energy",      exchange: "NYSE",   country: "US" },
  // Industrial
  { symbol: "CAT",    name: "Caterpillar Inc.",                        sector: "Industrial",  exchange: "NYSE",   country: "US" },
  { symbol: "GE",     name: "GE Aerospace",                            sector: "Industrial",  exchange: "NYSE",   country: "US" },
  { symbol: "BA",     name: "The Boeing Company",                      sector: "Industrial",  exchange: "NYSE",   country: "US" },
  { symbol: "RTX",    name: "RTX Corporation",                         sector: "Industrial",  exchange: "NYSE",   country: "US" },
  // Telecom
  { symbol: "T",      name: "AT&T Inc.",                               sector: "Telecom",     exchange: "NYSE",   country: "US" },
  { symbol: "VZ",     name: "Verizon Communications Inc.",             sector: "Telecom",     exchange: "NYSE",   country: "US" },
];

async function main() {
  const allStocks = [...thaiStocks, ...usStocks];

  console.log(`\nSeeding ${thaiStocks.length} Thai stocks + ${usStocks.length} US stocks = ${allStocks.length} total\n`);

  let created = 0;
  let skipped = 0;

  for (const stock of allStocks) {
    const existing = await prisma.stock.findUnique({ where: { symbol: stock.symbol } });
    if (existing) {
      console.log(`  ⏭  [${stock.country}] ${stock.symbol} — already exists, skipping`);
      skipped++;
      continue;
    }

    await prisma.stock.create({
      data: {
        symbol:      stock.symbol,
        name:        stock.name,
        sector:      stock.sector,
        exchange:    stock.exchange,
        isPublished: false,
      },
    });

    console.log(`  ✅ [${stock.country}] ${stock.symbol} — ${stock.name}`);
    created++;
  }

  console.log(`\nDone! Created: ${created}, Skipped (exists): ${skipped}\n`);
  console.log("Next step: Go to /admin and click 'Generate AI Analysis' for each stock.\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
