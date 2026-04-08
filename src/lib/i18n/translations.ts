// Lightweight i18n translations for Khongbeng Strategist
// All UI labels in Thai + English

export const translations = {
  // Navbar
  "nav.search": { th: "ค้นหา...", en: "Search..." },
  "nav.admin": { th: "แอดมิน", en: "Admin" },
  "nav.signIn": { th: "เข้าสู่ระบบ", en: "Sign In" },
  "nav.signOut": { th: "ออกจากระบบ", en: "Sign Out" },
  "nav.joinFree": { th: "สมัครฟรี", en: "Join Free" },

  // Hero
  "hero.badge": { th: "วิเคราะห์การลงทุนด้วย AI", en: "AI-Powered Investment Intelligence" },
  "hero.headline1": { th: "วิเคราะห์อัจฉริยะ", en: "Smart Analysis" },
  "hero.headline2": { th: "เพื่อนักลงทุน", en: "for Smart" },
  "hero.headline3": { th: "มืออาชีพ", en: "Investors" },
  "hero.subtitle": {
    th: "Khongbeng Strategist วิเคราะห์หุ้นแบบ 8 มิติ — ตั้งแต่โมเดลธุรกิจ งบการเงิน 7 Powers ไปจนถึง CEO Execution",
    en: "Khongbeng Strategist delivers 8-dimension stock analysis — covering business model, financials, competitive moat, and strategic verdict — powered by AI and the wisdom of Sun Tzu.",
  },
  "hero.explore": { th: "ดูการวิเคราะห์", en: "Explore Analysis" },
  "hero.join": { th: "สมัครฟรี", en: "Join Free" },
  "hero.stocksAnalyzed": { th: "หุ้นที่วิเคราะห์", en: "Stocks Analyzed" },
  "hero.dimensions": { th: "มิติการวิเคราะห์", en: "Analysis Dimensions" },
  "hero.aiEngine": { th: "เครื่องยนต์ AI", en: "AI Engine" },

  // Featured Stocks
  "featured.title": { th: "วิเคราะห์หุ้น", en: "Stock Analysis" },
  "featured.subtitle": { th: "วิเคราะห์เชิงลึกโดย Khongbeng Strategist", en: "Deep-dive analysis by Khongbeng Strategist" },
  "featured.thaiStocks": { th: "หุ้นไทย", en: "Thai Stocks" },
  "featured.usStocks": { th: "หุ้น US", en: "US Stocks" },
  "featured.noStocks": { th: "ยังไม่มีหุ้นในตลาดนี้", en: "No stocks published yet in this market." },

  // Feature Grid
  "features.title": { th: "8 มิติแห่งการวิเคราะห์", en: "8 Dimensions of Mastery" },
  "features.subtitle": { th: "ทุกหุ้นวิเคราะห์ผ่านกรอบ 8 ส่วนเดียวกัน — ไม่ลัด ไม่เว่อร์", en: "Every stock analyzed through the same rigorous 8-section framework — no shortcuts, no fluff." },

  // Footer
  "footer.disclaimer": {
    th: "ข้อมูลนี้ใช้เพื่อการศึกษาเท่านั้น ไม่ใช่คำแนะนำทางการเงิน กรุณาศึกษาข้อมูลด้วยตนเองก่อนตัดสินใจลงทุน",
    en: "For informational purposes only. Not financial advice. Always do your own research.",
  },

  // Section Headers (already bilingual in SECTION_LABELS, but for sidebar/other uses)
  "section.coreBusiness": { th: "ธุรกิจหลัก", en: "Core Business" },
  "section.customerBase": { th: "ฐานลูกค้า", en: "Customer Base" },
  "section.revenueModel": { th: "Model รายได้", en: "Revenue Model" },
  "section.financials": { th: "งบการเงิน", en: "Financial Statements" },
  "section.sevenPowers": { th: "7 Powers", en: "7 Powers Analysis" },
  "section.storyAndSCurve": { th: "Story & S-Curve", en: "Story & New S-Curve" },
  "section.risks": { th: "ความเสี่ยง", en: "Investment Risks" },
  "section.ceoProfile": { th: "CEO Profile", en: "CEO Profile & Execution" },

  // Stock Hero
  "hero.views": { th: "ครั้งที่ดู", en: "views" },
  "hero.updated": { th: "อัพเดทล่าสุด", en: "Updated" },

  // Chat
  "chat.placeholder": { th: "ถามเกี่ยวกับหุ้นนี้...", en: "Ask about this stock..." },
  "chat.aiDisclaimer": { th: "AI ตอบจากข้อมูลวิเคราะห์ของหุ้นนี้เท่านั้น", en: "AI answers are based solely on this stock's analysis data." },

  // Auth
  "auth.welcomeBack": { th: "ยินดีต้อนรับกลับ", en: "Welcome Back" },
  "auth.signInTo": { th: "เข้าสู่ระบบ Khongbeng Strategist", en: "Sign in to Khongbeng Strategist" },
  "auth.createAccount": { th: "สร้างบัญชี", en: "Create Account" },
  "auth.joinCommunity": { th: "เข้าร่วม Khongbeng Strategist", en: "Join Khongbeng Strategist community" },

  // Misc
  "misc.online": { th: "ออนไลน์", en: "online" },
  "misc.searchPlaceholder": { th: "ค้นหาหุ้น — CPALL, NVDA, PTT...", en: "Search any stock — CPALL, NVDA, PTT..." },
} as const;

export type TranslationKey = keyof typeof translations;
export type Language = "th" | "en";
