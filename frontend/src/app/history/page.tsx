"use client";

import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { ClientWalletButton } from "@/components/ClientWalletButton";
import { useTransactionHistory, TxType } from "@/hooks/useTransactionHistory";
import styles from "./page.module.css";

// ─── Helpers ────────────────────────────────────────────────

function formatTime(ts: number | null): string {
  if (!ts) return "—";
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function truncateSig(sig: string): string {
  return `${sig.slice(0, 8)}…${sig.slice(-6)}`;
}

const TYPE_LABELS: Record<TxType, string> = {
  swap:             "Swap",
  add_liquidity:    "Add Liquidity",
  remove_liquidity: "Remove Liquidity",
  initialize_pool:  "Create Pool",
  unknown:          "Unknown",
};

const TYPE_ICONS: Record<TxType, React.ReactNode> = {
  swap: (
    <svg width="10" height="10" fill="none" viewBox="0 0 10 10">
      <path d="M1 4h8M1 4L3 2M1 4L3 6M9 6H1M9 6L7 4M9 6L7 8"
        stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  add_liquidity: (
    <svg width="10" height="10" fill="none" viewBox="0 0 10 10">
      <path d="M5 1V9M1 5H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  remove_liquidity: (
    <svg width="10" height="10" fill="none" viewBox="0 0 10 10">
      <path d="M1 5H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  initialize_pool: (
    <svg width="10" height="10" fill="none" viewBox="0 0 10 10">
      <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.25"/>
      <path d="M5 3V5L6.5 6.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
    </svg>
  ),
  unknown: null,
};

// ─── Page ───────────────────────────────────────────────────

export default function HistoryPage() {
  const { connected } = useWallet();
  const { history, loading, error, refetch } = useTransactionHistory();

  // Fetch when wallet connects
  useEffect(() => {
    if (connected) refetch();
  }, [connected]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stats
  const swaps   = history.filter((h) => h.type === "swap").length;
  const adds    = history.filter((h) => h.type === "add_liquidity").length;
  const removes = history.filter((h) => h.type === "remove_liquidity").length;
  const inits   = history.filter((h) => h.type === "initialize_pool").length;

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>
              Transaction <span className="gradient-text">History</span>
            </h1>
            <p className={styles.pageSubtitle}>
              Your last 50 on-chain interactions with the Orca AMM program.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            {!connected && <ClientWalletButton />}
            {connected && (
              <button
                className="btn btn-secondary"
                onClick={refetch}
                disabled={loading}
              >
                {loading ? <span className="spinner" /> : (
                  <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
                    <path d="M2 7C2 4.239 4.239 2 7 2C8.68 2 10.17 2.84 11.07 4.1M12 7C12 9.761 9.761 12 7 12C5.32 12 3.83 11.16 2.93 9.9"
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M11 1.5V4.5H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 9.5V12.5H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                Refresh
              </button>
            )}
          </div>
        </div>

        {/* Not connected */}
        {!connected ? (
          <div className={`glass-card ${styles.connectPrompt}`}>
            <div className={styles.connectIcon}>
              <svg width="28" height="28" fill="none" viewBox="0 0 28 28">
                <path d="M6 14C6 9.582 9.582 6 14 6C18.418 6 22 9.582 22 14"
                  stroke="var(--primary-light)" strokeWidth="1.75" strokeLinecap="round"/>
                <path d="M22 14C22 18.418 18.418 22 14 22C9.582 22 6 18.418 6 14"
                  stroke="var(--text-muted)" strokeWidth="1.75" strokeLinecap="round"/>
                <circle cx="14" cy="14" r="3" fill="var(--primary-light)"/>
              </svg>
            </div>
            <h2 className={styles.connectTitle}>Connect Your Wallet</h2>
            <p className={styles.connectDesc}>
              Connect your Phantom wallet to see your Orca AMM transaction history.
            </p>
            <ClientWalletButton />
          </div>
        ) : (
          <>
            {/* Stats row (shown only when history loaded) */}
            {!loading && history.length > 0 && (
              <div className={styles.statsRow}>
                <div className={styles.statCard}>
                  <span className="stat-label">Total Txs</span>
                  <span className="stat-value">{history.length}</span>
                </div>
                <div className={styles.statCard}>
                  <span className="stat-label">Swaps</span>
                  <span className="stat-value">{swaps}</span>
                </div>
                <div className={styles.statCard}>
                  <span className="stat-label">Liquidity Events</span>
                  <span className="stat-value">{adds + removes}</span>
                </div>
                <div className={styles.statCard}>
                  <span className="stat-label">Pools Created</span>
                  <span className="stat-value">{inits}</span>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                padding: "1rem 1.25rem",
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.18)",
                borderRadius: "var(--radius-md)",
                color: "#f87171",
                fontSize: "0.875rem",
                marginBottom: "1.5rem",
              }}>
                {error}
              </div>
            )}

            {loading ? (
              /* Loading */
              <div className={`glass-card`} style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center", textAlign: "center" }}>
                <span className="spinner" style={{ width: "24px", height: "24px", borderWidth: "3px" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)" }}>
                    Scanning blockchain…
                  </span>
                  <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                    Fetching your Orca transactions one at a time to respect Solana RPC limits. This may take 10–20 seconds.
                  </span>
                </div>
              </div>
            ) : history.length === 0 ? (
              /* Empty state */
              <div className={`glass-card ${styles.emptyState}`}>
                <div className={styles.emptyIcon}>
                  <svg width="26" height="26" fill="none" viewBox="0 0 26 26">
                    <path d="M5 13H21M5 8H21M5 18H14" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3 className={styles.emptyTitle}>No Transactions Yet</h3>
                <p className={styles.emptyDesc}>
                  You haven&apos;t made any swaps or liquidity changes with this wallet yet. Go make a swap!
                </p>
              </div>
            ) : (
              /* Table */
              <div className={styles.tableWrap}>
                <div className={styles.tableHeader}>
                  <span>Type</span>
                  <span>Signature</span>
                  <span>Time</span>
                  <span>Status</span>
                  <span>Explorer</span>
                </div>
                {history.map((item) => (
                  <div key={item.signature} className={styles.tableRow}>
                    {/* Type badge */}
                    <div>
                      <span className={`${styles.typeBadge} ${styles[item.type]}`}>
                        {TYPE_ICONS[item.type]}
                        {TYPE_LABELS[item.type]}
                      </span>
                    </div>

                    {/* Signature */}
                    <div className={styles.sigCell}>
                      <span className={styles.sigText}>
                        {truncateSig(item.signature)}
                      </span>
                    </div>

                    {/* Time */}
                    <div className={styles.timeCell}>
                      {formatTime(item.timestamp)}
                    </div>

                    {/* Status */}
                    <div>
                      <span className={`${styles.statusDot} ${styles[item.status]}`}>
                        <span className={`${styles.dot} ${styles[item.status]}`} />
                        {item.status === "success" ? "Success" : "Failed"}
                      </span>
                    </div>

                    {/* Link */}
                    <div>
                      <a
                        href={item.solscanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.txLink}
                      >
                        Solscan
                        <svg width="10" height="10" fill="none" viewBox="0 0 10 10">
                          <path d="M2 8L8 2M8 2H4.5M8 2V5.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
