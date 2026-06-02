"use client";

import { useEffect, useState, useCallback } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  PROGRAM_ID,
  POOL_SEED,
  VAULT_A_SEED,
  VAULT_B_SEED,
  LP_MINT_SEED,
} from "@/lib/constants";

export interface PoolData {
  address: PublicKey;
  tokenAMint: PublicKey;
  tokenBMint: PublicKey;
  vaultA: PublicKey;
  vaultB: PublicKey;
  lpMint: PublicKey;
  reserveA: bigint;
  reserveB: bigint;
  lpSupply: bigint;
  feeNumerator: bigint;
  feeDenominator: bigint;
}

/**
 * Derives the Pool State PDA address for a given token pair.
 */
export async function findPoolAddress(
  tokenAMint: PublicKey,
  tokenBMint: PublicKey
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress(
    [POOL_SEED, tokenAMint.toBuffer(), tokenBMint.toBuffer()],
    PROGRAM_ID
  );
}

/**
 * Derives vault and LP mint PDAs for a given pool address.
 */
export async function findPoolPDAs(poolAddress: PublicKey) {
  const [vaultA] = await PublicKey.findProgramAddress(
    [VAULT_A_SEED, poolAddress.toBuffer()],
    PROGRAM_ID
  );
  const [vaultB] = await PublicKey.findProgramAddress(
    [VAULT_B_SEED, poolAddress.toBuffer()],
    PROGRAM_ID
  );
  const [lpMint] = await PublicKey.findProgramAddress(
    [LP_MINT_SEED, poolAddress.toBuffer()],
    PROGRAM_ID
  );
  return { vaultA, vaultB, lpMint };
}

/**
 * Hook to fetch and subscribe to pool data for a given token pair.
 */
export function usePool(
  tokenAMint: string | null,
  tokenBMint: string | null
): {
  pool: PoolData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const { connection } = useConnection();
  const [pool, setPool] = useState<PoolData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPool = useCallback(async () => {
    if (!tokenAMint || !tokenBMint) {
      setPool(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const mintA = new PublicKey(tokenAMint);
      const mintB = new PublicKey(tokenBMint);

      const [poolAddress] = await findPoolAddress(mintA, mintB);

      // Fetch pool account data
      const accountInfo = await connection.getAccountInfo(poolAddress);
      if (!accountInfo) {
        setPool(null);
        setError("Pool not found for this token pair");
        return;
      }

      // Decode the pool state (skip 8 byte discriminator)
      const data = accountInfo.data;
      let offset = 8;

      const readPubkey = () => {
        const key = new PublicKey(data.slice(offset, offset + 32));
        offset += 32;
        return key;
      };
      const readU64 = () => {
        const val = data.readBigUInt64LE(offset);
        offset += 8;
        return val;
      };
      const readU8 = () => {
        const val = data[offset];
        offset += 1;
        return val;
      };

      const authority = readPubkey();
      const tokenAMintKey = readPubkey();
      const tokenBMintKey = readPubkey();
      const vaultAKey = readPubkey();
      const vaultBKey = readPubkey();
      const lpMintKey = readPubkey();
      const feeNumerator = readU64();
      const feeDenominator = readU64();
      const lpSupply = readU64();
      readU8(); // bump
      readU8(); // vault_a_bump
      readU8(); // vault_b_bump
      readU8(); // lp_mint_bump

      // Fetch vault balances
      const [vaultAInfo, vaultBInfo] = await Promise.all([
        connection.getTokenAccountBalance(vaultAKey),
        connection.getTokenAccountBalance(vaultBKey),
      ]);

      setPool({
        address: poolAddress,
        tokenAMint: tokenAMintKey,
        tokenBMint: tokenBMintKey,
        vaultA: vaultAKey,
        vaultB: vaultBKey,
        lpMint: lpMintKey,
        reserveA: BigInt(vaultAInfo.value.amount),
        reserveB: BigInt(vaultBInfo.value.amount),
        lpSupply,
        feeNumerator,
        feeDenominator,
      });
    } catch (err) {
      console.error("Error fetching pool:", err);
      setError("Failed to fetch pool data");
      setPool(null);
    } finally {
      setLoading(false);
    }
  }, [connection, tokenAMint, tokenBMint]);

  useEffect(() => {
    fetchPool();
    // Subscribe to account changes for live updates
    if (!tokenAMint || !tokenBMint) return;

    let subscriptionId: number;
    (async () => {
      const mintA = new PublicKey(tokenAMint);
      const mintB = new PublicKey(tokenBMint);
      const [poolAddress] = await findPoolAddress(mintA, mintB);
      subscriptionId = connection.onAccountChange(poolAddress, fetchPool);
    })();

    return () => {
      if (subscriptionId !== undefined) {
        connection.removeAccountChangeListener(subscriptionId);
      }
    };
  }, [connection, tokenAMint, tokenBMint, fetchPool]);

  return { pool, loading, error, refetch: fetchPool };
}

/**
 * Hook to fetch all pools from the program.
 */
export function usePools(): {
  pools: PoolData[];
  loading: boolean;
  refetch: () => void;
} {
  const { connection } = useConnection();
  const [pools, setPools] = useState<PoolData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPools = useCallback(async () => {
    setLoading(true);
    try {
      // Get all accounts owned by our program with size matching Pool::LEN
      const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
        filters: [{ dataSize: 228 }], // 8 (disc) + 6*32 (pubkeys) + 3*8 (u64s) + 4 (u8s) = 228
      });

      const poolPromises = accounts.map(async ({ pubkey, account }) => {
        try {
          const data = account.data;
          let offset = 8; // Skip discriminator

          const readPubkey = () => {
            const key = new PublicKey(data.slice(offset, offset + 32));
            offset += 32;
            return key;
          };
          const readU64 = () => {
            const val = data.readBigUInt64LE(offset);
            offset += 8;
            return val;
          };
          const readU8 = () => {
            const val = data[offset];
            offset += 1;
            return val;
          };

          readPubkey(); // authority
          const tokenAMintKey = readPubkey();
          const tokenBMintKey = readPubkey();
          const vaultAKey = readPubkey();
          const vaultBKey = readPubkey();
          const lpMintKey = readPubkey();
          const feeNumerator = readU64();
          const feeDenominator = readU64();
          const lpSupply = readU64();
          readU8(); // bump
          readU8(); // vault_a_bump
          readU8(); // vault_b_bump
          readU8(); // lp_mint_bump

          const [vaultAInfo, vaultBInfo] = await Promise.all([
            connection.getTokenAccountBalance(vaultAKey),
            connection.getTokenAccountBalance(vaultBKey),
          ]);

          return {
            address: pubkey,
            tokenAMint: tokenAMintKey,
            tokenBMint: tokenBMintKey,
            vaultA: vaultAKey,
            vaultB: vaultBKey,
            lpMint: lpMintKey,
            reserveA: BigInt(vaultAInfo.value.amount),
            reserveB: BigInt(vaultBInfo.value.amount),
            lpSupply,
            feeNumerator,
            feeDenominator,
          } as PoolData;
        } catch {
          return null;
        }
      });

      const results = (await Promise.all(poolPromises)).filter(
        Boolean
      ) as PoolData[];
      setPools(results);
    } catch (err) {
      console.error("Error fetching pools:", err);
    } finally {
      setLoading(false);
    }
  }, [connection]);

  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  return { pools, loading, refetch: fetchPools };
}
