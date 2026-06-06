"use client";

import { useState, useCallback, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PROGRAM_ID, getSolscanUrl } from "@/lib/constants";

export type TxType = "swap" | "add_liquidity" | "remove_liquidity" | "initialize_pool" | "unknown";

export interface HistoryItem {
  signature: string;
  type: TxType;
  timestamp: number | null; // unix seconds
  status: "success" | "failed";
  solscanUrl: string;
  slot: number;
}

// Anchor discriminators (first 8 bytes of sha256("global:<ix_name>"))
const DISCRIMINATORS: Record<string, TxType> = {
  "f8c69e91e1758788": "swap",              // [248,198,158,145,225,117,135,200]
  "b59d59438fb63448": "add_liquidity",     // [181,157,89,67,143,182,52,72]
  "5055d14818ceb16c": "remove_liquidity",  // [80,85,209,72,24,206,177,108]
  "5fb40aac54aee828": "initialize_pool",   // [95,180,10,172,84,174,232,40]
};

function bufToHex(buf: Uint8Array): string {
  return Array.from(buf.slice(0, 8))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function classifyInstruction(dataBase64: string | null | undefined): TxType {
  if (!dataBase64) return "unknown";
  try {
    const buf = Buffer.from(dataBase64, "base64");
    if (buf.length < 8) return "unknown";
    const hex = bufToHex(buf);
    return DISCRIMINATORS[hex] ?? "unknown";
  } catch {
    return "unknown";
  }
}

export interface UseTransactionHistoryReturn {
  history: HistoryItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTransactionHistory(): UseTransactionHistoryReturn {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!publicKey) {
      setHistory([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get the last 50 signatures for this wallet
      const sigs = await connection.getSignaturesForAddress(publicKey, {
        limit: 50,
      });

      if (sigs.length === 0) {
        setHistory([]);
        setLoading(false);
        return;
      }

      // Fetch full parsed transactions in batches of 10 to avoid rate limits
      const items: HistoryItem[] = [];

      const BATCH = 10;
      for (let i = 0; i < sigs.length; i += BATCH) {
        const batch = sigs.slice(i, i + BATCH);
        const txs = await Promise.allSettled(
          batch.map((s) =>
            connection.getParsedTransaction(s.signature, {
              maxSupportedTransactionVersion: 0,
            })
          )
        );

        txs.forEach((result, idx) => {
          const sigInfo = batch[idx];
          const sig = sigInfo.signature;
          const slot = sigInfo.slot;
          const timestamp = sigInfo.blockTime ?? null;
          const status = sigInfo.err ? "failed" : "success";

          let type: TxType = "unknown";

          if (result.status === "fulfilled" && result.value) {
            const tx = result.value;
            const ixs = tx.transaction.message.instructions;

            // Look for an instruction targeting our program
            for (const ix of ixs) {
              if (
                "programId" in ix &&
                ix.programId.toString() === PROGRAM_ID.toString()
              ) {
                const data = "data" in ix ? (ix.data as string) : null;
                type = classifyInstruction(data);
                if (type !== "unknown") break;
              }

              // Also check inner instructions
              if (tx.meta?.innerInstructions) {
                for (const inner of tx.meta.innerInstructions) {
                  for (const innerIx of inner.instructions) {
                    if (
                      "programId" in innerIx &&
                      innerIx.programId.toString() === PROGRAM_ID.toString()
                    ) {
                      const data = "data" in innerIx ? (innerIx.data as string) : null;
                      type = classifyInstruction(data);
                      if (type !== "unknown") break;
                    }
                  }
                  if (type !== "unknown") break;
                }
              }
            }
          }

          // Only include transactions involving our program OR show all
          // We include all but mark unknown ones — filter at render time
          items.push({
            signature: sig,
            type,
            timestamp,
            status,
            solscanUrl: getSolscanUrl(sig),
            slot,
          });
        });
      }

      // Filter to only show Orca AMM interactions
      const orcaTxs = items.filter((item) => item.type !== "unknown");
      setHistory(orcaTxs);
    } catch (err) {
      console.error("History fetch error:", err);
      setError("Failed to fetch transaction history. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [connection, publicKey]);

  // Auto-fetch when wallet connects
  useEffect(() => {
    if (publicKey) { refetch(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey]);

  return { history, loading, error, refetch };
}
