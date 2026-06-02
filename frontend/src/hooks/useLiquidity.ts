"use client";

import { useState, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import BN from "bn.js";
import { PROGRAM_ID, LP_MINT_SEED } from "@/lib/constants";
import { PoolData } from "./usePool";

export type LiquidityStatus = "idle" | "building" | "signing" | "confirming" | "success" | "error";

interface UseLiquidityReturn {
  addLiquidity: (params: {
    pool: PoolData;
    amountADesired: bigint;
    amountBDesired: bigint;
    slippagePct: number;
  }) => Promise<string | null>;
  removeLiquidity: (params: {
    pool: PoolData;
    lpAmount: bigint;
    slippagePct: number;
  }) => Promise<string | null>;
  status: LiquidityStatus;
  txSignature: string | null;
  error: string | null;
  reset: () => void;
}

export function useLiquidity(): UseLiquidityReturn {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [status, setStatus] = useState<LiquidityStatus>("idle");
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setTxSignature(null);
    setError(null);
  }, []);

  const sendAndConfirm = useCallback(
    async (tx: Transaction): Promise<string> => {
      try {
        console.log("Fetching blockhash...");
        const { blockhash } = await connection.getLatestBlockhash("confirmed");
        tx.recentBlockhash = blockhash;
        tx.feePayer = publicKey!;
        
        console.log("Requesting signature from Phantom...");
        const sig = await sendTransaction(tx, connection);
        
        console.log("Signature received. Confirming transaction...");
        setStatus("confirming");
        await connection.confirmTransaction(sig, "confirmed");
        console.log("Transaction confirmed!");
        return sig;
      } catch (err) {
        console.error("Transaction failed inside sendAndConfirm:", err);
        throw err;
      }
    },
    [connection, publicKey, sendTransaction]
  );

  const addLiquidity = useCallback(
    async ({
      pool,
      amountADesired,
      amountBDesired,
      slippagePct,
    }: {
      pool: PoolData;
      amountADesired: bigint;
      amountBDesired: bigint;
      slippagePct: number;
    }): Promise<string | null> => {
      if (!publicKey) { setError("Wallet not connected"); return null; }

      setStatus("building");
      setError(null);

      try {
        const slippageFactor = 1 - slippagePct / 100;
        const amountAMin = BigInt(Math.floor(Number(amountADesired) * slippageFactor));
        const amountBMin = BigInt(Math.floor(Number(amountBDesired) * slippageFactor));

        const userTokenA = await getAssociatedTokenAddress(pool.tokenAMint, publicKey);
        const userTokenB = await getAssociatedTokenAddress(pool.tokenBMint, publicKey);
        const userLpToken = await getAssociatedTokenAddress(pool.lpMint, publicKey);

        const tx = new Transaction();

        // Create LP ATA if needed
        const lpInfo = await connection.getAccountInfo(userLpToken);
        if (!lpInfo) {
          tx.add(
            createAssociatedTokenAccountInstruction(
              publicKey, userLpToken, publicKey, pool.lpMint
            )
          );
        }

        // Discriminator for "add_liquidity"
        const discriminator = Buffer.from([181, 157, 89, 67, 143, 182, 52, 72]);
        const data = Buffer.alloc(discriminator.length + 8 * 4);
        discriminator.copy(data, 0);
        Buffer.from(new BN(amountADesired.toString()).toArray("le", 8)).copy(data, 8);
        Buffer.from(new BN(amountBDesired.toString()).toArray("le", 8)).copy(data, 16);
        Buffer.from(new BN(amountAMin.toString()).toArray("le", 8)).copy(data, 24);
        Buffer.from(new BN(amountBMin.toString()).toArray("le", 8)).copy(data, 32);

        const keys = [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: pool.address, isSigner: false, isWritable: true },
          { pubkey: pool.vaultA, isSigner: false, isWritable: true },
          { pubkey: pool.vaultB, isSigner: false, isWritable: true },
          { pubkey: pool.lpMint, isSigner: false, isWritable: true },
          { pubkey: userTokenA, isSigner: false, isWritable: true },
          { pubkey: userTokenB, isSigner: false, isWritable: true },
          { pubkey: userLpToken, isSigner: false, isWritable: true },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: new PublicKey("11111111111111111111111111111111"), isSigner: false, isWritable: false },
        ];

        tx.add(new TransactionInstruction({ keys, programId: PROGRAM_ID, data }));

        setStatus("signing");
        const sig = await sendAndConfirm(tx);
        setTxSignature(sig);
        setStatus("success");
        return sig;
      } catch (err: unknown) {
        console.error("Add liquidity error:", err);
        const message = err instanceof Error ? err.message : "Add liquidity failed";
        setError(message);
        setStatus("error");
        return null;
      }
    },
    [connection, publicKey, sendAndConfirm]
  );

  const removeLiquidity = useCallback(
    async ({
      pool,
      lpAmount,
      slippagePct,
    }: {
      pool: PoolData;
      lpAmount: bigint;
      slippagePct: number;
    }): Promise<string | null> => {
      if (!publicKey) { setError("Wallet not connected"); return null; }

      setStatus("building");
      setError(null);

      try {
        const totalLp = pool.lpSupply;
        const slippageFactor = 1 - slippagePct / 100;
        const minA = BigInt(
          Math.floor(Number(lpAmount * pool.reserveA / totalLp) * slippageFactor)
        );
        const minB = BigInt(
          Math.floor(Number(lpAmount * pool.reserveB / totalLp) * slippageFactor)
        );

        const userLpToken = await getAssociatedTokenAddress(pool.lpMint, publicKey);
        const userTokenA = await getAssociatedTokenAddress(pool.tokenAMint, publicKey);
        const userTokenB = await getAssociatedTokenAddress(pool.tokenBMint, publicKey);

        const tx = new Transaction();

        // Create ATAs if needed
        const [aInfo, bInfo] = await Promise.all([
          connection.getAccountInfo(userTokenA),
          connection.getAccountInfo(userTokenB),
        ]);
        if (!aInfo) tx.add(createAssociatedTokenAccountInstruction(publicKey, userTokenA, publicKey, pool.tokenAMint));
        if (!bInfo) tx.add(createAssociatedTokenAccountInstruction(publicKey, userTokenB, publicKey, pool.tokenBMint));

        // Discriminator for "remove_liquidity"
        const discriminator = Buffer.from([80, 85, 209, 72, 24, 206, 177, 108]);
        const data = Buffer.alloc(discriminator.length + 8 * 3);
        discriminator.copy(data, 0);
        Buffer.from(new BN(lpAmount.toString()).toArray("le", 8)).copy(data, 8);
        Buffer.from(new BN(minA.toString()).toArray("le", 8)).copy(data, 16);
        Buffer.from(new BN(minB.toString()).toArray("le", 8)).copy(data, 24);

        const keys = [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: pool.address, isSigner: false, isWritable: true },
          { pubkey: pool.tokenAMint, isSigner: false, isWritable: false },
          { pubkey: pool.tokenBMint, isSigner: false, isWritable: false },
          { pubkey: pool.vaultA, isSigner: false, isWritable: true },
          { pubkey: pool.vaultB, isSigner: false, isWritable: true },
          { pubkey: pool.lpMint, isSigner: false, isWritable: true },
          { pubkey: userLpToken, isSigner: false, isWritable: true },
          { pubkey: userTokenA, isSigner: false, isWritable: true },
          { pubkey: userTokenB, isSigner: false, isWritable: true },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: new PublicKey("11111111111111111111111111111111"), isSigner: false, isWritable: false },
        ];

        tx.add(new TransactionInstruction({ keys, programId: PROGRAM_ID, data }));

        setStatus("signing");
        const sig = await sendAndConfirm(tx);
        setTxSignature(sig);
        setStatus("success");
        return sig;
      } catch (err: unknown) {
        console.error("Remove liquidity error:", err);
        const message = err instanceof Error ? err.message : "Remove liquidity failed";
        setError(message);
        setStatus("error");
        return null;
      }
    },
    [connection, publicKey, sendAndConfirm]
  );

  return { addLiquidity, removeLiquidity, status, txSignature, error, reset };
}
