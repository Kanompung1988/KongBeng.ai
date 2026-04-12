// Risk metrics calculator for portfolio analytics

/**
 * Calculate daily returns from an array of closing prices
 */
export function calculateReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] > 0) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
  }
  return returns;
}

/**
 * Calculate Beta: covariance(stock, benchmark) / variance(benchmark)
 */
export function calculateBeta(stockReturns: number[], benchmarkReturns: number[]): number | null {
  const len = Math.min(stockReturns.length, benchmarkReturns.length);
  if (len < 5) return null;

  const sr = stockReturns.slice(0, len);
  const br = benchmarkReturns.slice(0, len);

  const meanS = sr.reduce((a, b) => a + b, 0) / len;
  const meanB = br.reduce((a, b) => a + b, 0) / len;

  let cov = 0;
  let varB = 0;
  for (let i = 0; i < len; i++) {
    cov += (sr[i] - meanS) * (br[i] - meanB);
    varB += (br[i] - meanB) ** 2;
  }

  if (varB === 0) return null;
  return cov / varB;
}

/**
 * Calculate Sharpe Ratio: (mean return - risk-free rate) / std dev of returns
 * riskFreeRate is annualized (e.g., 0.02 for 2%)
 */
export function calculateSharpeRatio(dailyReturns: number[], riskFreeRate: number = 0.02): number | null {
  if (dailyReturns.length < 10) return null;

  const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / dailyReturns.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return null;

  // Annualize: multiply daily mean by 252, daily std by sqrt(252)
  const annualizedReturn = mean * 252;
  const annualizedStd = stdDev * Math.sqrt(252);

  return (annualizedReturn - riskFreeRate) / annualizedStd;
}

/**
 * Calculate annualized volatility from daily returns
 */
export function calculateVolatility(dailyReturns: number[]): number | null {
  if (dailyReturns.length < 5) return null;

  const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / dailyReturns.length;

  return Math.sqrt(variance) * Math.sqrt(252) * 100; // as percentage
}

/**
 * Calculate max drawdown from a series of portfolio values
 */
export function calculateMaxDrawdown(values: number[]): number | null {
  if (values.length < 2) return null;

  let peak = values[0];
  let maxDD = 0;

  for (const v of values) {
    if (v > peak) peak = v;
    const dd = (peak - v) / peak;
    if (dd > maxDD) maxDD = dd;
  }

  return maxDD * 100; // as percentage
}
