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

import { utils } from "@coral-xyz/anchor";

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

function classifyInstruction(dataBase58: string | null | undefined): TxType {
  if (!dataBase58) return "unknown";
  try {
    const buf = utils.bytes.bs58.decode(dataBase58);
    if (buf.length < 8) return "unknown";
    const hex = bufToHex(buf);
    return DISCRIMINATORS[hex] ?? "unknown";
  } catch (err) {
    console.error("classifyInstruction error:", err);
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
      // Fetch only 20 recent signatures to avoid rate-limiting the public RPC
      const sigs = await connection.getSignaturesForAddress(publicKey, {
        limit: 20,
      });

      if (sigs.length === 0) {
        setHistory([]);
        setLoading(false);
        return;
      }

      // Helper: sleep between batches to respect rate limits
      const sleep = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      // Fetch parsed transactions ONE at a time with a 400ms gap to avoid 429s
      const items: HistoryItem[] = [];

      for (let i = 0; i < sigs.length; i++) {
        const sigInfo = sigs[i];

        // Pause between every request
        if (i > 0) await sleep(400);

        let type: TxType = "unknown";

        try {
          const tx = await connection.getParsedTransaction(sigInfo.signature, {
            maxSupportedTransactionVersion: 0,
          });

          if (tx) {
            const ixs = tx.transaction.message.instructions;

            for (const ix of ixs) {
              if (
                "programId" in ix &&
                ix.programId.toString() === PROGRAM_ID.toString()
              ) {
                const data = "data" in ix ? (ix.data as string) : null;
                type = classifyInstruction(data);
                if (type !== "unknown") break;
              }
            }

            // Also scan inner instructions if still unknown
            if (type === "unknown" && tx.meta?.innerInstructions) {
              outer: for (const inner of tx.meta.innerInstructions) {
                for (const innerIx of inner.instructions) {
                  if (
                    "programId" in innerIx &&
                    innerIx.programId.toString() === PROGRAM_ID.toString()
                  ) {
                    const data =
                      "data" in innerIx ? (innerIx.data as string) : null;
                    type = classifyInstruction(data);
                    if (type !== "unknown") break outer;
                  }
                }
              }
            }
          }
        } catch {
          // If a single tx fetch fails, skip it silently
        }

        // Only keep Orca AMM transactions
        if (type !== "unknown") {
          items.push({
            signature: sigInfo.signature,
            type,
            timestamp: sigInfo.blockTime ?? null,
            status: sigInfo.err ? "failed" : "success",
            solscanUrl: getSolscanUrl(sigInfo.signature),
            slot: sigInfo.slot,
          });
        }
      }

      setHistory(items);
    } catch (err) {
      console.error("History fetch error:", err);
      setError(
        "Failed to fetch transaction history. The RPC endpoint may be busy — please try again in a few seconds."
      );
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
