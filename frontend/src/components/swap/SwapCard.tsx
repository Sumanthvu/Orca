"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { TokenSelector } from "./TokenSelector";
import { usePool } from "@/hooks/usePool";
import { useSwap } from "@/hooks/useSwap";
import {
  calculateSwapOutput,
  calculatePriceImpact,
  calculateMinimumReceived,
  formatTokenAmount,
  parseTokenAmount,
} from "@/lib/amm-math";
import { DEVNET_TOKENS, getSolscanUrl, type TokenInfo } from "@/lib/constants";
import styles from "./SwapCard.module.css";

const SLIPPAGE_OPTIONS = [0.1, 0.5, 1.0];

export function SwapCard() {
  const { connected } = useWallet();

  const [tokenIn, setTokenIn] = useState<TokenInfo>(DEVNET_TOKENS[0]);
  const [tokenOut, setTokenOut] = useState<TokenInfo>(DEVNET_TOKENS[1]);
  const [amountInStr, setAmountInStr] = useState("");
  const [slippagePct, setSlippagePct] = useState(0.5);
  const [customSlippage, setCustomSlippage] = useState("");
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);

  const { pool, loading: poolLoading } = usePool(tokenIn.mint, tokenOut.mint);
  const { executeSwap, status, txSignature, error, reset } = useSwap();

  // Derived calculation values
  const amountIn = parseTokenAmount(amountInStr, tokenIn.decimals);
  const aToB = tokenIn.mint === pool?.tokenAMint.toString();

  const { expectedOut, priceImpact, minimumOut } = (() => {
    if (!pool || amountIn === 0n) {
      return { expectedOut: 0n, priceImpact: 0, minimumOut: 0n };
    }
    const reserveIn = aToB ? pool.reserveA : pool.reserveB;
    const reserveOut = aToB ? pool.reserveB : pool.reserveA;
    const out = calculateSwapOutput(amountIn, reserveIn, reserveOut);
    const impact = calculatePriceImpact(amountIn, reserveIn, reserveOut);
    const minOut = calculateMinimumReceived(out, slippagePct);
    return { expectedOut: out, priceImpact: impact, minimumOut: minOut };
  })();

  const handleFlip = useCallback(() => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountInStr("");
    reset();
  }, [tokenIn, tokenOut, reset]);

  const handleSwap = useCallback(async () => {
    if (!pool || amountIn === 0n) return;
    await executeSwap({
      pool,
      amountIn,
      slippagePct,
      aToB,
      tokenInMint: tokenIn.mint,
      tokenOutMint: tokenOut.mint,
    });
  }, [pool, amountIn, slippagePct, aToB, tokenIn, tokenOut, executeSwap]);

  const handleSlippage = (val: number) => {
    setSlippagePct(val);
    setCustomSlippage("");
  };

  const handleCustomSlippage = (val: string) => {
    setCustomSlippage(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0 && num < 50) {
      setSlippagePct(num);
    }
  };

  // Reset on success after 3s
  useEffect(() => {
    if (status === "success") {
      const t = setTimeout(() => {
        setAmountInStr("");
        reset();
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [status, reset]);

  const isLoading = status === "building" || status === "signing" || status === "confirming";
  const canSwap = connected && pool && amountIn > 0n && !isLoading;

  const impactColor =
    priceImpact < 1 ? "var(--color-success)" :
    priceImpact < 3 ? "var(--color-warning)" :
    "var(--color-error)";

  return (
    <div className={`glass-card-elevated ${styles.card}`}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Swap</h2>
        <button
          id="slippage-settings-btn"
          className={`btn btn-ghost btn-icon ${showSlippageSettings ? styles.settingsActive : ""}`}
          onClick={() => setShowSlippageSettings(!showSlippageSettings)}
          title="Slippage settings"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 18 18">
            <path d="M3 5H15M3 9H11M3 13H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="13.5" cy="13" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </button>
      </div>

      {/* Slippage Settings */}
      {showSlippageSettings && (
        <div className={`${styles.slippagePanel} animate-fade-in`}>
          <span className={styles.slippageLabel}>Slippage Tolerance</span>
          <div className={styles.slippageOptions}>
            {SLIPPAGE_OPTIONS.map((opt) => (
              <button
                key={opt}
                id={`slippage-${opt}`}
                className={`btn btn-sm ${slippagePct === opt && !customSlippage ? "btn-primary" : "btn-secondary"}`}
                onClick={() => handleSlippage(opt)}
              >
                {opt}%
              </button>
            ))}
            <input
              id="slippage-custom"
              className={`input ${styles.slippageCustom}`}
              placeholder="Custom"
              value={customSlippage}
              onChange={(e) => handleCustomSlippage(e.target.value)}
              type="number"
              min="0.01"
              max="49"
              step="0.1"
            />
          </div>
        </div>
      )}

      {/* Token In */}
      <div className={styles.tokenBox}>
        <div className={styles.tokenBoxHeader}>
          <span className="stat-label">You pay</span>
          {connected && (
            <span className={styles.balance}>Balance: —</span>
          )}
        </div>
        <div className={styles.tokenInputRow}>
          <input
            id="amount-in"
            className={`input-lg ${styles.amountInput}`}
            placeholder="0"
            value={amountInStr}
            onChange={(e) => {
              setAmountInStr(e.target.value);
              reset();
            }}
            type="number"
            min="0"
          />
          <TokenSelector
            selected={tokenIn}
            onChange={(t) => { setTokenIn(t); reset(); }}
            disabledMint={tokenOut.mint}
            label="token-in"
          />
        </div>
      </div>

      {/* Flip button */}
      <div className={styles.flipWrapper}>
        <button
          id="flip-tokens-btn"
          className={`btn btn-ghost btn-icon ${styles.flipBtn}`}
          onClick={handleFlip}
          title="Flip tokens"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 18 18">
            <path d="M5 3L5 15M5 15L2 12M5 15L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M13 15V3M13 3L10 6M13 3L16 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Token Out */}
      <div className={styles.tokenBox}>
        <div className={styles.tokenBoxHeader}>
          <span className="stat-label">You receive</span>
        </div>
        <div className={styles.tokenInputRow}>
          <div className={styles.outputAmount}>
            {poolLoading ? (
              <span className={`skeleton ${styles.skeleton}`} />
            ) : expectedOut > 0n ? (
              <span className="gradient-text">
                {formatTokenAmount(expectedOut, tokenOut.decimals)}
              </span>
            ) : (
              <span className={styles.zeroOutput}>0</span>
            )}
          </div>
          <TokenSelector
            selected={tokenOut}
            onChange={(t) => { setTokenOut(t); reset(); }}
            disabledMint={tokenIn.mint}
            label="token-out"
          />
        </div>
      </div>

      {/* Swap Details */}
      {pool && amountIn > 0n && (
        <div className={`${styles.details} animate-fade-in`}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Price Impact</span>
            <span style={{ color: impactColor, fontWeight: 600 }}>
              {priceImpact.toFixed(2)}%
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Min. Received ({slippagePct}% slippage)</span>
            <span className={styles.detailValue}>
              {formatTokenAmount(minimumOut, tokenOut.decimals)} {tokenOut.symbol}
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>LP Fee (0.3%)</span>
            <span className={styles.detailValue}>
              {formatTokenAmount((amountIn * 3n) / 1000n, tokenIn.decimals)} {tokenIn.symbol}
            </span>
          </div>
        </div>
      )}

      {/* Pool not found warning */}
      {!poolLoading && !pool && tokenIn && tokenOut && (
        <div className={`badge badge-warning ${styles.poolWarning}`}>
          No pool exists for {tokenIn.symbol}/{tokenOut.symbol} — create one in Pools
        </div>
      )}

      {/* Error */}
      {error && status === "error" && (
        <div className={`badge badge-error ${styles.errorMsg}`}>
          {error.includes("SlippageExceeded")
            ? "Slippage exceeded — try increasing tolerance"
            : error.length > 80 ? "Transaction failed — check your balances" : error}
        </div>
      )}

      {/* Success */}
      {status === "success" && txSignature && (
        <div className={`${styles.successBanner} animate-fade-in`}>
          <svg width="18" height="18" fill="none" viewBox="0 0 18 18">
            <path d="M3 9L7 13L15 5" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Swap successful!</span>
          <a
            href={getSolscanUrl(txSignature)}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.txLink}
          >
            View on Solscan ↗
          </a>
        </div>
      )}

      {/* Action Button */}
      {!connected ? (
        <WalletMultiButton style={{ width: "100%" }} />
      ) : (
        <button
          id="swap-execute-btn"
          className={`btn btn-primary btn-lg ${styles.swapBtn}`}
          onClick={handleSwap}
          disabled={!canSwap}
        >
          {isLoading ? (
            <>
              <div className="spinner" />
              {status === "building" && "Building..."}
              {status === "signing" && "Waiting for signature..."}
              {status === "confirming" && "Confirming..."}
            </>
          ) : status === "success" ? (
            "✓ Swapped!"
          ) : !pool ? (
            "No pool available"
          ) : amountIn === 0n ? (
            "Enter an amount"
          ) : (
            `Swap ${tokenIn.symbol} → ${tokenOut.symbol}`
          )}
        </button>
      )}
    </div>
  );
}
