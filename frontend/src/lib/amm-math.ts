import { FEE_DENOMINATOR, FEE_NUMERATOR } from "./constants";

/**
 * Calculate swap output using the constant-product formula with fee.
 *
 * output = (reserve_out * amount_in_with_fee) / (reserve_in * fee_denom + amount_in_with_fee)
 * where amount_in_with_fee = amount_in * (fee_denom - fee_num)
 */
export function calculateSwapOutput(
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint
): bigint {
  if (amountIn === 0n || reserveIn === 0n || reserveOut === 0n) return 0n;

  const amountInWithFee = amountIn * (FEE_DENOMINATOR - FEE_NUMERATOR);
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * FEE_DENOMINATOR + amountInWithFee;

  return numerator / denominator;
}

/**
 * Calculate price impact as a percentage.
 *
 * Price impact = (mid_price - execution_price) / mid_price * 100
 */
export function calculatePriceImpact(
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint
): number {
  if (amountIn === 0n || reserveIn === 0n || reserveOut === 0n) return 0;

  const amountOut = calculateSwapOutput(amountIn, reserveIn, reserveOut);
  if (amountOut === 0n) return 0;

  // Mid price (no fee, no slippage): reserve_out / reserve_in
  const midPrice = Number(reserveOut) / Number(reserveIn);
  // Execution price
  const execPrice = Number(amountOut) / Number(amountIn);
  // Impact
  const impact = ((midPrice - execPrice) / midPrice) * 100;

  return Math.max(0, impact);
}

/**
 * Apply slippage tolerance to get minimum received amount.
 * slippagePct is in percent e.g. 0.5 for 0.5%
 */
export function calculateMinimumReceived(
  expectedOut: bigint,
  slippagePct: number
): bigint {
  const slippageFactor = 1 - slippagePct / 100;
  return BigInt(Math.floor(Number(expectedOut) * slippageFactor));
}

/**
 * Calculate the price of token A in terms of token B.
 * Returns human-readable price.
 */
export function calculatePrice(
  reserveA: bigint,
  reserveB: bigint,
  decimalsA: number,
  decimalsB: number
): number {
  if (reserveA === 0n || reserveB === 0n) return 0;
  const normalizedA = Number(reserveA) / Math.pow(10, decimalsA);
  const normalizedB = Number(reserveB) / Math.pow(10, decimalsB);
  return normalizedB / normalizedA;
}

/**
 * Format token amount from raw u64 to human-readable string.
 */
export function formatTokenAmount(amount: bigint, decimals: number, precision = 4): string {
  const divisor = Math.pow(10, decimals);
  const value = Number(amount) / divisor;
  if (value === 0) return "0";
  if (value < 0.0001) return value.toExponential(2);
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision,
  });
}

/**
 * Parse human-readable token amount to raw u64.
 */
export function parseTokenAmount(amount: string, decimals: number): bigint {
  if (!amount || isNaN(parseFloat(amount))) return 0n;
  const multiplier = Math.pow(10, decimals);
  return BigInt(Math.floor(parseFloat(amount) * multiplier));
}

/**
 * Calculate LP tokens to mint for add_liquidity (proportional deposit).
 */
export function calculateLpTokensToMint(
  amountA: bigint,
  amountB: bigint,
  reserveA: bigint,
  reserveB: bigint,
  totalLp: bigint
): bigint {
  if (totalLp === 0n) {
    // First deposit: geometric mean
    const product = amountA * amountB;
    return bigIntSqrt(product) - 1000n; // minus MINIMUM_LIQUIDITY
  }
  // Proportional
  const lpFromA = (amountA * totalLp) / reserveA;
  const lpFromB = (amountB * totalLp) / reserveB;
  return lpFromA < lpFromB ? lpFromA : lpFromB;
}

/**
 * BigInt integer square root (floor).
 */
function bigIntSqrt(n: bigint): bigint {
  if (n < 0n) throw new Error("Square root of negative");
  if (n < 2n) return n;
  let x = n;
  let y = (x + 1n) / 2n;
  while (y < x) {
    x = y;
    y = (x + n / x) / 2n;
  }
  return x;
}

/**
 * Format USD value with abbreviation (K, M, B).
 */
export function formatUSD(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}
