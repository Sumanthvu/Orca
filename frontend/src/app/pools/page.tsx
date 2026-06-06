"use client";

import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { ClientWalletButton } from "@/components/ClientWalletButton";
import { useEffect } from "react";
import { usePools } from "@/hooks/usePool";
import { PoolCard } from "@/components/pools/PoolCard";
import { AddLiquidityModal } from "@/components/pools/AddLiquidityModal";
import { RemoveLiquidityModal } from "@/components/pools/RemoveLiquidityModal";
import { CreatePoolModal } from "@/components/pools/CreatePoolModal";
import { PoolData } from "@/hooks/usePool";
import styles from "./page.module.css";

export default function PoolsPage() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const { pools, loading, refetch } = usePools();

  const [lpBalances, setLpBalances] = useState<Record<string, bigint>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!connected || !publicKey || pools.length === 0) return;
    const fetchBalances = async () => {
      const balances: Record<string, bigint> = {};
      for (const pool of pools) {
        try {
          const lpAta = await getAssociatedTokenAddress(pool.lpMint, publicKey);
          const info = await connection.getTokenAccountBalance(lpAta);
          balances[pool.address.toString()] = BigInt(info.value.amount);
        } catch {
          balances[pool.address.toString()] = 0n;
        }
      }
      setLpBalances(balances);
    };
    fetchBalances();
  }, [connected, publicKey, pools, connection]);

  const [addModalPool, setAddModalPool] = useState<PoolData | null>(null);
  const [removeModalPool, setRemoveModalPool] = useState<PoolData | null>(null);

  // Count how many pools the user has an LP position in
  const myPositions = pools.filter(
    (p) => (lpBalances[p.address.toString()] ?? 0n) > 0n
  ).length;

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>
              Liquidity <span className="gradient-text">Pools</span>
            </h1>
            <p className={styles.pageSubtitle}>
              Deposit token pairs to earn 0.3% on every swap. Your LP tokens
              represent your share of the pool.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexShrink: 0 }}>
            {!connected && <ClientWalletButton />}
            {connected && (
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
                  <path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Create Pool
              </button>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className="stat-label">Total Pools</span>
            <span className="stat-value">{loading ? "—" : pools.length}</span>
          </div>
          <div className={styles.statCard}>
            <span className="stat-label">Your Positions</span>
            <span className="stat-value">{connected ? myPositions : "—"}</span>
          </div>
          <div className={styles.statCard}>
            <span className="stat-label">Fee Tier</span>
            <span className="stat-value">0.3%</span>
          </div>
        </div>

        {/* Pools List */}
        {loading ? (
          <div className={styles.loadingGrid}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={`skeleton ${styles.skeletonCard}`} />
            ))}
          </div>
        ) : pools.length === 0 ? (
          <div className={`glass-card ${styles.emptyState}`}>
            <div className={styles.emptyIcon}>
              <svg width="28" height="28" fill="none" viewBox="0 0 28 28">
                <circle cx="14" cy="14" r="12" stroke="var(--border)" strokeWidth="1.5"/>
                <path d="M14 8V14M14 14L18 18M14 14L10 18" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className={styles.emptyTitle}>No Pools Found</h3>
            <p className={styles.emptyDesc}>
              No liquidity pools exist yet. Create the first one using the{" "}
              <strong style={{ color: "var(--primary-light)" }}>Create Pool</strong>{" "}
              button above!
            </p>
            {connected && (
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
                style={{ marginTop: "0.5rem" }}
              >
                Create First Pool
              </button>
            )}
          </div>
        ) : (
          <div className={styles.poolsGrid}>
            {pools.map((pool) => (
              <PoolCard
                key={pool.address.toString()}
                pool={pool}
                userLpBalance={lpBalances[pool.address.toString()] || 0n}
                onAddLiquidity={setAddModalPool}
                onRemoveLiquidity={setRemoveModalPool}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreatePoolModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            refetch();
          }}
        />
      )}

      {addModalPool && (
        <AddLiquidityModal
          pool={addModalPool}
          onClose={() => setAddModalPool(null)}
          onSuccess={refetch}
        />
      )}

      {removeModalPool && (
        <RemoveLiquidityModal
          pool={removeModalPool}
          userLpBalance={lpBalances[removeModalPool.address.toString()] || 0n}
          onClose={() => setRemoveModalPool(null)}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
