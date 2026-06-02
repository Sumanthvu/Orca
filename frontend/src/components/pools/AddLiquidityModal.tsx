"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PoolData } from "@/hooks/usePool";
import { useLiquidity } from "@/hooks/useLiquidity";
import {
  formatTokenAmount,
  parseTokenAmount,
  calculateLpTokensToMint,
} from "@/lib/amm-math";
import { DEVNET_TOKENS, getSolscanUrl } from "@/lib/constants";
import styles from "./LiquidityModal.module.css";

interface AddLiquidityModalProps {
  pool: PoolData;
  onClose: () => void;
  onSuccess: () => void;
}

function getToken(mint: string) {
  return DEVNET_TOKENS.find((t) => t.mint === mint) ?? {
    symbol: mint.slice(0, 6),
    decimals: 6,
    name: "Unknown",
    mint,
    logoURI: "",
  };
}

export function AddLiquidityModal({
  pool,
  onClose,
  onSuccess,
}: AddLiquidityModalProps) {
  const { connected } = useWallet();
  const { addLiquidity, status, txSignature, error } = useLiquidity();

  const tokenA = getToken(pool.tokenAMint.toString());
  const tokenB = getToken(pool.tokenBMint.toString());

  const [amountAStr, setAmountAStr] = useState("");
  const [amountBStr, setAmountBStr] = useState("");
  const [slippagePct] = useState(0.5);

  const amountA = parseTokenAmount(amountAStr, tokenA.decimals);

  // If pool is empty, use manual input for Token B. Otherwise, auto-calculate.
  const amountB =
    pool.lpSupply === 0n
      ? parseTokenAmount(amountBStr, tokenB.decimals)
      : pool.reserveA > 0n && amountA > 0n
      ? (amountA * pool.reserveB) / pool.reserveA
      : 0n;

  const lpToReceive =
    amountA > 0n && amountB > 0n
      ? calculateLpTokensToMint(
          amountA,
          amountB,
          pool.reserveA,
          pool.reserveB,
          pool.lpSupply
        )
      : 0n;

  const isLoading =
    status === "building" || status === "signing" || status === "confirming";

  const handleDeposit = async () => {
    if (amountA === 0n || amountB === 0n) return;
    const sig = await addLiquidity({ pool, amountADesired: amountA, amountBDesired: amountB, slippagePct });
    if (sig) {
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`glass-card-elevated ${styles.modal} animate-fade-in`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Add Liquidity</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <svg width="18" height="18" fill="none" viewBox="0 0 18 18">
              <path d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <p className={styles.subtitle}>
          Deposit {tokenA.symbol} + {tokenB.symbol} to earn 0.3% on every swap.
        </p>

        {/* Token A Input */}
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>{tokenA.symbol} Amount</label>
          <div className={styles.inputRow}>
            <input
              id="add-liquidity-amount-a"
              className={`input ${styles.amountInput}`}
              type="number"
              min="0"
              placeholder="0.00"
              value={amountAStr}
              onChange={(e) => setAmountAStr(e.target.value)}
            />
            <span className={styles.tokenTag}>{tokenA.symbol}</span>
          </div>
        </div>

        {/* Plus separator */}
        <div className={styles.plusSign}>+</div>

        {/* Token B Input / Auto-calculated */}
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>
            {tokenB.symbol} Amount {pool.lpSupply > 0n && "(calculated)"}
          </label>
          <div className={styles.inputRow}>
            {pool.lpSupply === 0n ? (
              <input
                id="add-liquidity-amount-b"
                className={`input ${styles.amountInput}`}
                type="number"
                min="0"
                placeholder="0.00"
                value={amountBStr}
                onChange={(e) => setAmountBStr(e.target.value)}
              />
            ) : (
              <div className={styles.calculatedAmount}>
                {amountB > 0n
                  ? formatTokenAmount(amountB, tokenB.decimals)
                  : "0.00"}
              </div>
            )}
            <span className={styles.tokenTag}>{tokenB.symbol}</span>
          </div>
        </div>

        {/* LP Tokens estimate */}
        {lpToReceive > 0n && (
          <div className={styles.estimate}>
            <span className={styles.estimateLabel}>LP tokens to receive:</span>
            <span className={styles.estimateValue}>
              {formatTokenAmount(lpToReceive, 6)}
            </span>
          </div>
        )}

        {/* Pool is empty notice */}
        {pool.lpSupply === 0n && (
          <div className="badge badge-warning" style={{ width: "100%", justifyContent: "center", padding: "0.625rem 1rem" }}>
            You are creating the initial liquidity — you set the price!
          </div>
        )}

        {/* Error / Success */}
        {error && (
          <div className="badge badge-error" style={{ width: "100%", justifyContent: "center", padding: "0.625rem 1rem" }}>
            {error.length > 80 ? "Transaction failed" : error}
          </div>
        )}
        {status === "success" && txSignature && (
          <div className={styles.success}>
            ✓ Liquidity added!{" "}
            <a href={getSolscanUrl(txSignature)} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>
              View on Solscan ↗
            </a>
          </div>
        )}

        <button
          id="add-liquidity-confirm-btn"
          className="btn btn-primary btn-lg"
          style={{ width: "100%" }}
          onClick={handleDeposit}
          disabled={!connected || amountA === 0n || isLoading}
        >
          {isLoading ? (
            <>
              <div className="spinner" />
              {status === "signing" ? "Waiting for signature..." : "Processing..."}
            </>
          ) : (
            "Deposit Liquidity"
          )}
        </button>
      </div>
    </div>
  );
}
