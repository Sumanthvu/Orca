"use client";

import { useState, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  PROGRAM_ID,
  POOL_SEED,
  VAULT_A_SEED,
  VAULT_B_SEED,
  LP_MINT_SEED,
} from "@/lib/constants";

export type InitPoolStatus =
  | "idle"
  | "building"
  | "signing"
  | "confirming"
  | "success"
  | "error";

interface UseInitializePoolReturn {
  initializePool: (params: {
    tokenAMint: string;
    tokenBMint: string;
  }) => Promise<string | null>;
  status: InitPoolStatus;
  txSignature: string | null;
  error: string | null;
  reset: () => void;
}

/**
 * Hook that builds and sends the `initialize_pool` instruction.
 *
 * Accounts (matching InitializePool in Rust):
 *   authority         — signer, payer
 *   token_a_mint      — read-only
 *   token_b_mint      — read-only
 *   pool              — PDA [pool_seed, mintA, mintB], writable, init
 *   vault_a           — PDA [vault_a_seed, pool], writable, init
 *   vault_b           — PDA [vault_b_seed, pool], writable, init
 *   lp_mint           — PDA [lp_mint_seed, pool], writable, init
 *   token_program
 *   associated_token_program
 *   system_program
 *   rent
 */
export function useInitializePool(): UseInitializePoolReturn {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [status, setStatus] = useState<InitPoolStatus>("idle");
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setTxSignature(null);
    setError(null);
  }, []);

  const initializePool = useCallback(
    async ({
      tokenAMint,
      tokenBMint,
    }: {
      tokenAMint: string;
      tokenBMint: string;
    }): Promise<string | null> => {
      if (!publicKey) {
        setError("Wallet not connected");
        return null;
      }

      setStatus("building");
      setError(null);

      try {
        const mintAPubkey = new PublicKey(tokenAMint);
        const mintBPubkey = new PublicKey(tokenBMint);

        // Derive all PDAs deterministically (must match Rust seeds exactly)
        const [poolPDA] = await PublicKey.findProgramAddress(
          [POOL_SEED, mintAPubkey.toBuffer(), mintBPubkey.toBuffer()],
          PROGRAM_ID
        );
        const [vaultAPDA] = await PublicKey.findProgramAddress(
          [VAULT_A_SEED, poolPDA.toBuffer()],
          PROGRAM_ID
        );
        const [vaultBPDA] = await PublicKey.findProgramAddress(
          [VAULT_B_SEED, poolPDA.toBuffer()],
          PROGRAM_ID
        );
        const [lpMintPDA] = await PublicKey.findProgramAddress(
          [LP_MINT_SEED, poolPDA.toBuffer()],
          PROGRAM_ID
        );

        // Anchor discriminator: sha256("global:initialize_pool")[0..8]
        const discriminator = Buffer.from([95, 180, 10, 172, 84, 174, 232, 40]);

        // initialize_pool takes no arguments — only the discriminator
        const data = Buffer.from(discriminator);

        const keys = [
          // authority — signer & payer
          { pubkey: publicKey,               isSigner: true,  isWritable: true  },
          // token_a_mint
          { pubkey: mintAPubkey,             isSigner: false, isWritable: false },
          // token_b_mint
          { pubkey: mintBPubkey,             isSigner: false, isWritable: false },
          // pool state PDA
          { pubkey: poolPDA,                 isSigner: false, isWritable: true  },
          // vault_a PDA
          { pubkey: vaultAPDA,               isSigner: false, isWritable: true  },
          // vault_b PDA
          { pubkey: vaultBPDA,               isSigner: false, isWritable: true  },
          // lp_mint PDA
          { pubkey: lpMintPDA,               isSigner: false, isWritable: true  },
          // programs
          { pubkey: TOKEN_PROGRAM_ID,        isSigner: false, isWritable: false },
          { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: SYSVAR_RENT_PUBKEY,      isSigner: false, isWritable: false },
        ];

        const ix = new TransactionInstruction({
          keys,
          programId: PROGRAM_ID,
          data,
        });

        const tx = new Transaction();
        tx.add(ix);

        const { blockhash } = await connection.getLatestBlockhash("confirmed");
        tx.recentBlockhash = blockhash;
        tx.feePayer = publicKey;

        setStatus("signing");
        const sig = await sendTransaction(tx, connection);

        setStatus("confirming");
        await connection.confirmTransaction(sig, "confirmed");

        setTxSignature(sig);
        setStatus("success");
        return sig;
      } catch (err: unknown) {
        console.error("Initialize pool error:", err);
        const message =
          err instanceof Error ? err.message : "Failed to initialize pool";
        setError(message);
        setStatus("error");
        return null;
      }
    },
    [connection, publicKey, sendTransaction]
  );

  return { initializePool, status, txSignature, error, reset };
}
