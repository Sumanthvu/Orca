import Link from "next/link";
import styles from "./page.module.css";

const STATS = [
  { label: "Total Value Locked", value: "$12.4M", change: "+2.3%" },
  { label: "24h Volume", value: "$3.1M", change: "+8.7%" },
  { label: "Active Pools", value: "24", change: "+3" },
  { label: "Total Swaps", value: "142K", change: "+1.2K" },
];

const FEATURES = [
  {
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 28 28">
        <path d="M14 3L25 9.5V18.5L14 25L3 18.5V9.5L14 3Z" stroke="#00d4ff" strokeWidth="1.5"/>
        <path d="M8 14H20M14 8V20" stroke="#06ffa5" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Constant-Product Formula",
    desc: "Battle-tested x·y=k algorithm powers every swap. Price adjusts automatically based on supply and demand — no order books needed.",
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 28 28">
        <rect x="3" y="8" width="22" height="14" rx="4" stroke="#7c3aed" strokeWidth="1.5"/>
        <path d="M8 8V6C8 4.343 9.343 3 11 3H17C18.657 3 20 4.343 20 6V8" stroke="#a78bfa" strokeWidth="1.5"/>
        <circle cx="14" cy="15" r="3" stroke="#00d4ff" strokeWidth="1.5"/>
      </svg>
    ),
    title: "Non-Custodial Vaults",
    desc: "Your tokens are held in Program Derived Address vaults. Only the smart contract can move them — no admin keys, no rugs.",
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 28 28">
        <path d="M5 14L11 20L23 8" stroke="#06ffa5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="14" cy="14" r="11" stroke="#00d4ff" strokeWidth="1.5" strokeDasharray="4 2"/>
      </svg>
    ),
    title: "Slippage Protection",
    desc: "Set your slippage tolerance and the on-chain program enforces it. Transactions revert automatically if the price moves against you.",
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 28 28">
        <path d="M14 3V25M3 14H25" stroke="#00d4ff" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M7 7L21 21M21 7L7 21" stroke="#7c3aed" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
        <circle cx="14" cy="14" r="4" fill="rgba(0,212,255,0.1)" stroke="#06ffa5" strokeWidth="1.5"/>
      </svg>
    ),
    title: "Earn LP Fees",
    desc: "Deposit token pairs and earn 0.3% on every swap proportional to your share. LP tokens represent your position and can be redeemed anytime.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Connect Your Wallet",
    desc: "Click 'Connect Wallet' and approve via Phantom, Solflare, or any Solana-compatible wallet.",
  },
  {
    step: "02",
    title: "Choose Your Tokens",
    desc: "Select the token pair you want to swap. The AMM instantly calculates your output using live pool reserves.",
  },
  {
    step: "03",
    title: "Swap or Provide Liquidity",
    desc: "Execute swaps in milliseconds or deposit both tokens to earn trading fees as a Liquidity Provider.",
  },
];

export default function HomePage() {
  return (
    <div className={styles.page}>
      {/* === HERO SECTION === */}
      <section className={styles.hero}>
        {/* Background orbs */}
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />

        <div className={`container ${styles.heroContent}`}>
          <div className={`badge badge-devnet ${styles.heroBadge}`}>
            <span className={styles.liveDot} />
            Live on Solana Devnet
          </div>

          <h1 className={styles.heroTitle}>
            Swap Instantly.
            <br />
            <span className="gradient-text">Earn Automatically.</span>
          </h1>

          <p className={styles.heroSubtitle}>
            Orca is a Constant-Product AMM on Solana. Trade tokens at the best
            on-chain price, or deposit liquidity to earn 0.3% on every swap.
          </p>

          <div className={styles.heroCTA}>
            <Link href="/swap" className="btn btn-primary btn-lg">
              Start Trading
              <svg width="18" height="18" fill="none" viewBox="0 0 18 18">
                <path d="M3.75 9H14.25M14.25 9L9.75 4.5M14.25 9L9.75 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <Link href="/pools" className="btn btn-secondary btn-lg">
              Add Liquidity
            </Link>
          </div>

          {/* Floating swap preview card */}
          <div className={`glass-card-elevated ${styles.previewCard} animate-fade-in`}>
            <div className={styles.previewRow}>
              <span className={styles.previewLabel}>You pay</span>
              <div className={styles.previewToken}>
                <span className={styles.previewAmount}>100</span>
                <span className={styles.previewSymbol}>USDC</span>
              </div>
            </div>
            <div className={styles.previewArrow}>
              <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                <path d="M10 3V17M10 17L5 12M10 17L15 12" stroke="#00d4ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className={styles.previewRow}>
              <span className={styles.previewLabel}>You receive</span>
              <div className={styles.previewToken}>
                <span className={`${styles.previewAmount} gradient-text`}>~0.651</span>
                <span className={styles.previewSymbol}>SOL</span>
              </div>
            </div>
            <div className={styles.previewMeta}>
              <span>Price Impact: <strong>0.12%</strong></span>
              <span>Fee: <strong>0.3%</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* === STATS BAR === */}
      <section className={styles.statsSection}>
        <div className={`container ${styles.statsGrid}`}>
          {STATS.map((stat) => (
            <div key={stat.label} className={`glass-card ${styles.statCard}`}>
              <span className="stat-label">{stat.label}</span>
              <div className={styles.statValueRow}>
                <span className="stat-value">{stat.value}</span>
                <span className={`badge badge-success`}>{stat.change}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* === FEATURES GRID === */}
      <section className={styles.featuresSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              Built for <span className="gradient-text">DeFi Power Users</span>
            </h2>
            <p className={styles.sectionSubtitle}>
              Everything you need to trade and earn on Solana, with zero compromises on security.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            {FEATURES.map((feature) => (
              <div key={feature.title} className={`glass-card ${styles.featureCard}`}>
                <div className={styles.featureIcon}>{feature.icon}</div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDesc}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === HOW IT WORKS === */}
      <section className={styles.howSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              How It <span className="gradient-text-accent">Works</span>
            </h2>
          </div>

          <div className={styles.stepsGrid}>
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className={styles.stepCard}>
                <div className={styles.stepNumber}>{step.step}</div>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className={styles.stepConnector} />
                )}
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === CTA BANNER === */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={`glass-card-elevated ${styles.ctaBanner}`}>
            <div className={styles.ctaOrb} />
            <h2 className={styles.ctaTitle}>
              Ready to start trading on <span className="gradient-text">Solana</span>?
            </h2>
            <p className={styles.ctaSubtitle}>
              Connect your wallet and make your first swap in under 30 seconds.
            </p>
            <Link href="/swap" className="btn btn-primary btn-lg">
              Launch App
              <svg width="18" height="18" fill="none" viewBox="0 0 18 18">
                <path d="M3.75 9H14.25M14.25 9L9.75 4.5M14.25 9L9.75 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
