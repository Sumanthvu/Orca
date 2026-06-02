import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ||
    "6gzsk7VbTk7oa2tmGqcaAwpbSxg9jbs7AvDKoG6KkXPQ"
);

export const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";

export const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";

// AMM Constants matching the on-chain program
export const FEE_NUMERATOR = 3n;
export const FEE_DENOMINATOR = 1000n;
export const MINIMUM_LIQUIDITY = 1000n;

// PDA Seeds (must match on-chain seeds exactly)
export const POOL_SEED = Buffer.from("pool");
export const VAULT_A_SEED = Buffer.from("vault_a");
export const VAULT_B_SEED = Buffer.from("vault_b");
export const LP_MINT_SEED = Buffer.from("lp_mint");

// Well-known devnet token mints for the UI demo
export const DEVNET_TOKENS = [
  {
    symbol: "USDC",
    name: "USD Coin",
    mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    decimals: 6,
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  },
  {
    symbol: "SOL",
    name: "Wrapped SOL",
    mint: "So11111111111111111111111111111111111111112",
    decimals: 9,
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
  },
  {
    symbol: "BONK",
    name: "Bonk",
    mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    decimals: 5,
    logoURI: "https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q89Kp3aoM5Fk",
  },
];

export type TokenInfo = (typeof DEVNET_TOKENS)[number];

// Solscan explorer URL builder
export const getSolscanUrl = (signature: string) =>
  `https://solscan.io/tx/${signature}?cluster=devnet`;

export const getExplorerUrl = (address: string, type: "tx" | "account" = "account") =>
  `https://explorer.solana.com/${type}/${address}?cluster=devnet`;
