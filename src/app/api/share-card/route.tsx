// Share Card OG Image API (Satori + @vercel/og) — Khongbeng Strategist
import { ImageResponse } from "@vercel/og";
import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/utils";
import type { NextRequest } from "next/server";
import type { CoreBusinessData } from "@/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol")?.toUpperCase();
  if (!symbol) return new Response("symbol required", { status: 400 });

  const stock = await prisma.stock.findUnique({
    where: { symbol },
    select: { name: true, symbol: true, sector: true, exchange: true, coreBusiness: true },
  });

  if (!stock) return new Response("Not found", { status: 404 });

  const coreData = safeJsonParse<CoreBusinessData | null>(stock.coreBusiness, null);
  const summary = coreData?.summary?.slice(0, 200) || "";
  const buCount = coreData?.businessUnits?.length || 0;

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

        {/* Khongbeng branding */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "40px" }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "10px",
            background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#10b981", fontWeight: "bold", fontSize: "18px",
          }}>K</div>
          <span style={{ color: "#f8fafc", fontSize: "20px", fontWeight: "600" }}>Khongbeng Strategist</span>
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
              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <span style={{ color: "#64748b", fontSize: "14px" }}>{stock.sector}</span>
                <span style={{ color: "#64748b", fontSize: "14px" }}>{stock.exchange}</span>
              </div>
            </div>

            {/* Summary */}
            {summary && (
              <p style={{ color: "#94a3b8", fontSize: "16px", lineHeight: "1.6", maxWidth: "500px" }}>
                {summary}{summary.length >= 200 ? "..." : ""}
              </p>
            )}

            {/* Stats */}
            <div style={{ display: "flex", gap: "20px", marginTop: "auto" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ color: "#10b981", fontSize: "28px", fontWeight: "800" }}>8</span>
                <span style={{ color: "#64748b", fontSize: "12px" }}>Analysis Dimensions</span>
              </div>
              {buCount > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ color: "#f59e0b", fontSize: "28px", fontWeight: "800" }}>{buCount}</span>
                  <span style={{ color: "#64748b", fontSize: "12px" }}>Business Units</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: 8 Dimensions visual */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", width: "200px" }}>
            {["ธุรกิจหลัก", "ฐานลูกค้า", "Model รายได้", "งบการเงิน", "7 Powers", "S-Curve", "ความเสี่ยง", "CEO"].map((d, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "8px",
                background: "rgba(16,185,129,0.08)", borderRadius: "6px",
                padding: "4px 12px", width: "100%",
              }}>
                <span style={{ color: "#10b981", fontSize: "10px" }}>●</span>
                <span style={{ color: "#94a3b8", fontSize: "12px" }}>{d}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "30px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <span style={{ color: "#475569", fontSize: "13px" }}>khongbeng.com</span>
          <span style={{ color: "#475569", fontSize: "13px" }}>For informational purposes only. Not financial advice.</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
