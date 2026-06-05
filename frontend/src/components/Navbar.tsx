"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClientWalletButton } from "@/components/ClientWalletButton";
import { NETWORK } from "@/lib/constants";
import styles from "./Navbar.module.css";

const NAV_LINKS = [
  {
    href: "/swap",
    label: "Swap",
    icon: (
      <svg width="15" height="15" fill="none" viewBox="0 0 15 15">
        <path d="M3 5h9M3 5L5.5 2.5M3 5L5.5 7.5M12 10H3M12 10L9.5 7.5M12 10L9.5 12.5"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: "/pools",
    label: "Pools",
    icon: (
      <svg width="15" height="15" fill="none" viewBox="0 0 15 15">
        <path d="M7.5 2C7.5 2 3 4.5 3 7.5C3 10 5 12 7.5 12C10 12 12 10 12 7.5C12 4.5 7.5 2 7.5 2Z"
          stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    href: "/portfolio",
    label: "Portfolio",
    icon: (
      <svg width="15" height="15" fill="none" viewBox="0 0 15 15">
        <rect x="2" y="5" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M5 5V4C5 3 6 2 7.5 2C9 2 10 3 10 4V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" stroke="url(#ng1)" strokeWidth="1.5"/>
              <path d="M5.5 10C5.5 7.515 7.515 5.5 10 5.5C12.485 5.5 14.5 7.515 14.5 10"
                stroke="url(#ng2)" strokeWidth="2" strokeLinecap="round"/>
              <path d="M14.5 10C14.5 12.485 12.485 14.5 10 14.5C7.515 14.5 5.5 12.485 5.5 10"
                stroke="url(#ng3)" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="10" cy="10" r="2.5" fill="url(#ng4)"/>
              <defs>
                <linearGradient id="ng1" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#3b82f6"/><stop offset="1" stopColor="#06b6d4"/>
                </linearGradient>
                <linearGradient id="ng2" x1="5.5" y1="5.5" x2="14.5" y2="10" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#60a5fa"/><stop offset="1" stopColor="#22d3ee"/>
                </linearGradient>
                <linearGradient id="ng3" x1="14.5" y1="10" x2="5.5" y2="14.5" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#8b5cf6"/><stop offset="1" stopColor="#3b82f6"/>
                </linearGradient>
                <linearGradient id="ng4" x1="7.5" y1="7.5" x2="12.5" y2="12.5" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#60a5fa"/><stop offset="1" stopColor="#22d3ee"/>
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
          {NAV_LINKS.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.navLink} ${
                pathname === href || pathname?.startsWith(href + "/")
                  ? styles.navLinkActive
                  : ""
              }`}
            >
              {icon}
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
