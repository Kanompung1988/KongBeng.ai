// Phase 4 — Prompt 8: Share Card Generator using Satori
import type { StrategistVerdict } from "@/types";
import { scoreToColor } from "./utils";

interface ShareCardOptions {
  symbol: string;
  stockName: string;
  verdict: StrategistVerdict;
}

export async function generateShareCard({ symbol, stockName, verdict }: ShareCardOptions): Promise<void> {
  // Call the share card API endpoint which uses Satori on the server
  const res = await fetch(`/api/share-card?symbol=${symbol}`);
  if (!res.ok) throw new Error("Failed to generate share card");

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  // Trigger download
  const a = document.createElement("a");
  a.href = url;
  a.download = `kongbeng-${symbol.toLowerCase()}-analysis.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
