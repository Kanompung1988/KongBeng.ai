import { Building2 } from "lucide-react";

interface Props {
  content: string | null | undefined;
}

export function BusinessOverviewSection({ content }: Props) {
  if (!content) return null;
  const paragraphs = content.split("\n").filter(Boolean);

  return (
    <section id="businessOverview" className="scroll-mt-24">
      <SectionHeader icon={<Building2 className="w-5 h-5 text-emerald-400" />} title="Business Overview" />
      <div className="glass-card p-6 space-y-4">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-muted-foreground leading-relaxed">
            {p}
          </p>
        ))}
      </div>
    </section>
  );
}

export function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
        {icon}
      </div>
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
    </div>
  );
}
