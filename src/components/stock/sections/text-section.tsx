import { LucideProps, TrendingUp, Shield, AlertTriangle, Globe } from "lucide-react";
import { SectionHeader } from "./business-overview";

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  TrendingUp,
  Shield,
  AlertTriangle,
  Globe,
};

interface Props {
  id: string;
  title: string;
  iconName: keyof typeof ICON_MAP;
  content: string | null | undefined;
  variant?: "default" | "warning";
}

export function TextSection({ id, title, iconName, content, variant = "default" }: Props) {
  if (!content) return null;
  const Icon = ICON_MAP[iconName] || TrendingUp;
  const paragraphs = content.split("\n").filter(Boolean);
  const iconColor = variant === "warning" ? "text-orange-400" : "text-emerald-400";
  const borderClass = variant === "warning" ? "border-l-orange-500/30" : "";

  return (
    <section id={id} className="scroll-mt-24">
      <SectionHeader icon={<Icon className={`w-5 h-5 ${iconColor}`} />} title={title} />
      <div className={`glass-card p-6 space-y-4 ${variant === "warning" ? "border-l-4 border-orange-500/30" : ""}`}>
        {paragraphs.map((p, i) => (
          <p key={i} className="text-muted-foreground leading-relaxed">{p}</p>
        ))}
      </div>
    </section>
  );
}
