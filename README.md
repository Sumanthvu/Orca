# Orca — Decentralized AMM on Solana

**Orca** is a decentralized token exchange built on Solana using the Constant-Product Automated Market Maker (AMM) model. It enables users to swap tokens and provide liquidity through on-chain smart contracts, without relying on a centralized intermediary.

Built with **Rust, Anchor, Solana, React, and TypeScript**, Orca demonstrates the core mechanics of decentralized finance (DeFi), including liquidity pools, token swaps, LP tokens, and slippage protection.

<p align="center">
  <strong>Decentralized Trading · On-Chain Liquidity · Solana</strong>
</p>

---

## Overview

Traditional exchanges use order books to match buyers and sellers. Automated Market Makers (AMMs) replace this model with liquidity pools and mathematical pricing algorithms.

Orca uses the **Constant-Product Formula**:

\[
x * y = k
\]

Where:

- **x** represents the reserve of Token A.
- **y** represents the reserve of Token B.
- **k** represents the constant product of the pool reserves.

When a user swaps tokens, the pool's reserves change, automatically adjusting the exchange rate. This mechanism enables permissionless trading based on available liquidity and demand.

## Key Features

- **Token Swapping:** Exchange tokens using the constant-product pricing mechanism.
- **Liquidity Pools:** Maintain token reserves that facilitate decentralized trading.
- **Liquidity Provision:** Allow users to deposit token pairs and participate in pool liquidity.
- **LP Token Accounting:** Represent liquidity providers' proportional ownership of a pool.
- **Slippage Protection:** Enforce minimum-output constraints to prevent unfavorable trade execution.
- **PDA-Based Vaults:** Securely manage token reserves using Program Derived Addresses.
- **On-Chain Execution:** Execute trading and liquidity operations through Solana programs.
- **Wallet Integration:** Connect a Solana wallet to authorize blockchain transactions.
- **Transaction Transparency:** Make operations verifiable through Solana's public blockchain.

## Tech Stack

| Component | Technologies |
|---|---|
| Smart Contracts | Rust, Anchor |
| Blockchain | Solana |
| Token Operations | SPL Token Program |
| Frontend | React, Next.js, TypeScript |
| Blockchain Client | `@solana/web3.js` |
| Program Integration | `@coral-xyz/anchor` |
| Wallet Connectivity | Solana Wallet Adapter |
| Testing | Anchor Tests, TypeScript |

## Architecture

Orca separates the frontend application from the on-chain program, enabling a clear distinction between user interactions and blockchain execution.

```text
                  User
                   |
                   v
          React / Next.js UI
                   |
                   v
           Solana Wallet
                   |
             Signed Transaction
                   |
                   v
          Anchor Smart Contract
                   |
          +--------+--------+
          |                 |
          v                 v
      Pool State        PDA Vaults
                            |
                            v
                    SPL Token Program
                            |
                            v
                     Token Transfers
```

### On-Chain Program

The Rust-based Anchor program handles pool state, validates accounts and instructions, performs AMM calculations, and coordinates token operations through cross-program invocations (CPIs).

### Program Derived Addresses (PDAs)

PDAs provide deterministic addresses for program-controlled accounts and token vault authorities. They enable the program to manage liquidity reserves without relying on a conventional private key for each vault authority.

### Frontend Application

The frontend provides the user interface for wallet connectivity, token selection, swap calculations, liquidity interactions, and transaction feedback.

## Core AMM Mechanics

### 1. Pool Initialization

A liquidity pool represents a trading pair, such as Token A and Token B. The program maintains the pool's state and the associated token vaults.

### 2. Token Swapping

Users supply one token and receive another based on the pool's current reserves. The program calculates the output amount using the constant-product model and applies the configured fee logic.

### 3. Liquidity Provision

Liquidity providers deposit tokens into a pool to support trading. Their proportional share is tracked through liquidity accounting and LP tokens.

### 4. Slippage Protection

Slippage protection ensures that a transaction executes only when the received token amount satisfies the user's specified minimum-output requirement.

### 5. Liquidity Withdrawal

Liquidity providers can redeem their LP tokens to withdraw their proportional share of the underlying pool assets, subject to the program's liquidity accounting rules.

## Project Structure

The repository separates the frontend application from the Solana program.

```text
Orca/
├── frontend/       # User interface and blockchain client
└── program/        # Solana on-chain program
```

## Getting Started

### Prerequisites

Install the following tools:

- [Node.js and npm](https://nodejs.org/)
- [Rust](https://www.rust-lang.org/tools/install)
- [Solana CLI](https://solana.com/docs/intro/installation)
- [Anchor Framework](https://www.anchor-lang.com/docs/installation)
- A compatible Solana wallet, such as [Phantom](https://phantom.app/)

### Installation

Clone the repository:

```bash
git clone https://github.com/Sumanthvu/Orca.git
cd Orca
```

### Frontend Setup

Navigate to the frontend directory and install the dependencies:

```bash
cd frontend
npm install
```

Start the development server using the script configured in `frontend/package.json`. For a project configured with the standard Next.js development script:

```bash
npm run dev
```

Open the local URL displayed in your terminal.

### Solana Program Setup

Open a separate terminal from the repository root:

```bash
cd Orca/program
anchor build
anchor test
```

These commands build and test the Anchor program, provided the required Anchor workspace configuration and test setup are present.

**Network configuration:** Configure the appropriate Solana cluster, program ID, wallet, and RPC endpoint before interacting with a deployed program. Use Devnet for testing.

## Security Considerations

Security is essential when building applications that handle digital assets. Orca's smart contract logic should be evaluated for:

- Account ownership, signer, and PDA validation.
- Token mint and vault consistency.
- Arithmetic precision, rounding, and token decimal handling.
- Minimum-output and slippage enforcement.
- Liquidity accounting and LP token supply consistency.
- Invalid amounts, empty pools, and insufficient balances.
- Correct authorization for token transfers and withdrawals.


## Learning Outcomes

Building Orca provides practical experience with:

- Solana's account-based execution model.
- Rust and the Anchor smart contract framework.
- PDA derivation and cross-program invocations.
- SPL token transfers and liquidity accounting.
- Constant-product AMM mathematics.
- DeFi transaction flows and slippage protection.
- Blockchain frontend integration and wallet signing.

## Future Scope

- Multi-pool analytics and liquidity dashboards.
- Enhanced swap quotations and price-impact calculations.
- Historical transaction and trading-volume analytics.
- Expanded integration and security testing.
- Additional liquidity-management capabilities.


<p align="center">
  Built with Rust, Anchor, and Solana.
</p>
