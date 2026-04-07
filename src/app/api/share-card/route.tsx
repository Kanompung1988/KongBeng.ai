// Phase 4 — Prompt 8: Share Card OG Image API (Satori + @vercel/og)
import { ImageResponse } from "@vercel/og";
import { prisma } from "@/lib/prisma";
import { parseStrategistVerdict } from "@/lib/utils";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol")?.toUpperCase();
  if (!symbol) return new Response("symbol required", { status: 400 });

  const stock = await prisma.stock.findUnique({
    where: { symbol },
    select: { name: true, symbol: true, sector: true, strategistVerdict: true },
  });

  if (!stock) return new Response("Not found", { status: 404 });

  const verdict = parseStrategistVerdict(stock.strategistVerdict);
  const score = verdict?.score ?? 0;
  const rating = verdict?.rating ?? "HOLD";
  const bullets = verdict?.bullPoints?.slice(0, 3) ?? [];
  const summary = verdict?.summary ?? "";

  const ratingColors: Record<string, string> = {
    "STRONG BUY": "#10b981",
    "BUY": "#10b981",
    "HOLD": "#f59e0b",
    "REDUCE": "#f97316",
    "SELL": "#ef4444",
  };
  const ratingColor = ratingColors[rating] || "#10b981";
  const scoreColor = score >= 8 ? "#10b981" : score >= 6 ? "#f59e0b" : "#ef4444";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "linear-gradient(135deg, #060d18 0%, #0a1628 50%, #060d18 100%)",
          display: "flex",
          flexDirection: "column",
          padding: "60px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Grid pattern overlay */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(16,185,129,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />

        {/* KongBeng branding */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "40px" }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "10px",
            background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#10b981", fontWeight: "bold", fontSize: "18px",
          }}>K</div>
          <span style={{ color: "#f8fafc", fontSize: "20px", fontWeight: "600" }}>KongBeng Strategist</span>
        </div>

        {/* Main content */}
        <div style={{ display: "flex", gap: "60px", flex: 1 }}>
          {/* Left: Stock info */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <div style={{ color: "#10b981", fontSize: "52px", fontWeight: "800", fontFamily: "monospace", lineHeight: "1" }}>
                {stock.symbol}
              </div>
              <div style={{ color: "#94a3b8", fontSize: "20px", marginTop: "6px" }}>{stock.name}</div>
              <div style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>{stock.sector}</div>
            </div>

            {/* Rating */}
            <div style={{
              display: "inline-flex", alignItems: "center",
              background: `${ratingColor}20`, border: `1px solid ${ratingColor}40`,
              borderRadius: "8px", padding: "8px 16px",
              color: ratingColor, fontSize: "16px", fontWeight: "700",
              width: "fit-content",
            }}>
              {rating}
            </div>

            {/* Summary */}
            {summary && (
              <p style={{ color: "#94a3b8", fontSize: "16px", lineHeight: "1.6", maxWidth: "500px" }}>
                {summary.slice(0, 160)}{summary.length > 160 ? "..." : ""}
              </p>
            )}

            {/* Bull points */}
            {bullets.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {bullets.map((b, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <span style={{ color: "#10b981", fontSize: "16px" }}>✓</span>
                    <span style={{ color: "#cbd5e1", fontSize: "15px", lineHeight: "1.4" }}>{b}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Score */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
            <div style={{
              width: "160px", height: "160px", borderRadius: "50%",
              border: `6px solid ${scoreColor}`,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              background: `${scoreColor}10`,
            }}>
              <span style={{ color: scoreColor, fontSize: "56px", fontWeight: "900", lineHeight: "1" }}>{score}</span>
              <span style={{ color: "#64748b", fontSize: "16px" }}>/10</span>
            </div>
            <span style={{ color: "#64748b", fontSize: "14px" }}>Strategist Score</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "30px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <span style={{ color: "#475569", fontSize: "13px" }}>kongbeng.com</span>
          <span style={{ color: "#475569", fontSize: "13px" }}>For informational purposes only. Not financial advice.</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
