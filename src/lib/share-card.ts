// Share Card Generator — Khongbeng Strategist

interface ShareCardOptions {
  symbol: string;
  stockName: string;
}

export async function generateShareCard({ symbol }: ShareCardOptions): Promise<void> {
  // Call the share card API endpoint which uses Satori on the server
  const res = await fetch(`/api/share-card?symbol=${symbol}`);
  if (!res.ok) throw new Error("Failed to generate share card");

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  // Trigger download
  const a = document.createElement("a");
  a.href = url;
  a.download = `khongbeng-${symbol.toLowerCase()}-analysis.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
