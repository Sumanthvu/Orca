"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { DEVNET_TOKENS, type TokenInfo } from "@/lib/constants";
import styles from "./TokenSelector.module.css";

interface TokenSelectorProps {
  selected: TokenInfo | null;
  onChange: (token: TokenInfo) => void;
  disabledMint?: string;
  label: string;
}

export function TokenSelector({
  selected,
  onChange,
  disabledMint,
  label,
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      DEVNET_TOKENS.filter(
        (t) =>
          t.mint !== disabledMint &&
          (t.symbol.toLowerCase().includes(search.toLowerCase()) ||
            t.name.toLowerCase().includes(search.toLowerCase()))
      ),
    [search, disabledMint]
  );

  const handleSelect = (token: TokenInfo) => {
    onChange(token);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className={styles.wrapper}>
      <button
        id={`token-selector-${label.replace(/\s+/g, "-").toLowerCase()}`}
        className={styles.trigger}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        {selected ? (
          <>
            <div className={styles.tokenLogo}>
              <Image
                src={selected.logoURI}
                alt={selected.symbol}
                width={24}
                height={24}
                className="token-logo"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            <span className={styles.tokenSymbol}>{selected.symbol}</span>
          </>
        ) : (
          <span className={styles.placeholder}>Select token</span>
        )}
        <svg
          className={styles.chevron}
          width="16"
          height="16"
          fill="none"
          viewBox="0 0 16 16"
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className={styles.backdrop}
            onClick={() => setIsOpen(false)}
          />
          <div className={`glass-card-elevated ${styles.dropdown}`}>
            <div className={styles.dropdownHeader}>
              <h3 className={styles.dropdownTitle}>Select Token</h3>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 18 18">
                  <path
                    d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <input
              id="token-search"
              className={`input ${styles.searchInput}`}
              placeholder="Search by name or symbol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />

            <div className={styles.tokenList}>
              {filtered.length === 0 ? (
                <p className={styles.noResults}>No tokens found</p>
              ) : (
                filtered.map((token) => (
                  <button
                    key={token.mint}
                    className={`${styles.tokenItem} ${
                      selected?.mint === token.mint ? styles.tokenItemSelected : ""
                    }`}
                    onClick={() => handleSelect(token)}
                    type="button"
                  >
                    <div className={styles.tokenLogo}>
                      <Image
                        src={token.logoURI}
                        alt={token.symbol}
                        width={32}
                        height={32}
                        className="token-logo"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                    <div className={styles.tokenInfo}>
                      <span className={styles.tokenSymbolLg}>{token.symbol}</span>
                      <span className={styles.tokenName}>{token.name}</span>
                    </div>
                    {selected?.mint === token.mint && (
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        viewBox="0 0 16 16"
                        style={{ marginLeft: "auto", color: "var(--color-primary)" }}
                      >
                        <path
                          d="M3 8L7 12L13 4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
