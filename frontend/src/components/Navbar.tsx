"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClientWalletButton } from "@/components/ClientWalletButton";
import { NETWORK } from "@/lib/constants";
import styles from "./Navbar.module.css";

const NAV_LINKS = [
  { href: "/swap", label: "Swap" },
  { href: "/pools", label: "Pools" },
  { href: "/portfolio", label: "Portfolio" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="13" stroke="url(#g1)" strokeWidth="2"/>
              <path d="M8 14C8 10.686 10.686 8 14 8C17.314 8 20 10.686 20 14" stroke="url(#g2)" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M20 14C20 17.314 17.314 20 14 20C10.686 20 8 17.314 8 14" stroke="url(#g3)" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="14" cy="14" r="3" fill="url(#g4)"/>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00d4ff"/>
                  <stop offset="1" stopColor="#7c3aed"/>
                </linearGradient>
                <linearGradient id="g2" x1="8" y1="8" x2="20" y2="14" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00d4ff"/>
                  <stop offset="1" stopColor="#06ffa5"/>
                </linearGradient>
                <linearGradient id="g3" x1="20" y1="14" x2="8" y2="20" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#7c3aed"/>
                  <stop offset="1" stopColor="#00d4ff"/>
                </linearGradient>
                <linearGradient id="g4" x1="11" y1="11" x2="17" y2="17" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00d4ff"/>
                  <stop offset="1" stopColor="#06ffa5"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className={styles.logoText}>Orca</span>
          <span className={`badge badge-devnet ${styles.networkBadge}`}>
            {NETWORK}
          </span>
        </Link>

        {/* Navigation Links */}
        <div className={styles.navLinks}>
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.navLink} ${
                pathname === href || pathname?.startsWith(href + "/")
                  ? styles.navLinkActive
                  : ""
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Wallet Button */}
        <div className={styles.walletWrapper}>
          <ClientWalletButton />
        </div>
      </div>
    </nav>
  );
}
