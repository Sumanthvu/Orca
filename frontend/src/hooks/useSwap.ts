"use client";

import { useState, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import BN from "bn.js";
import { PROGRAM_ID, VAULT_A_SEED, VAULT_B_SEED, POOL_SEED } from "@/lib/constants";
import { calculateSwapOutput, calculateMinimumReceived } from "@/lib/amm-math";
import { PoolData } from "./usePool";

export type SwapStatus = "idle" | "building" | "signing" | "confirming" | "success" | "error";

interface UseSwapReturn {
  executeSwap: (params: {
    pool: PoolData;
    amountIn: bigint;
    slippagePct: number;
    aToB: boolean;
    tokenInMint: string;
    tokenOutMint: string;
  }) => Promise<string | null>;
  status: SwapStatus;
  txSignature: string | null;
  error: string | null;
  reset: () => void;
}

export function useSwap(): UseSwapReturn {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [status, setStatus] = useState<SwapStatus>("idle");
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setTxSignature(null);
    setError(null);
  }, []);

  const executeSwap = useCallback(
    async ({
      pool,
      amountIn,
      slippagePct,
      aToB,
      tokenInMint,
      tokenOutMint,
    }: {
      pool: PoolData;
      amountIn: bigint;
      slippagePct: number;
      aToB: boolean;
      tokenInMint: string;
      tokenOutMint: string;
    }): Promise<string | null> => {
      if (!publicKey) {
        setError("Wallet not connected");
        return null;
      }

      setStatus("building");
      setError(null);

      try {
        const tokenInPubkey = new PublicKey(tokenInMint);
        const tokenOutPubkey = new PublicKey(tokenOutMint);

        // Calculate minimum output with slippage
        const reserveIn = aToB ? pool.reserveA : pool.reserveB;
        const reserveOut = aToB ? pool.reserveB : pool.reserveA;
        const expectedOut = calculateSwapOutput(amountIn, reserveIn, reserveOut);
        const minimumOut = calculateMinimumReceived(expectedOut, slippagePct);

        // Get user token accounts
        const userTokenIn = await getAssociatedTokenAddress(tokenInPubkey, publicKey);
        const userTokenOut = await getAssociatedTokenAddress(tokenOutPubkey, publicKey);

        const tx = new Transaction();

        // Create output ATA if it doesn't exist
        const outAccountInfo = await connection.getAccountInfo(userTokenOut);
        if (!outAccountInfo) {
          tx.add(
            createAssociatedTokenAccountInstruction(
              publicKey,
              userTokenOut,
              publicKey,
              tokenOutPubkey
            )
          );
        }

        // Build swap instruction
        // Discriminator for "swap" = sha256("global:swap")[0..8]
        const discriminator = Buffer.from([248, 198, 158, 145, 225, 117, 135, 200]);

        const data = Buffer.alloc(discriminator.length + 8 + 8 + 1);
        discriminator.copy(data, 0);
        const amountInBN = new BN(amountIn.toString());
        const minOutBN = new BN(minimumOut.toString());
        Buffer.from(amountInBN.toArray("le", 8)).copy(data, 8);
        Buffer.from(minOutBN.toArray("le", 8)).copy(data, 16);
        data.writeUInt8(aToB ? 1 : 0, 24);

        const keys = [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: pool.address, isSigner: false, isWritable: false },
          { pubkey: pool.vaultA, isSigner: false, isWritable: true },
          { pubkey: pool.vaultB, isSigner: false, isWritable: true },
          { pubkey: userTokenIn, isSigner: false, isWritable: true },
          { pubkey: userTokenOut, isSigner: false, isWritable: true },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ];

        tx.add(new TransactionInstruction({ keys, programId: PROGRAM_ID, data }));

        setStatus("signing");
        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = publicKey;

        const signature = await sendTransaction(tx, connection);

        setStatus("confirming");
        await connection.confirmTransaction(signature, "confirmed");

        setTxSignature(signature);
        setStatus("success");
        return signature;
      } catch (err: unknown) {
        console.error("Swap error:", err);
        const message = err instanceof Error ? err.message : "Swap failed";
        setError(message);
        setStatus("error");
        return null;
      }
    },
    [connection, publicKey, sendTransaction]
  );

  return { executeSwap, status, txSignature, error, reset };
}
