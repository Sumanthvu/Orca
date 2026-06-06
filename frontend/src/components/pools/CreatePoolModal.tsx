"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useInitializePool } from "@/hooks/useInitializePool";
import { DEVNET_TOKENS, getSolscanUrl } from "@/lib/constants";
import styles from "./CreatePoolModal.module.css";

interface CreatePoolModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function isValidPubkey(s: string): boolean {
  try {
    new PublicKey(s);
    return true;
  } catch {
    return false;
  }
}

export function CreatePoolModal({ onClose, onSuccess }: CreatePoolModalProps) {
  const [mintA, setMintA] = useState(DEVNET_TOKENS[0].mint);
  const [mintB, setMintB] = useState(DEVNET_TOKENS[1].mint);

  const { initializePool, status, txSignature, error, reset } =
    useInitializePool();

  const isValidA = isValidPubkey(mintA);
  const isValidB = isValidPubkey(mintB);
  const areSame = mintA.trim() === mintB.trim() && mintA.trim().length > 0;
  const canSubmit =
    isValidA &&
    isValidB &&
    !areSame &&
    status !== "building" &&
    status !== "signing" &&
    status !== "confirming" &&
    status !== "success";

  const isBusy =
    status === "building" ||
    status === "signing" ||
    status === "confirming";

  const statusLabel: Record<typeof status, string> = {
    idle: "Create Pool",
    building: "Building transaction…",
    signing: "Waiting for wallet approval…",
    confirming: "Confirming on-chain…",
    success: "Pool Created!",
    error: "Retry",
  };

  async function handleSubmit() {
    if (!canSubmit) return;
    const sig = await initializePool({ tokenAMint: mintA, tokenBMint: mintB });
    if (sig) {
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h2 className={styles.title}>Create New Pool</h2>
            <p className={styles.subtitle}>
              Initialize a new constant-product AMM pool. You pay the one-time
              Solana account rent (~0.02 SOL).
            </p>
          </div>
          <button
            className="btn btn-ghost btn-icon"
            onClick={handleClose}
            aria-label="Close"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
              <path
                d="M4 4L12 12M12 4L4 12"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Token A Mint */}
        <div className={styles.inputGroup}>
          <div className={styles.inputLabel}>
            Token A Mint Address
            <span className={styles.inputHint}>Solana SPL token mint</span>
          </div>
          <input
            className="input"
            placeholder="e.g. Gjwa9WEJ3Gjj7N5s…"
            value={mintA}
            onChange={(e) => { setMintA(e.target.value); if (status === "error") reset(); }}
            disabled={isBusy || status === "success"}
            style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}
          />
          <div className={styles.quickFill}>
            {DEVNET_TOKENS.map((t) => (
              <button
                key={t.mint}
                className={styles.quickBtn}
                onClick={() => setMintA(t.mint)}
                disabled={isBusy}
              >
                {t.symbol}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.connector}>+</div>

        {/* Token B Mint */}
        <div className={styles.inputGroup}>
          <div className={styles.inputLabel}>
            Token B Mint Address
            <span className={styles.inputHint}>Must be different from A</span>
          </div>
          <input
            className="input"
            placeholder="e.g. 7MVV166ThiexXq39…"
            value={mintB}
            onChange={(e) => { setMintB(e.target.value); if (status === "error") reset(); }}
            disabled={isBusy || status === "success"}
            style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}
          />
          <div className={styles.quickFill}>
            {DEVNET_TOKENS.map((t) => (
              <button
                key={t.mint}
                className={styles.quickBtn}
                onClick={() => setMintB(t.mint)}
                disabled={isBusy}
              >
                {t.symbol}
              </button>
            ))}
          </div>
        </div>

        {/* Validation warning */}
        {areSame && (
          <div className={styles.warningBox}>
            <svg width="16" height="16" fill="none" viewBox="0 0 16 16" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M8 2L14 13H2L8 2Z" stroke="#fbbf24" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M8 6V9M8 11V11.5" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Token A and Token B must be different mints.
          </div>
        )}

        {/* Info grid */}
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoItemLabel}>Fee Tier</span>
            <span className={styles.infoItemValue}>0.3% per swap</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoItemLabel}>AMM Type</span>
            <span className={styles.infoItemValue}>Constant Product</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoItemLabel}>LP Token Decimals</span>
            <span className={styles.infoItemValue}>6</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoItemLabel}>Cost</span>
            <span className={styles.infoItemValue}>~0.02 SOL rent</span>
          </div>
        </div>

        {/* Error */}
        {status === "error" && error && (
          <div className={styles.errorBox}>
            <svg width="16" height="16" fill="none" viewBox="0 0 16 16" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="8" cy="8" r="6" stroke="#f87171" strokeWidth="1.5"/>
              <path d="M8 5V8.5M8 10.5V11" stroke="#f87171" strokeWidth="1.75" strokeLinecap="round"/>
            </svg>
            <span>{error.includes("already in use") ? "This pool already exists! You cannot create a duplicate pool for the same token pair." : error}</span>
          </div>
        )}

        {/* Success */}
        {status === "success" && txSignature && (
          <div className={styles.successBox}>
            <div className={styles.successTitle}>✓ Pool created successfully!</div>
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

        {/* Actions */}
        <div className={styles.actions}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={handleClose}>
            {status === "success" ? "Close" : "Cancel"}
          </button>
          {status !== "success" && (
            <button
              className={`btn btn-primary ${styles.actions}`}
              style={{ flex: 2 }}
              onClick={handleSubmit}
              disabled={!canSubmit || isBusy}
            >
              {isBusy && <span className="spinner" />}
              {statusLabel[status]}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
