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
import { PoolData } from "@/hooks/usePool";
import styles from "./page.module.css";

export default function PoolsPage() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const { pools, loading, refetch } = usePools();

  const [lpBalances, setLpBalances] = useState<Record<string, bigint>>({});

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

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>
              Liquidity <span className="gradient-text">Pools</span>
            </h1>
            <p className={styles.pageSubtitle}>
              Deposit token pairs to earn 0.3% on every swap. Your LP tokens
              represent your share of the pool.
            </p>
          </div>
          {!connected && (
            <ClientWalletButton />
          )}
        </div>

        {/* Stats row */}
        <div className={styles.statsRow}>
          <div className={`glass-card ${styles.statCard}`}>
            <span className="stat-label">Total Pools</span>
            <span className="stat-value">{pools.length}</span>
          </div>
          <div className={`glass-card ${styles.statCard}`}>
            <span className="stat-label">Your Positions</span>
            <span className="stat-value">—</span>
          </div>
          <div className={`glass-card ${styles.statCard}`}>
            <span className="stat-label">Total LP Value</span>
            <span className="stat-value">—</span>
          </div>
        </div>

        {/* Pools List */}
        {loading ? (
          <div className={styles.loadingGrid}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={`glass-card skeleton ${styles.skeletonCard}`} />
            ))}
          </div>
        ) : pools.length === 0 ? (
          <div className={`glass-card ${styles.emptyState}`}>
            <div className={styles.emptyIcon}>
              <svg width="48" height="48" fill="none" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="22" stroke="var(--color-border)" strokeWidth="2"/>
                <path d="M24 14V24M24 24L30 30M24 24L18 30" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className={styles.emptyTitle}>No Pools Found</h3>
            <p className={styles.emptyDesc}>
              No liquidity pools have been initialized yet. Deploy the program
              and create the first pool!
            </p>
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
