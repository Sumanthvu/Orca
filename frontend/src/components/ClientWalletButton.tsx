"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const WalletMultiButtonDynamic = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export function ClientWalletButton(props: any) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  
  if (!mounted) return <div style={{ height: "48px", width: "150px" }} />;
  return <WalletMultiButtonDynamic {...props} />;
}
