/**
 * Bulk update stock logos using Google favicon service.
 * Merges domain maps from logo.ts and populate-all-stocks.ts.
 *
 * Usage: npx tsx scripts/bulk-update-logos.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DOMAINS: Record<string, string> = {
  // Thai
  PTT: "pttplc.com", PTTEP: "pttep.com", TOP: "thaioilgroup.com", IRPC: "irpc.co.th",
  PTTGC: "pttgcgroup.com", GULF: "gulf.co.th", GPSC: "gpscgroup.com", OR: "pttor.com",
  BANPU: "banpu.com", BCP: "bangchak.co.th", RATCH: "ratch.co.th", EGCO: "egco.com",
  BGRIM: "bgrimmpower.com", SPRC: "sprc.co.th", EA: "energyabsolute.co.th",
  BCPG: "bcpggroup.com", GUNKUL: "gunkul.com", PTG: "ptgenergy.co.th",
  SCB: "scb.co.th", KBANK: "kasikornbank.com", BBL: "bangkokbank.com", KTB: "krungthai.com",
  TTB: "ttbbank.com", TISCO: "tisco.co.th", KKP: "kkpfg.com", KTC: "ktc.co.th",
  MTC: "muangthaicap.com", TCAP: "thanachartcapital.co.th", SAWAD: "srisawadpower.com",
  TLI: "thailife.com", BLA: "bangkoklife.com", TIDLOR: "tidlor.com", AEONTS: "aeon.co.th",
  BAM: "bam.co.th", ADVANC: "ais.th", TRUE: "true.th", DELTA: "deltathailand.com",
  HANA: "hanagroup.com", KCE: "kce.co.th", CPALL: "cpall.co.th", CPN: "centralpattana.co.th",
  CRC: "centralretail.com", HMPRO: "homepro.co.th", GLOBAL: "siamglobalhouse.com",
  DOHOME: "dohome.co.th", COM7: "com7.co.th", BJC: "bjc.co.th", MINT: "minor.com",
  CENTEL: "centarahotelsresorts.com", ERW: "theerawan.com", CPF: "cpfworldwide.com",
  TU: "thaiunion.com", TFG: "thaifoodsgroup.com", BTG: "betagro.com", OSP: "osotspa.com",
  CBG: "carabaogroup.com", M: "mkrestaurant.com", ICHI: "ichitangroup.com", GFPT: "gfpt.co.th",
  BDMS: "bdms.co.th", BH: "bumrungrad.com", BCH: "bangkokchainhospital.com",
  CHG: "chularat.com", PR9: "praram9.com", MEGA: "megawecare.com",
  SCC: "scg.com", SCGP: "scgpackaging.com", IVL: "indoramaventures.com",
  WHA: "wha-group.com", AMATA: "amata.com", TOA: "toagroup.com",
  STA: "sritranggroup.com", STGT: "sritranggloves.com", TASCO: "tipcoasphalt.com",
  CK: "ch-karnchang.co.th", AOT: "airportthai.co.th", BTS: "btsgroup.co.th",
  BEM: "bangkokmetro.co.th", BA: "bangkokair.com", AAV: "asiaaviation.com",
  RCL: "rclgroup.com", SJWD: "scgjwdlogistics.com", LH: "lh.co.th",
  SPALI: "supalai.com", AP: "apthai.com", SIRI: "sansiri.com",
  AWC: "assetworldcorp-th.com", QH: "qh.co.th", VGI: "vgigroup.com",
  PLANB: "planbmedia.co.th", JMT: "jmtnetwork.co.th",
  // US — mega cap
  AAPL: "apple.com", MSFT: "microsoft.com", GOOGL: "google.com", GOOG: "google.com",
  AMZN: "amazon.com", META: "meta.com", NVDA: "nvidia.com", TSLA: "tesla.com",
  "BRK-B": "berkshirehathaway.com",
  // US — finance
  JPM: "jpmorganchase.com", BAC: "bankofamerica.com", WFC: "wellsfargo.com",
  GS: "goldmansachs.com", MS: "morganstanley.com", C: "citigroup.com",
  V: "visa.com", MA: "mastercard.com", AXP: "americanexpress.com",
  BLK: "blackrock.com", SCHW: "schwab.com", ICE: "ice.com", CME: "cmegroup.com",
  MCO: "moodys.com", SPGI: "spglobal.com", MSCI: "msci.com",
  COF: "capitalone.com", USB: "usbank.com", PNC: "pnc.com", TFC: "truist.com",
  // US — tech
  CRM: "salesforce.com", ORCL: "oracle.com", IBM: "ibm.com", CSCO: "cisco.com",
  INTC: "intel.com", AMD: "amd.com", QCOM: "qualcomm.com", AVGO: "broadcom.com",
  TXN: "ti.com", ADBE: "adobe.com", NOW: "servicenow.com", INTU: "intuit.com",
  SNPS: "synopsys.com", CDNS: "cadence.com", PANW: "paloaltonetworks.com",
  CRWD: "crowdstrike.com", FTNT: "fortinet.com", ZS: "zscaler.com",
  KLAC: "kla.com", LRCX: "lamresearch.com", AMAT: "appliedmaterials.com",
  MRVL: "marvell.com", MU: "micron.com", ON: "onsemi.com", NXPI: "nxp.com",
  MCHP: "microchip.com", HPQ: "hp.com", DELL: "dell.com",
  PLTR: "palantir.com", SNOW: "snowflake.com", UBER: "uber.com",
  ABNB: "airbnb.com", SQ: "squareup.com", SHOP: "shopify.com", SPOT: "spotify.com",
  ZM: "zoom.us", COIN: "coinbase.com", HOOD: "robinhood.com",
  RIVN: "rivian.com", LCID: "lucidmotors.com", SOFI: "sofi.com",
  RBLX: "roblox.com", U: "unity.com", ARM: "arm.com",
  // US — consumer
  NFLX: "netflix.com", DIS: "disney.com", NKE: "nike.com", SBUX: "starbucks.com",
  MCD: "mcdonalds.com", KO: "coca-cola.com", PEP: "pepsico.com", PG: "pg.com",
  PM: "pmi.com", WMT: "walmart.com", COST: "costco.com", HD: "homedepot.com",
  LOW: "lowes.com", TGT: "target.com", ROST: "rossstores.com", TJX: "tjx.com",
  ORLY: "oreillyauto.com", AZO: "autozone.com", LULU: "lululemon.com",
  YUM: "yum.com", DPZ: "dominos.com", CMG: "chipotle.com",
  MAR: "marriott.com", HLT: "hilton.com", PYPL: "paypal.com",
  // US — healthcare
  JNJ: "jnj.com", LLY: "lilly.com", ABBV: "abbvie.com", MRK: "merck.com",
  PFE: "pfizer.com", UNH: "unitedhealthgroup.com", AMGN: "amgen.com", ABT: "abbott.com",
  ISRG: "intuitive.com", DHR: "danaher.com", TMO: "thermofisher.com",
  SYK: "stryker.com", BSX: "bostonscientific.com", MDT: "medtronic.com",
  ZTS: "zoetis.com", REGN: "regeneron.com", VRTX: "vrtx.com",
  GILD: "gilead.com", BIIB: "biogen.com", MRNA: "modernatx.com",
  // US — industrials
  GE: "ge.com", CAT: "caterpillar.com", HON: "honeywell.com", DE: "deere.com",
  RTX: "rtx.com", LMT: "lockheedmartin.com", UPS: "ups.com", FDX: "fedex.com",
  ITW: "itw.com", EMR: "emerson.com", MMM: "3m.com", GM: "gm.com", F: "ford.com",
  // US — energy
  XOM: "exxonmobil.com", CVX: "chevron.com", COP: "conocophillips.com",
  SLB: "slb.com", EOG: "eogresources.com", MPC: "marathonpetroleum.com",
  PSX: "phillips66.com", VLO: "valero.com",
  // US — telecom
  T: "att.com", VZ: "verizon.com", TMUS: "t-mobile.com", CMCSA: "comcast.com",
  CHTR: "charter.com",
  // US — utilities/REIT
  NEE: "nexteraenergy.com", DUK: "duke-energy.com", SO: "southerncompany.com",
  AEP: "aep.com", PLD: "prologis.com", AMT: "americantower.com",
  CCI: "crowncastle.com", EQIX: "equinix.com",
  // US — materials
  APD: "airproducts.com", SHW: "sherwin-williams.com", ECL: "ecolab.com", LIN: "linde.com",
  // US — services
  ADP: "adp.com", PAYX: "paychex.com", CTAS: "cintas.com",
  WM: "wm.com", RSG: "republicservices.com",
  // US — other
  BABA: "alibaba.com", TSM: "tsmc.com", ASML: "asml.com",
};

async function main() {
  const stocks = await prisma.stock.findMany({
    where: { logoUrl: null },
    select: { id: true, symbol: true, exchange: true },
  });
  console.log(`Stocks without logo: ${stocks.length}`);

  let updated = 0;
  for (const s of stocks) {
    const domain = DOMAINS[s.symbol];
    if (domain) {
      const logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      await prisma.stock.update({ where: { id: s.id }, data: { logoUrl } });
      updated++;
    }
  }

  const totalWith = await prisma.stock.count({ where: { logoUrl: { not: null } } });
  const totalWithout = await prisma.stock.count({ where: { logoUrl: null } });
  console.log(`Updated: ${updated}`);
  console.log(`Total with logo: ${totalWith}`);
  console.log(`Still without logo: ${totalWithout}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
