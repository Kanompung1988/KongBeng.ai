"use client";
import { Shield } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { SectionHeader } from "./core-business";
import { parseSevenPowers } from "@/lib/utils";

interface Props {
  raw: string | null | undefined;
}

const levelColors = {
  high: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  medium: "bg-gold-500/20 text-gold-300 border-gold-500/30",
  low: "bg-red-500/20 text-red-300 border-red-500/30",
};

export function SevenPowersSection({ raw }: Props) {
  const data = parseSevenPowers(raw);
  if (!data) return null;

  const radarData = data.powers.map((p) => ({
    power: p.name.replace(" Economies", "").replace("Counter-Positioning", "Counter-Pos.").replace("Cornered Resource", "Cornered Res.").replace("Process Power", "Process"),
    score: p.score,
    fullMark: 5,
  }));

  return (
    <section id="sevenPowers" className="scroll-mt-24">
      <SectionHeader icon={<Shield className="w-5 h-5 text-cyan-400" />} title="7 Powers Analysis" />
      <div className="glass-card p-6 space-y-6">
        {/* Radar Chart */}
        <div className="flex justify-center">
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis
                dataKey="power"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 5]}
                tick={{ fill: "#64748b", fontSize: 10 }}
                tickCount={6}
              />
              <Radar
                name="Power Score"
                dataKey="score"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.25}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                itemStyle={{ color: "#e2e8f0" }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Power Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/50">
          {data.powers.map((p, i) => (
            <div key={i} className="glass-card p-4 bg-muted/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-foreground">{p.name}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${levelColors[p.level]}`}>
                  {p.level.toUpperCase()} ({p.score}/5)
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{p.analysis}</p>
            </div>
          ))}
        </div>

        {/* Summary */}
        {data.summary && (
          <div className="pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground leading-relaxed">{data.summary}</p>
          </div>
        )}
      </div>
    </section>
  );
}
