import { UserCheck, CheckCircle, XCircle, MinusCircle } from "lucide-react";
import Image from "next/image";
import { SectionHeader } from "./core-business";
import { parseCeoProfile, verdictToColor } from "@/lib/utils";
import { useT } from "@/lib/i18n/context";

interface Props {
  raw: string | null | undefined;
}

const verdictIcons = {
  delivered: CheckCircle,
  partial: MinusCircle,
  missed: XCircle,
  beat: CheckCircle,
  meet: MinusCircle,
  miss: XCircle,
};

export function CeoProfileSection({ raw }: Props) {
  const data = parseCeoProfile(raw);
  const t = useT();
  if (!data) return null;

  return (
    <section id="ceoProfile" className="scroll-mt-24">
      <SectionHeader icon={<UserCheck className="w-5 h-5 text-gold-400" />} title={t("section.ceoProfile")} />
      <div className="glass-card p-6 space-y-6">
        {/* CEO Info */}
        <div className="flex items-start gap-4">
          {data.ceoImageUrl ? (
            <Image src={data.ceoImageUrl} alt={data.name} width={48} height={48} className="w-12 h-12 rounded-full object-cover border border-gold-500/30" unoptimized />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center shrink-0">
              <span className="text-gold-400 font-bold text-lg">{data.name.charAt(0)}</span>
            </div>
          )}
          <div>
            <h3 className="font-semibold text-foreground">{data.name}</h3>
            <p className="text-xs text-muted-foreground">{data.title}</p>
          </div>
        </div>

        {/* Background */}
        {data.background && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">{t("stock.background")}</h3>
            {data.background.split("\n").filter(Boolean).map((p, i) => (
              <p key={i} className="text-sm text-muted-foreground leading-relaxed">{p}</p>
            ))}
          </div>
        )}

        {/* Execution Track Record */}
        {data.executionTrackRecord && data.executionTrackRecord.length > 0 && (
          <div className="pt-4 border-t border-border/50">
            <h3 className="text-sm font-semibold text-foreground mb-3">{t("stock.executionTrack")}</h3>
            <div className="space-y-3">
              {data.executionTrackRecord.map((track, i) => {
                const Icon = verdictIcons[track.verdict];
                return (
                  <div key={i} className="glass-card p-4 bg-muted/20">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <p className="text-sm text-foreground font-medium">&ldquo;{track.claim}&rdquo;</p>
                        <p className="text-xs text-muted-foreground mt-1">{track.result}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Icon className={`w-4 h-4 ${verdictToColor(track.verdict)}`} />
                        <span className={`text-xs font-semibold ${verdictToColor(track.verdict)}`}>
                          {track.verdict.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">Source: {track.source}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Beat/Miss Record */}
        {data.beatMissRecord && data.beatMissRecord.length > 0 && (
          <div className="pt-4 border-t border-border/50">
            <h3 className="text-sm font-semibold text-foreground mb-3">{t("stock.beatMissRecord")}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-3 text-muted-foreground text-xs font-medium">{t("stock.metric")}</th>
                    <th className="text-left py-2 px-3 text-muted-foreground text-xs font-medium">{t("stock.target")}</th>
                    <th className="text-left py-2 px-3 text-muted-foreground text-xs font-medium">{t("stock.actual")}</th>
                    <th className="text-right py-2 px-3 text-muted-foreground text-xs font-medium">{t("stock.verdict")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.beatMissRecord.map((rec, i) => {
                    const Icon = verdictIcons[rec.verdict];
                    return (
                      <tr key={i} className="border-b border-border/30">
                        <td className="py-2 px-3 font-medium text-foreground">{rec.metric}</td>
                        <td className="py-2 px-3 text-muted-foreground">{rec.target}</td>
                        <td className="py-2 px-3 text-muted-foreground">{rec.actual}</td>
                        <td className="py-2 px-3 text-right">
                          <span className={`inline-flex items-center gap-1 ${verdictToColor(rec.verdict)}`}>
                            <Icon className="w-3.5 h-3.5" />
                            {rec.verdict.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Earnings Call Highlights */}
        {data.earningsCallHighlights && data.earningsCallHighlights.length > 0 && (
          <div className="pt-4 border-t border-border/50">
            <h3 className="text-sm font-semibold text-foreground mb-3">{t("stock.earningsHighlights")}</h3>
            <div className="space-y-2">
              {data.earningsCallHighlights.map((h, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-1 shrink-0">&#8227;</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">{h}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {data.summary && (
          <div className="pt-4 border-t border-border/50">
            <h3 className="text-sm font-semibold text-foreground mb-2">{t("stock.ceoAssessment")}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{data.summary}</p>
          </div>
        )}
      </div>
    </section>
  );
}
