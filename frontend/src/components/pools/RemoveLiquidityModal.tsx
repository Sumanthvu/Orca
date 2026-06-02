"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PoolData } from "@/hooks/usePool";
import { useLiquidity } from "@/hooks/useLiquidity";
import { formatTokenAmount, parseTokenAmount } from "@/lib/amm-math";
import { DEVNET_TOKENS, getSolscanUrl } from "@/lib/constants";
import styles from "./LiquidityModal.module.css";

interface RemoveLiquidityModalProps {
  pool: PoolData;
  userLpBalance: bigint;
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

export function RemoveLiquidityModal({
  pool,
  userLpBalance,
  onClose,
  onSuccess,
}: RemoveLiquidityModalProps) {
  const { connected } = useWallet();
  const { removeLiquidity, status, txSignature, error } = useLiquidity();

  const tokenA = getToken(pool.tokenAMint.toString());
  const tokenB = getToken(pool.tokenBMint.toString());

  const [lpAmountStr, setLpAmountStr] = useState("");
  const [percentage, setPercentage] = useState(0);
  const [slippagePct] = useState(0.5);

  const lpAmount =
    percentage > 0
      ? (userLpBalance * BigInt(percentage)) / 100n
      : parseTokenAmount(lpAmountStr, 6);

  // Calculate output amounts
  const amountA =
    pool.lpSupply > 0n && lpAmount > 0n
      ? (lpAmount * pool.reserveA) / pool.lpSupply
      : 0n;
  const amountB =
    pool.lpSupply > 0n && lpAmount > 0n
      ? (lpAmount * pool.reserveB) / pool.lpSupply
      : 0n;

  const isLoading =
    status === "building" || status === "signing" || status === "confirming";

  const handleRemove = async () => {
    if (lpAmount === 0n) return;
    const sig = await removeLiquidity({ pool, lpAmount, slippagePct });
    if (sig) {
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    }
  };

  const PCT_OPTIONS = [25, 50, 75, 100];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`glass-card-elevated ${styles.modal} animate-fade-in`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Remove Liquidity</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <svg width="18" height="18" fill="none" viewBox="0 0 18 18">
              <path d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <p className={styles.subtitle}>
          Your balance: <strong>{formatTokenAmount(userLpBalance, 6)}</strong> LP tokens
        </p>

        {/* Percentage quick select */}
        <div className={styles.pctRow}>
          {PCT_OPTIONS.map((pct) => (
            <button
              key={pct}
              id={`remove-pct-${pct}`}
              className={`btn btn-sm ${percentage === pct ? "btn-primary" : "btn-secondary"}`}
              onClick={() => {
                setPercentage(pct);
                setLpAmountStr("");
              }}
            >
              {pct}%
            </button>
          ))}
        </div>

        {/* LP Amount input */}
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>LP Token Amount</label>
          <div className={styles.inputRow}>
            <input
              id="remove-liquidity-amount"
              className={`input ${styles.amountInput}`}
              type="number"
              min="0"
              placeholder="0.00"
              value={lpAmountStr}
              onChange={(e) => {
                setLpAmountStr(e.target.value);
                setPercentage(0);
              }}
            />
            <span className={styles.tokenTag}>LP</span>
          </div>
        </div>

        {/* Output estimate */}
        {lpAmount > 0n && (
          <div className={`glass-card ${styles.outputEstimate}`}>
            <span className={styles.estimateLabel}>You will receive approximately:</span>
            <div className={styles.outputRow}>
              <span>{formatTokenAmount(amountA, tokenA.decimals)} {tokenA.symbol}</span>
              <span>{formatTokenAmount(amountB, tokenB.decimals)} {tokenB.symbol}</span>
            </div>
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
            ✓ Liquidity removed!{" "}
            <a href={getSolscanUrl(txSignature)} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>
              View on Solscan ↗
            </a>
          </div>
        )}

        <button
          id="remove-liquidity-confirm-btn"
          className="btn btn-danger btn-lg"
          style={{ width: "100%" }}
          onClick={handleRemove}
          disabled={!connected || lpAmount === 0n || lpAmount > userLpBalance || isLoading}
        >
          {isLoading ? (
            <>
              <div className="spinner" />
              {status === "signing" ? "Waiting for signature..." : "Processing..."}
            </>
          ) : (
            "Remove Liquidity"
          )}
        </button>
      </div>
    </div>
  );
}
