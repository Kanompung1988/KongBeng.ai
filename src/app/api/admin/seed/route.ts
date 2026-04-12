export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

type StockSeed = { symbol: string; name: string; sector: string; exchange: string };

const THAI_STOCKS: StockSeed[] = [
  { symbol: "PTT",     name: "PTT Public Company Limited",              sector: "Energy",      exchange: "SET" },
  { symbol: "PTTEP",   name: "PTT Exploration and Production PCL",      sector: "Energy",      exchange: "SET" },
  { symbol: "TOP",     name: "Thai Oil PCL",                            sector: "Energy",      exchange: "SET" },
  { symbol: "IRPC",    name: "IRPC PCL",                                sector: "Energy",      exchange: "SET" },
  { symbol: "PTTGC",   name: "PTT Global Chemical PCL",                 sector: "Energy",      exchange: "SET" },
  { symbol: "GULF",    name: "Gulf Energy Development PCL",             sector: "Energy",      exchange: "SET" },
  { symbol: "GPSC",    name: "Global Power Synergy PCL",                sector: "Energy",      exchange: "SET" },
  { symbol: "SCB",     name: "SCB X PCL",                               sector: "Finance",     exchange: "SET" },
  { symbol: "KBANK",   name: "Kasikornbank PCL",                        sector: "Finance",     exchange: "SET" },
  { symbol: "BBL",     name: "Bangkok Bank PCL",                        sector: "Finance",     exchange: "SET" },
  { symbol: "KTB",     name: "Krungthai Bank PCL",                      sector: "Finance",     exchange: "SET" },
  { symbol: "TTB",     name: "TTB Bank PCL",                            sector: "Finance",     exchange: "SET" },
  { symbol: "TISCO",   name: "TISCO Financial Group PCL",               sector: "Finance",     exchange: "SET" },
  { symbol: "KKP",     name: "Kiatnakin Phatra Bank PCL",               sector: "Finance",     exchange: "SET" },
  { symbol: "BAY",     name: "Bank of Ayudhya PCL",                     sector: "Finance",     exchange: "SET" },
  { symbol: "ADVANC",  name: "Advanced Info Service PCL",               sector: "Telecom",     exchange: "SET" },
  { symbol: "TRUE",    name: "True Corporation PCL",                    sector: "Telecom",     exchange: "SET" },
  { symbol: "INTOUCH", name: "Intouch Holdings PCL",                    sector: "Telecom",     exchange: "SET" },
  { symbol: "CPALL",   name: "CP All PCL",                              sector: "Consumer",    exchange: "SET" },
  { symbol: "CPN",     name: "Central Pattana PCL",                     sector: "Consumer",    exchange: "SET" },
  { symbol: "HMPRO",   name: "Home Product Center PCL",                 sector: "Consumer",    exchange: "SET" },
  { symbol: "COM7",    name: "COM7 PCL",                                sector: "Consumer",    exchange: "SET" },
  { symbol: "MK",      name: "MK Restaurant Group PCL",                 sector: "Consumer",    exchange: "SET" },
  { symbol: "MINT",    name: "Minor International PCL",                 sector: "Consumer",    exchange: "SET" },
  { symbol: "CENTEL",  name: "Central Plaza Hotel PCL",                 sector: "Consumer",    exchange: "SET" },
  { symbol: "BDMS",    name: "Bangkok Dusit Medical Services PCL",      sector: "Healthcare",  exchange: "SET" },
  { symbol: "BH",      name: "Bumrungrad Hospital PCL",                 sector: "Healthcare",  exchange: "SET" },
  { symbol: "BCH",     name: "Bangkok Chain Hospital PCL",              sector: "Healthcare",  exchange: "SET" },
  { symbol: "CHG",     name: "Chularat Hospital PCL",                   sector: "Healthcare",  exchange: "SET" },
  { symbol: "SCC",     name: "SCG (Siam Cement Group) PCL",             sector: "Industrial",  exchange: "SET" },
  { symbol: "TU",      name: "Thai Union Group PCL",                    sector: "Industrial",  exchange: "SET" },
  { symbol: "IVL",     name: "Indorama Ventures PCL",                   sector: "Industrial",  exchange: "SET" },
  { symbol: "WHA",     name: "WHA Corporation PCL",                     sector: "Industrial",  exchange: "SET" },
  { symbol: "AOT",     name: "Airports of Thailand PCL",                sector: "Transport",   exchange: "SET" },
  { symbol: "BTS",     name: "BTS Group Holdings PCL",                  sector: "Transport",   exchange: "SET" },
  { symbol: "AAV",     name: "Asia Aviation PCL",                       sector: "Transport",   exchange: "SET" },
  { symbol: "THAI",    name: "Thai Airways International PCL",          sector: "Transport",   exchange: "SET" },
  { symbol: "LH",      name: "Land and Houses PCL",                     sector: "Real Estate", exchange: "SET" },
  { symbol: "SPALI",   name: "Supalai PCL",                             sector: "Real Estate", exchange: "SET" },
  { symbol: "AP",      name: "AP (Thailand) PCL",                       sector: "Real Estate", exchange: "SET" },
  { symbol: "AWC",     name: "Asset World Corporation PCL",             sector: "Real Estate", exchange: "SET" },
];

