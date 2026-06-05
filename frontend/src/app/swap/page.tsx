import type { Metadata } from "next";
import { SwapCard } from "@/components/swap/SwapCard";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Swap | Orca AMM",
  description: "Swap tokens instantly on Solana using the Orca Constant-Product AMM.",
};

export default function SwapPage() {
  return (
    <div className={styles.page}>
      <div className={`container ${styles.layout}`}>
        {/* Left column — Swap interface */}
        <div className={styles.swapCol}>
          <div className={styles.swapHeader}>
            <h1 className={styles.pageTitle}>
              Trade <span className="gradient-text">Instantly</span>
            </h1>
            <p className={styles.pageSubtitle}>
              Constant-product AMM · 0.3% LP fee · Slippage protected
            </p>
          </div>
          <SwapCard />
        </div>

        {/* Right column — Info panel */}
        <div className={styles.infoCol}>
          <div className={`glass-card ${styles.infoCard}`}>
            <div className={styles.infoCardHeader}>
              <div className={styles.infoCardIcon}>
                <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                  <path d="M3 6h10M3 6L5.5 3.5M3 6L5.5 8.5M13 10H3M13 10L10.5 7.5M13 10L10.5 12.5"
                    stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className={styles.infoTitle}>How Swaps Work</h3>
            </div>
            <div className={styles.infoSteps}>
              <div className={styles.infoStep}>
                <div className={styles.infoStepDot} />
                <p>Select your input and output tokens from the list.</p>
              </div>
              <div className={styles.infoStep}>
                <div className={styles.infoStepDot} />
                <p>Enter an amount — the AMM instantly calculates your output using x·y=k.</p>
              </div>
              <div className={styles.infoStep}>
                <div className={styles.infoStepDot} />
                <p>Review price impact and minimum received, then click Swap.</p>
              </div>
              <div className={styles.infoStep}>
                <div className={styles.infoStepDot} />
                <p>Approve in Phantom — transaction confirms in ~400ms on Solana.</p>
              </div>
            </div>
          </div>

          <div className={`glass-card ${styles.infoCard}`}>
            <div className={styles.infoCardHeader}>
              <div className={styles.infoCardIcon}>
                <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="6" stroke="#60a5fa" strokeWidth="1.5"/>
                  <path d="M8 5v3l2 2" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className={styles.infoTitle}>The Formula</h3>
            </div>
            <div className={styles.formula}>
              <div className={styles.formulaCode}>x · y = k</div>
              <p className={styles.formulaDesc}>
                After your trade, the product of the two reserves stays constant.
                Larger trades relative to pool size incur more price impact.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
