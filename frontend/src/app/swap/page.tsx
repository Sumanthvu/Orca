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
            <h3 className={styles.infoTitle}>How swaps work</h3>
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
                <p>Approve in your wallet — transaction confirms in ~400ms.</p>
              </div>
            </div>
          </div>

          <div className={`glass-card ${styles.infoCard}`}>
            <h3 className={styles.infoTitle}>Formula</h3>
            <div className={styles.formula}>
              <span className="gradient-text" style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                x · y = k
              </span>
              <p className={styles.formulaDesc}>
                After your trade, the product of the two reserves stays constant.
                Larger trades relative to the pool size incur more slippage.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