const US_STOCKS: StockSeed[] = [
  { symbol: "AAPL",   name: "Apple Inc.",                              sector: "Technology",  exchange: "NASDAQ" },
  { symbol: "MSFT",   name: "Microsoft Corporation",                   sector: "Technology",  exchange: "NASDAQ" },
  { symbol: "GOOGL",  name: "Alphabet Inc.",                           sector: "Technology",  exchange: "NASDAQ" },
  { symbol: "NVDA",   name: "NVIDIA Corporation",                      sector: "Technology",  exchange: "NASDAQ" },
  { symbol: "META",   name: "Meta Platforms Inc.",                     sector: "Technology",  exchange: "NASDAQ" },
  { symbol: "AVGO",   name: "Broadcom Inc.",                           sector: "Technology",  exchange: "NASDAQ" },
  { symbol: "AMD",    name: "Advanced Micro Devices Inc.",             sector: "Technology",  exchange: "NASDAQ" },
  { symbol: "INTC",   name: "Intel Corporation",                       sector: "Technology",  exchange: "NASDAQ" },
  { symbol: "QCOM",   name: "Qualcomm Inc.",                           sector: "Technology",  exchange: "NASDAQ" },
  { symbol: "CRM",    name: "Salesforce Inc.",                         sector: "Technology",  exchange: "NYSE"   },
  { symbol: "ORCL",   name: "Oracle Corporation",                      sector: "Technology",  exchange: "NYSE"   },
  { symbol: "IBM",    name: "International Business Machines Corp.",   sector: "Technology",  exchange: "NYSE"   },
  { symbol: "CSCO",   name: "Cisco Systems Inc.",                      sector: "Technology",  exchange: "NASDAQ" },
  { symbol: "HPQ",    name: "HP Inc.",                                  sector: "Technology",  exchange: "NYSE"   },
  { symbol: "DELL",   name: "Dell Technologies Inc.",                  sector: "Technology",  exchange: "NYSE"   },
  { symbol: "AMZN",   name: "Amazon.com Inc.",                         sector: "Consumer",    exchange: "NASDAQ" },
  { symbol: "TSLA",   name: "Tesla Inc.",                              sector: "Consumer",    exchange: "NASDAQ" },
  { symbol: "NFLX",   name: "Netflix Inc.",                            sector: "Consumer",    exchange: "NASDAQ" },
  { symbol: "DIS",    name: "The Walt Disney Company",                 sector: "Consumer",    exchange: "NYSE"   },
  { symbol: "NKE",    name: "Nike Inc.",                               sector: "Consumer",    exchange: "NYSE"   },
  { symbol: "MCD",    name: "McDonald's Corporation",                  sector: "Consumer",    exchange: "NYSE"   },
  { symbol: "SBUX",   name: "Starbucks Corporation",                   sector: "Consumer",    exchange: "NASDAQ" },
  { symbol: "WMT",    name: "Walmart Inc.",                            sector: "Consumer",    exchange: "NYSE"   },
  { symbol: "COST",   name: "Costco Wholesale Corporation",            sector: "Consumer",    exchange: "NASDAQ" },
  { symbol: "HD",     name: "The Home Depot Inc.",                     sector: "Consumer",    exchange: "NYSE"   },
  { symbol: "KO",     name: "The Coca-Cola Company",                   sector: "Consumer",    exchange: "NYSE"   },
  { symbol: "PEP",    name: "PepsiCo Inc.",                            sector: "Consumer",    exchange: "NASDAQ" },
  { symbol: "PG",     name: "Procter & Gamble Co.",                    sector: "Consumer",    exchange: "NYSE"   },
  { symbol: "JPM",    name: "JPMorgan Chase & Co.",                    sector: "Finance",     exchange: "NYSE"   },
  { symbol: "BAC",    name: "Bank of America Corporation",             sector: "Finance",     exchange: "NYSE"   },
  { symbol: "WFC",    name: "Wells Fargo & Company",                   sector: "Finance",     exchange: "NYSE"   },
  { symbol: "GS",     name: "The Goldman Sachs Group Inc.",            sector: "Finance",     exchange: "NYSE"   },
  { symbol: "MS",     name: "Morgan Stanley",                          sector: "Finance",     exchange: "NYSE"   },
  { symbol: "V",      name: "Visa Inc.",                               sector: "Finance",     exchange: "NYSE"   },
  { symbol: "MA",     name: "Mastercard Inc.",                         sector: "Finance",     exchange: "NYSE"   },
  { symbol: "JNJ",    name: "Johnson & Johnson",                       sector: "Healthcare",  exchange: "NYSE"   },
  { symbol: "LLY",    name: "Eli Lilly and Company",                   sector: "Healthcare",  exchange: "NYSE"   },
  { symbol: "ABBV",   name: "AbbVie Inc.",                             sector: "Healthcare",  exchange: "NYSE"   },
  { symbol: "MRK",    name: "Merck & Co. Inc.",                        sector: "Healthcare",  exchange: "NYSE"   },
  { symbol: "PFE",    name: "Pfizer Inc.",                             sector: "Healthcare",  exchange: "NYSE"   },
  { symbol: "UNH",    name: "UnitedHealth Group Inc.",                 sector: "Healthcare",  exchange: "NYSE"   },
  { symbol: "CVX",    name: "Chevron Corporation",                     sector: "Energy",      exchange: "NYSE"   },
  { symbol: "XOM",    name: "Exxon Mobil Corporation",                 sector: "Energy",      exchange: "NYSE"   },
  { symbol: "CAT",    name: "Caterpillar Inc.",                        sector: "Industrial",  exchange: "NYSE"   },
  { symbol: "GE",     name: "GE Aerospace",                            sector: "Industrial",  exchange: "NYSE"   },
  { symbol: "T",      name: "AT&T Inc.",                               sector: "Telecom",     exchange: "NYSE"   },
  { symbol: "VZ",     name: "Verizon Communications Inc.",             sector: "Telecom",     exchange: "NYSE"   },
];

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (adminEmails.length === 0 || !adminEmails.includes(user.email.toLowerCase())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allStocks = [...THAI_STOCKS, ...US_STOCKS];
  let created = 0;
  let skipped = 0;

  for (const stock of allStocks) {
    const existing = await prisma.stock.findUnique({ where: { symbol: stock.symbol } });
    if (existing) { skipped++; continue; }
    await prisma.stock.create({
      data: { symbol: stock.symbol, name: stock.name, sector: stock.sector, exchange: stock.exchange, isPublished: false },
    });
    created++;
  }

  return NextResponse.json({ ok: true, created, skipped, total: allStocks.length });
}
