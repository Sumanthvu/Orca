"use client";

import Link from "next/link";
import { PoolData } from "@/hooks/usePool";
import { DEVNET_TOKENS } from "@/lib/constants";
import { formatTokenAmount, formatUSD, calculatePrice } from "@/lib/amm-math";
import styles from "./PoolCard.module.css";

interface PoolCardProps {
  pool: PoolData;
  onAddLiquidity: (pool: PoolData) => void;
  onRemoveLiquidity: (pool: PoolData) => void;
  userLpBalance?: bigint;
}

function getTokenInfo(mint: string) {
  return DEVNET_TOKENS.find((t) => t.mint === mint) ?? {
    symbol: mint.slice(0, 4) + "...",
    name: "Unknown Token",
    mint,
    decimals: 6,
    logoURI: "",
  };
}

export function PoolCard({
  pool,
  onAddLiquidity,
  onRemoveLiquidity,
  userLpBalance = 0n,
}: PoolCardProps) {
  const tokenA = getTokenInfo(pool.tokenAMint.toString());
  const tokenB = getTokenInfo(pool.tokenBMint.toString());

  const price = calculatePrice(pool.reserveA, pool.reserveB, tokenA.decimals, tokenB.decimals);

  // Estimated TVL (simplified — treats 1 unit = $1 for demo)
  const tvlA = Number(pool.reserveA) / Math.pow(10, tokenA.decimals);
  const tvlB = Number(pool.reserveB) / Math.pow(10, tokenB.decimals);
  const tvlEstimate = tvlA + tvlB;

  const hasPosition = userLpBalance > 0n;

  return (
    <div className={`glass-card ${styles.card}`}>
      {/* Pool Header */}
      <div className={styles.poolHeader}>
        <div className={styles.tokenPair}>
          <div className={styles.tokenLogos}>
            <div className={`${styles.tokenLogo} ${styles.tokenLogoA}`}>
              {tokenA.symbol.slice(0, 1)}
            </div>
            <div className={`${styles.tokenLogo} ${styles.tokenLogoB}`}>
              {tokenB.symbol.slice(0, 1)}
            </div>
          </div>
          <div>
            <div className={styles.pairName}>
              {tokenA.symbol} / {tokenB.symbol}
            </div>
            <div className={styles.feeTag}>0.3% fee</div>
          </div>
        </div>
        {hasPosition && (
          <span className="badge badge-success">Your position</span>
        )}
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className="stat-card">
          <span className="stat-label">TVL</span>
          <span className="stat-value" style={{ fontSize: "1rem" }}>
            {formatUSD(tvlEstimate)}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Price</span>
          <span className="stat-value" style={{ fontSize: "1rem" }}>
            1 {tokenA.symbol} = {price.toFixed(4)} {tokenB.symbol}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Reserve A</span>
          <span className="stat-value" style={{ fontSize: "1rem" }}>
            {formatTokenAmount(pool.reserveA, tokenA.decimals)} {tokenA.symbol}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Reserve B</span>
          <span className="stat-value" style={{ fontSize: "1rem" }}>
            {formatTokenAmount(pool.reserveB, tokenB.decimals)} {tokenB.symbol}
          </span>
        </div>
      </div>

      {/* Your LP Position */}
      {hasPosition && (
        <div className={styles.positionBanner}>
          <span className={styles.positionLabel}>Your LP tokens:</span>
          <span className={styles.positionValue}>
            {formatTokenAmount(userLpBalance, 6)}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <button
          id={`add-liquidity-${pool.address.toString().slice(0, 8)}`}
          className="btn btn-primary"
          onClick={() => onAddLiquidity(pool)}
        >
          + Add Liquidity
        </button>
        {hasPosition && (
          <button
            id={`remove-liquidity-${pool.address.toString().slice(0, 8)}`}
            className="btn btn-secondary"
            onClick={() => onRemoveLiquidity(pool)}
          >
            − Remove
          </button>
        )}
        <Link
          href={`/swap?tokenA=${pool.tokenAMint}&tokenB=${pool.tokenBMint}`}
          className="btn btn-ghost btn-sm"
        >
          Swap ↗
        </Link>
      </div>
    </div>
  );
}
