import { Building2, PieChart, BarChart3, TrendingUp, Shield, AlertTriangle, Globe, Sword } from "lucide-react";

const features = [
  {
    icon: Building2,
    title: "Business Overview",
    description: "Understand the core business model, revenue engines, and strategic positioning in the market.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: PieChart,
    title: "Revenue Structure",
    description: "Visual breakdown of revenue by segment with historical trends and growth trajectory.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: BarChart3,
    title: "Financial Health",
    description: "P/E, ROE, D/E, Dividend Yield — all key ratios with strategic interpretation.",
    color: "text-gold-400",
    bg: "bg-gold-500/10",
  },
  {
    icon: TrendingUp,
    title: "Growth Strategy",
    description: "Capex allocation, expansion plans, M&A targets, and digital transformation roadmap.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: Shield,
    title: "Competitive Moat",
    description: "Identify sustainable advantages: brand, distribution, network effects, and IP.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: AlertTriangle,
    title: "Risk Analysis",
    description: "Macro, regulatory, competitive, and execution risks — with mitigation context.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
  },
  {
    icon: Globe,
    title: "Industry Landscape",
    description: "Sector dynamics, TAM, competitive threats, and structural tailwinds.",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
  {
    icon: Sword,
    title: "Strategist's Verdict",
    description: "A decisive 1-10 score, buy/hold/sell rating, and 3 bullet investment thesis.",
    color: "text-gold-400",
    bg: "bg-gold-500/10",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="px-6 py-16 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-foreground mb-3">
          8 Dimensions of Mastery
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Every stock analyzed through the same rigorous 8-section framework — no shortcuts, no fluff.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((f) => (
          <div key={f.title} className="glass-card p-5 hover:border-white/10 transition-all duration-200">
            <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
              <f.icon className={`w-5 h-5 ${f.color}`} />
            </div>
            <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
