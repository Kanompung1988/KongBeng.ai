"use client";

import { TradingViewChart } from "./tradingview-chart";
import { useTheme } from "next-themes";

interface Props {
  symbol: string;
  exchange: string;
}

export function TradingViewChartWrapper({ symbol, exchange }: Props) {
  const { theme } = useTheme();
  const chartTheme = theme === "light" ? "light" : "dark";

  return (
    <section id="chart">
      <TradingViewChart
        key={`${symbol}-${exchange}`}
        symbol={symbol}
        exchange={exchange}
        height={450}
        theme={chartTheme as "dark" | "light"}
      />
    </section>
  );
}
