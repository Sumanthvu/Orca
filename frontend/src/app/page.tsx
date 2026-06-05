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
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
        <path d="M12 2L22 8.5V15.5L12 22L2 15.5V8.5L12 2Z" stroke="#60a5fa" strokeWidth="1.5"/>
        <path d="M7 12H17M12 7V17" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Constant-Product Formula",
    desc: "Battle-tested x·y=k algorithm powers every swap. Price adjusts automatically based on supply and demand — no order books.",
  },
  {
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="8" width="18" height="13" rx="2" stroke="#8b5cf6" strokeWidth="1.5"/>
        <path d="M7 8V6C7 4.343 8.343 3 10 3H14C15.657 3 17 4.343 17 6V8" stroke="#a78bfa" strokeWidth="1.5"/>
        <circle cx="12" cy="14.5" r="2.5" stroke="#60a5fa" strokeWidth="1.5"/>
      </svg>
    ),
    title: "Non-Custodial Vaults",
    desc: "Your tokens are held in Program Derived Address vaults. Only the smart contract can move them — no admin keys, no rugs.",
  },
  {
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
        <path d="M4 12L10 18L20 6" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="10" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="4 3"/>
      </svg>
    ),
    title: "Slippage Protection",
    desc: "Set your tolerance and the on-chain program enforces it. Transactions revert automatically if price moves against you.",
  },
  {
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
        <path d="M12 2V22M2 12H22" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="12" cy="12" r="5" fill="rgba(59,130,246,0.1)" stroke="#34d399" strokeWidth="1.5"/>
      </svg>
    ),
    title: "Earn 0.3% LP Fees",
    desc: "Deposit token pairs and earn on every swap proportional to your share. LP tokens represent your position, redeemable anytime.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Connect Your Wallet",
    desc: "Click 'Connect Wallet' and approve via Phantom or any Solana-compatible wallet.",
  },
  {
    step: "02",
    title: "Choose Your Action",
    desc: "Swap tokens at the best on-chain rate, or deposit liquidity to earn trading fees.",
  },
  {
    step: "03",
    title: "Confirm & Profit",
    desc: "Approve the transaction in your wallet. Swaps settle in under 400ms on Solana.",
  },
];

export default function HomePage() {
  return (
    <div className={styles.page}>
      {/* === HERO === */}
      <section className={styles.hero}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />
        <div className={styles.orb4} />

        <div className={styles.heroInner}>
          {/* Left content */}
          <div className={`${styles.heroLeft} animate-slide-up`}>
            <div className={styles.heroBadge}>
              <span className={styles.liveDot} />
              Live on Solana Devnet
            </div>

            <h1 className={styles.heroTitle}>
              Swap Instantly.
              <br />
              <span className="gradient-text">Earn Automatically.</span>
            </h1>

            <p className={styles.heroSubtitle}>
              Orca is a Constant-Product AMM on Solana. Trade tokens at the
              best on-chain price, or deposit liquidity to earn 0.3% on every swap.
            </p>

            <div className={styles.heroCTA}>
              <Link href="/swap" className="btn btn-primary btn-lg">
                Start Trading
                <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                  <path d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5"
                    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <Link href="/pools" className="btn btn-secondary btn-lg">
                Provide Liquidity
              </Link>
            </div>

            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <span className={styles.heroStatValue}>400ms</span>
                <span className={styles.heroStatLabel}>Finality</span>
              </div>
              <div className={styles.heroStat}>
                <span className={styles.heroStatValue}>$0.001</span>
                <span className={styles.heroStatLabel}>Avg. Fee</span>
              </div>
              <div className={styles.heroStat}>
                <span className={styles.heroStatValue}>0.3%</span>
                <span className={styles.heroStatLabel}>LP Yield</span>
              </div>
            </div>
          </div>

          {/* Right — swap preview card */}
          <div className={styles.heroRight}>
            <div className={`glass-card-elevated ${styles.previewCard} animate-float`}>
              <div className={styles.previewHeader}>
                <span className={styles.previewHeaderTitle}>Live Preview</span>
                <span className={styles.previewFee}>
                  <svg width="10" height="10" fill="none" viewBox="0 0 10 10">
                    <circle cx="5" cy="5" r="4" stroke="#60a5fa" strokeWidth="1"/>
                  </svg>
                  0.3% fee
                </span>
              </div>

              <div className={styles.previewRow}>
                <div>
                  <div className={styles.previewLabel}>You pay</div>
                  <div className={styles.previewSymbol}>TKNA</div>
                </div>
                <div className={styles.previewTokenInfo}>
                  <span className={styles.previewAmount}>100</span>
                </div>
              </div>

              <div className={styles.previewArrow}>
                <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                  <path d="M8 2V14M8 14L4 10M8 14L12 10"
                    stroke="#60a5fa" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              <div className={styles.previewRow}>
                <div>
                  <div className={styles.previewLabel}>You receive</div>
                  <div className={styles.previewSymbol}>TKNB</div>
                </div>
                <div className={styles.previewTokenInfo}>
                  <span className={`${styles.previewAmount} gradient-text`}>~82.67</span>
                </div>
              </div>

              <div className={styles.previewMeta}>
                <span>Price Impact: <strong>0.12%</strong></span>
                <span>Slippage: <strong>0.5%</strong></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === STATS BAR === */}
      <section className={styles.statsSection}>
        <div className="container">
          <div className={styles.statsGrid}>
            {STATS.map((stat) => (
              <div key={stat.label} className={styles.statCard}>
                <span className="stat-label">{stat.label}</span>
                <div className={styles.statValueRow}>
                  <span className="stat-value">{stat.value}</span>
                  <span className="badge badge-success">{stat.change}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === FEATURES === */}
      <section className={styles.featuresSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              Built for <span className="gradient-text">DeFi Power Users</span>
            </h2>
            <p className={styles.sectionSubtitle}>
              Everything you need to trade and earn on Solana, with zero compromises on security or speed.
            </p>
          </div>
          <div className={styles.featuresGrid}>
            {FEATURES.map((feature) => (
              <div key={feature.title} className={`glass-card ${styles.featureCard}`}>
                <div className={styles.featureIconWrap}>{feature.icon}</div>
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
            <p className={styles.sectionSubtitle}>
              Three steps from zero to earning on-chain.
            </p>
          </div>
          <div className={styles.stepsGrid}>
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className={styles.stepCard}>
                <div className={styles.stepNumber}>{step.step}</div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === CTA === */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={`glass-card-elevated ${styles.ctaBanner}`}>
            <div className={styles.ctaOrb} />
            <h2 className={styles.ctaTitle}>
              Ready to trade on <span className="gradient-text">Solana</span>?
            </h2>
            <p className={styles.ctaSubtitle}>
              Connect your wallet and make your first swap in under 30 seconds.
            </p>
            <Link href="/swap" className="btn btn-primary btn-lg">
              Launch App
              <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                <path d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5"
                  stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
