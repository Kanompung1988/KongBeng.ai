// Stock logo fetching utility
// Priority: Clearbit (mapped stocks) → Google favicon fallback
// Google favicon falls back gracefully via naturalWidth ≤ 16 check in StockLogo

const US_DOMAIN_MAP: Record<string, string> = {
  AAPL: "apple.com", MSFT: "microsoft.com", GOOGL: "google.com", AMZN: "amazon.com",
  META: "meta.com", NVDA: "nvidia.com", TSLA: "tesla.com", BRK: "berkshirehathaway.com",
  JPM: "jpmorganchase.com", V: "visa.com", JNJ: "jnj.com", WMT: "walmart.com",
  MA: "mastercard.com", PG: "pg.com", UNH: "unitedhealthgroup.com", HD: "homedepot.com",
  DIS: "disney.com", PYPL: "paypal.com", NFLX: "netflix.com", ADBE: "adobe.com",
  CRM: "salesforce.com", INTC: "intel.com", CSCO: "cisco.com", PEP: "pepsico.com",
  KO: "coca-cola.com", ABT: "abbott.com", MRK: "merck.com", COST: "costco.com",
  AMD: "amd.com", QCOM: "qualcomm.com", AVGO: "broadcom.com", TXN: "ti.com",
  ORCL: "oracle.com", IBM: "ibm.com", GS: "goldmansachs.com", BA: "boeing.com",
  CAT: "caterpillar.com", MMM: "3m.com", NKE: "nike.com", SBUX: "starbucks.com",
  MCD: "mcdonalds.com", T: "att.com", VZ: "verizon.com", LMT: "lockheedmartin.com",
  RTX: "rtx.com", GE: "ge.com", UPS: "ups.com", FDX: "fedex.com",
  GM: "gm.com", F: "ford.com", XOM: "exxonmobil.com", CVX: "chevron.com",
  GOOG: "google.com", BABA: "alibaba.com", TSM: "tsmc.com", ASML: "asml.com",
  ARM: "arm.com", PLTR: "palantir.com", SNOW: "snowflake.com", UBER: "uber.com",
  ABNB: "airbnb.com", SQ: "squareup.com", SHOP: "shopify.com", SPOT: "spotify.com",
  ZM: "zoom.us", COIN: "coinbase.com", HOOD: "robinhood.com", RIVN: "rivian.com",
  LCID: "lucidmotors.com", SOFI: "sofi.com", RBLX: "roblox.com", U: "unity.com",
};

const THAI_DOMAIN_MAP: Record<string, string> = {
  // Big banks & finance
  PTT: "pttplc.com", ADVANC: "advanc.co.th", CPALL: "cpall.co.th", SCC: "scg.com",
  BDMS: "bdms.co.th", AOT: "airportthai.co.th", KBANK: "kasikornbank.com", SCB: "scb.co.th",
  BBL: "bangkokbank.com", KTB: "krungthai.com", TTB: "ttbbank.com", TISCO: "tisco.co.th",
  KKP: "kkpfg.com", BAY: "krungsri.com", BAB: "bangkokbank.com",
  BAM: "bam.co.th", LHFG: "lhfinancialgroup.com", CIMBT: "cimbthai.com",
  JMT: "jmtnetwork.co.th", MTC: "mtc.co.th", TIDLOR: "tidlor.com",
  SAWAD: "sawad.co.th", TQM: "tqmlife.com", BLA: "bla.co.th",
  // Energy & utilities
  GULF: "gulf.co.th", DELTA: "deltathailand.com", EA: "energyabsolute.co.th",
  GPSC: "gpscgroup.com", RATCH: "ratch.co.th", BGRIM: "bgrimpower.com",
  PTTEP: "pttep.com", PTTGC: "pttgc.com", TOP: "thaioilgroup.com",
  EGCO: "egco.com", CKP: "ckpower.co.th", BANPU: "banpu.com",
  BCP: "bangchak.com", BCPG: "bcpg.co.th", GUNKUL: "gunkul.co.th",
  TPIPP: "tpipp.co.th", SPRC: "sprc.co.th", PTG: "ptgenergy.co.th",
  // Telecom & tech
  TRUE: "true.th", INTUCH: "intuch.co.th", INSET: "inset.co.th",
  COM7: "com7.co.th", DITTO: "dittogroup.co.th", SYNEX: "synex.co.th",
  VGI: "vgi.co.th", PLANB: "planbmedia.co.th", RS: "rs.co.th",
  // Healthcare
  BH: "bumrungrad.com", BCH: "bch.co.th", CHG: "chularat.com",
  BDMS2: "bdms.co.th", PRIN: "princhealth.com", PRINC: "princhealth.com",
  BRH: "bangkokhospital.com",
  // Property & construction
  CPN: "centralpattana.co.th", CRC: "centralretail.com", LH: "lh.co.th",
  AP: "apthai.com", SC: "scasset.com", SPALI: "spali.co.th",
  WHA: "wha-group.com", ORI: "ori.co.th", CK: "chkarnchang.com",
  HMPRO: "homepro.co.th", DOHOME: "dohome.co.th", LPN: "lpn.co.th",
  AWC: "assetworldcorp.com", NOBLE: "nobleonline.com",
  STEC: "sino-thai.co.th", SEAFCO: "seafco.co.th",
  // Automotive & transport
  AAV: "aav.co.th", BA: "bangkokair.com", THAI: "thaiairways.com",
  SAT: "satauto.co.th", AH: "aapico.com",
  // Food, retail & consumer
  MINT: "minorinternational.com", CENTEL: "centarahotelsresorts.com",
  CPF: "cpfworldwide.com", TU: "thaiunion.com", CBG: "carabaoenergy.com",
  OSP: "osotspa.com", IVL: "ivlgroup.com", BTS: "bts.co.th",
  BTG: "betagro.com", BJC: "bjc.co.th", MEGA: "mega-lifesciences.com",
  OISHI: "oishigroup.com", MAJOR: "majorcineplex.com", M: "majorcineplex.com",
  BEAUTY: "beautycommunity.co.th", MAKRO: "siammakro.co.th",
  ROBINS: "robinsons.co.th", TVO: "tvo.co.th", TOA: "toagroup.co.th",
  // Industrial & materials
  AMATA: "amata.com", WP: "wpg.co.th", HANA: "hana.co.th",
  KCE: "kce.co.th", SCGP: "scgpackaging.com", CMAN: "cman.co.th",
  // Others
  EASTW: "eastwater.com", BEM: "bemplc.co.th", JWD: "jwdinfo.com",
  THANI: "thani.co.th", SINGER: "singerth.com",
};

function getDomain(symbol: string, exchange: string): string | null {
  const sym = symbol.toUpperCase();
  if (exchange === "SET") {
    return THAI_DOMAIN_MAP[sym] || null;
  }
  return US_DOMAIN_MAP[sym] || null;
}

/**
 * Get the primary logo URL (Clearbit).
 * Returns null for unrecognized symbols — StockLogo then shows initials or tries Google favicon.
 */
export function getLogoUrl(symbol: string, exchange: string): string | null {
  const domain = getDomain(symbol, exchange);
  if (!domain) return null;
  return `https://logo.clearbit.com/${domain}`;
}

/**
 * Get a Google favicon fallback URL for a given domain.
 * Returns 128×128 favicon image; StockLogo's naturalWidth≤16 check handles unknown domains.
 */
export function getGoogleFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}
