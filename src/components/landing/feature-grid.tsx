"use client";

import { Building2, Users, PieChart, BarChart3, Shield, Rocket, AlertTriangle, UserCheck } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

const features = [
  {
    icon: Building2,
    title: { th: "ธุรกิจหลัก", en: "Core Business" },
    subtitle: { th: "Core Business", en: "Business Overview" },
    description: { th: "เข้าใจธุรกิจแบบง่ายๆ พร้อม Revenue แยกตาม Business Unit", en: "Understand the business at a glance with revenue split by Business Unit" },
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Users,
    title: { th: "ฐานลูกค้า", en: "Customer Base" },
    subtitle: { th: "Customer Base", en: "Customer Analysis" },
    description: { th: "วิเคราะห์ Customer Model (B2B/B2C) และ Stickiness ของธุรกิจ", en: "Analyze Customer Model (B2B/B2C) and business stickiness factors" },
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: PieChart,
    title: { th: "Model รายได้", en: "Revenue Model" },
    subtitle: { th: "Revenue Model", en: "Revenue Quality" },
    description: { th: "คุณภาพรายได้ — Recurring, Subscription, Backlog แยกชัดเจน", en: "Revenue quality — Recurring, Subscription, Backlog breakdown" },
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: BarChart3,
    title: { th: "งบการเงิน", en: "Financial Statements" },
    subtitle: { th: "Financial Statements", en: "5-Year Financials" },
    description: { th: "กราฟรายได้ กำไร หนี้สิน ย้อนหลัง 5 ปี พร้อม Key Ratios", en: "Revenue, profit & debt charts over 5 years with key ratios" },
    color: "text-gold-400",
    bg: "bg-gold-500/10",
  },
  {
    icon: Shield,
    title: { th: "7 Powers", en: "7 Powers" },
    subtitle: { th: "Competitive Analysis", en: "Competitive Moat" },
    description: { th: "วิเคราะห์ครบทั้ง 7 Powers พร้อม Spider Chart ระดับ สูง/กลาง/ต่ำ", en: "All 7 Powers analyzed with Spider Chart — High/Medium/Low ratings" },
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: Rocket,
    title: { th: "Story & S-Curve", en: "Story & S-Curve" },
    subtitle: { th: "Growth Narrative", en: "Growth Catalysts" },
    description: { th: "เรื่องราวการเติบโตใหม่ๆ และ Hidden Gems ที่ตลาดอาจยังไม่เห็น", en: "New growth stories and hidden gems the market may not yet see" },
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
  {
    icon: AlertTriangle,
    title: { th: "ความเสี่ยง", en: "Investment Risks" },
    subtitle: { th: "Investment Risks", en: "Risk Assessment" },
    description: { th: "ความเสี่ยงที่นักลงทุนต้องรู้ พร้อมวิธีรับมือและระดับความรุนแรง", en: "Key risks investors must know — with mitigation and severity levels" },
    color: "text-orange-400",
    bg: "bg-orange-500/10",
  },
  {
    icon: UserCheck,
    title: { th: "CEO Profile", en: "CEO Profile" },
    subtitle: { th: "Execution Track Record", en: "Execution Track Record" },
    description: { th: "ประวัติ CEO พูดแล้วทำจริงไหม Beat หรือ Miss เป้า", en: "CEO background — track promises vs results, beat or miss targets" },
    color: "text-gold-400",
    bg: "bg-gold-500/10",
  },
];

export function FeatureGrid() {
  const { lang, t } = useLanguage();

  return (
    <section id="features" className="px-6 py-16 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-foreground mb-3">
          {t("features.title")}
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          {t("features.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((f) => (
          <div key={f.title.en} className="glass-card p-5 hover:border-white/10 transition-all duration-200">
            <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
              <f.icon className={`w-5 h-5 ${f.color}`} />
            </div>
            <h3 className="font-semibold text-foreground mb-0.5">{f.title[lang]}</h3>
            <p className="text-xs text-muted-foreground mb-2">{f.subtitle[lang]}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.description[lang]}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
