"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClientWalletButton } from "@/components/ClientWalletButton";
import { NETWORK } from "@/lib/constants";
import styles from "./Navbar.module.css";

const NAV_LINKS = [
  { href: "/swap",      label: "Swap"      },
  { href: "/pools",     label: "Pools"     },
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
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="8" stroke="url(#nl1)" strokeWidth="1.5"/>
              <path d="M4.5 9C4.5 6.515 6.515 4.5 9 4.5C11.485 4.5 13.5 6.515 13.5 9"
                stroke="url(#nl2)" strokeWidth="1.75" strokeLinecap="round"/>
              <path d="M13.5 9C13.5 11.485 11.485 13.5 9 13.5C6.515 13.5 4.5 11.485 4.5 9"
                stroke="url(#nl3)" strokeWidth="1.75" strokeLinecap="round"/>
              <circle cx="9" cy="9" r="2" fill="url(#nl4)"/>
              <defs>
                <linearGradient id="nl1" x1="0" y1="0" x2="18" y2="18" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#4f8ef7"/><stop offset="1" stopColor="#22d3ee"/>
                </linearGradient>
                <linearGradient id="nl2" x1="4.5" y1="4.5" x2="13.5" y2="9" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#7aabf8"/><stop offset="1" stopColor="#22d3ee"/>
                </linearGradient>
                <linearGradient id="nl3" x1="13.5" y1="9" x2="4.5" y2="13.5" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#a08bde"/><stop offset="1" stopColor="#4f8ef7"/>
                </linearGradient>
                <linearGradient id="nl4" x1="7" y1="7" x2="11" y2="11" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#7aabf8"/><stop offset="1" stopColor="#22d3ee"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className={styles.logoText}>Orca</span>
          <span className={`badge badge-devnet ${styles.networkBadge}`}>{NETWORK}</span>
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
