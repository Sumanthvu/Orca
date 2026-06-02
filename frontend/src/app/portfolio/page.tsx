"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { usePools } from "@/hooks/usePool";
import { formatTokenAmount, formatUSD } from "@/lib/amm-math";
import { DEVNET_TOKENS, getSolscanUrl } from "@/lib/constants";
import styles from "./page.module.css";

function getToken(mint: string) {
  return DEVNET_TOKENS.find((t) => t.mint === mint) ?? {
    symbol: mint.slice(0, 6),
    decimals: 6,
    name: "Unknown",
    mint,
    logoURI: "",
  };
}

export default function PortfolioPage() {
  const { publicKey, connected } = useWallet();
  const { pools, loading } = usePools();

  // In a full implementation, we'd fetch user's LP token balances here
  // For now show the structure with placeholder data

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>
              My <span className="gradient-text">Portfolio</span>
            </h1>
            <p className={styles.pageSubtitle}>
              Track your liquidity positions and accrued LP fees.
            </p>
          </div>
        </div>

        {!connected ? (
          <div className={`glass-card ${styles.connectPrompt}`}>
            <div className={styles.connectIcon}>
              <svg width="56" height="56" fill="none" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="26" stroke="var(--color-border)" strokeWidth="2"/>
                <path d="M20 28C20 23.582 23.582 20 28 20C32.418 20 36 23.582 36 28" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round"/>
                <path d="M36 28C36 32.418 32.418 36 28 36C23.582 36 20 32.418 20 28" stroke="var(--color-secondary-light)" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="28" cy="28" r="4" fill="url(#pg1)"/>
                <defs>
                  <linearGradient id="pg1" x1="24" y1="24" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00d4ff"/>
                    <stop offset="1" stopColor="#06ffa5"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h2 className={styles.connectTitle}>Connect Your Wallet</h2>
            <p className={styles.connectDesc}>
              Connect your Solana wallet to view your liquidity positions and track your earnings.
            </p>
            <WalletMultiButton />
          </div>
        ) : (
          <>
            {/* Overview Cards */}
            <div className={styles.overviewGrid}>
              <div className={`glass-card ${styles.overviewCard}`}>
                <span className="stat-label">Total Position Value</span>
                <span className="stat-value gradient-text">$0.00</span>
                <span className={styles.overviewSub}>Across all pools</span>
              </div>
              <div className={`glass-card ${styles.overviewCard}`}>
                <span className="stat-label">Active Pools</span>
                <span className="stat-value">0</span>
                <span className={styles.overviewSub}>Pools with LP tokens</span>
              </div>
              <div className={`glass-card ${styles.overviewCard}`}>
                <span className="stat-label">Estimated Fees Earned</span>
                <span className="stat-value gradient-text-accent">$0.00</span>
                <span className={styles.overviewSub}>Since initial deposit</span>
              </div>
            </div>

            {/* Wallet Info */}
            <div className={`glass-card ${styles.walletInfo}`}>
              <div className={styles.walletHeader}>
                <div className={styles.walletDot} />
                <span className={styles.walletLabel}>Connected Wallet</span>
              </div>
              <div className={styles.walletAddress}>
                {publicKey?.toString()}
              </div>
              <a
                href={`https://explorer.solana.com/address/${publicKey?.toString()}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.explorerLink}
              >
                View on Explorer ↗
              </a>
            </div>

            {/* Positions Table */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Your Positions</h2>

              {loading ? (
                <div className={styles.skeletonList}>
                  {[1, 2].map((i) => (
                    <div key={i} className={`skeleton ${styles.skeletonRow}`} />
                  ))}
                </div>
              ) : pools.length === 0 ? (
                <div className={`glass-card ${styles.emptyPositions}`}>
                  <p className="text-secondary" style={{ textAlign: "center" }}>
                    You don't have any LP positions yet.{" "}
                    <a href="/pools" style={{ color: "var(--color-primary)" }}>
                      Add liquidity →
                    </a>
                  </p>
                </div>
              ) : (
                <div className={styles.positionsTable}>
                  <div className={styles.tableHeader}>
                    <span>Pool</span>
                    <span>Your LP Tokens</span>
                    <span>Token A Share</span>
                    <span>Token B Share</span>
                    <span>Actions</span>
                  </div>
                  {pools.map((pool) => {
                    const tokenA = getToken(pool.tokenAMint.toString());
                    const tokenB = getToken(pool.tokenBMint.toString());
                    // Placeholder LP balance — in production, fetch from chain
                    const lpBalance = 0n;
                    const shareA = pool.lpSupply > 0n ? (lpBalance * pool.reserveA) / pool.lpSupply : 0n;
                    const shareB = pool.lpSupply > 0n ? (lpBalance * pool.reserveB) / pool.lpSupply : 0n;

                    return (
                      <div key={pool.address.toString()} className={styles.tableRow}>
                        <div className={styles.poolPair}>
                          <div className={styles.pairLogos}>
                            <div className={styles.logoA}>{tokenA.symbol[0]}</div>
                            <div className={styles.logoB}>{tokenB.symbol[0]}</div>
                          </div>
                          <span className={styles.pairName}>
                            {tokenA.symbol}/{tokenB.symbol}
                          </span>
                        </div>
                        <span className={styles.tableValue}>
                          {formatTokenAmount(lpBalance, 6)}
                        </span>
                        <span className={styles.tableValue}>
                          {formatTokenAmount(shareA, tokenA.decimals)} {tokenA.symbol}
                        </span>
                        <span className={styles.tableValue}>
                          {formatTokenAmount(shareB, tokenB.decimals)} {tokenB.symbol}
                        </span>
                        <div className={styles.tableActions}>
                          <a href="/pools" className="btn btn-sm btn-secondary">
                            Manage
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className={styles.quickActions}>
              <a href="/swap" className="btn btn-primary">
                Swap Tokens
              </a>
              <a href="/pools" className="btn btn-secondary">
                Add Liquidity
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
