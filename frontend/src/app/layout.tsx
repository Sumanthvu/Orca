import type { Metadata } from "next";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "./globals.css";
import { WalletProvider } from "@/providers/WalletProvider";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Orca AMM — Solana Constant-Product DEX",
  description:
    "Trade, swap, and provide liquidity on Orca — a high-performance Constant-Product Automated Market Maker built on Solana.",
  keywords: ["Solana", "AMM", "DeFi", "DEX", "swap", "liquidity"],
  openGraph: {
    title: "Orca AMM",
    description: "Solana Constant-Product Automated Market Maker",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <div className="app-wrapper">
            <Navbar />
            <main className="main-content">{children}</main>
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
