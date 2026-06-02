use anchor_lang::prelude::*;

/// Seeds for Pool State PDA: ["pool", token_a_mint, token_b_mint]
pub const POOL_SEED: &[u8] = b"pool";
/// Seeds for Vault A PDA: ["vault_a", pool_state]
pub const VAULT_A_SEED: &[u8] = b"vault_a";
/// Seeds for Vault B PDA: ["vault_b", pool_state]
pub const VAULT_B_SEED: &[u8] = b"vault_b";
/// Seeds for LP Mint PDA: ["lp_mint", pool_state]
pub const LP_MINT_SEED: &[u8] = b"lp_mint";

/// Minimum liquidity locked forever on first deposit (prevents price manipulation)
pub const MINIMUM_LIQUIDITY: u64 = 1_000;

/// Fee = 0.3% => numerator=3, denominator=1000
pub const FEE_NUMERATOR: u64 = 3;
pub const FEE_DENOMINATOR: u64 = 1_000;

/// The Pool account storing all state for a token pair.
/// PDA seeds: [POOL_SEED, token_a_mint, token_b_mint]
#[account]
#[derive(Default)]
pub struct Pool {
    /// The creator/initializer of this pool
    pub authority: Pubkey,

    /// Mint address of Token A
    pub token_a_mint: Pubkey,

    /// Mint address of Token B
    pub token_b_mint: Pubkey,

    /// PDA token account holding Token A reserves
    pub vault_a: Pubkey,

    /// PDA token account holding Token B reserves
    pub vault_b: Pubkey,

    /// LP token mint — minted to LPs, burned on withdrawal
    pub lp_mint: Pubkey,

    /// Fee numerator (e.g. 3 for 0.3%)
    pub fee_numerator: u64,

    /// Fee denominator (e.g. 1000 for 0.3%)
    pub fee_denominator: u64,

    /// Total LP tokens in circulation (tracked for precision)
    pub lp_supply: u64,

    /// Bump seed for the Pool PDA
    pub bump: u8,

    /// Bump for vault A
    pub vault_a_bump: u8,

    /// Bump for vault B
    pub vault_b_bump: u8,

    /// Bump for LP mint
    pub lp_mint_bump: u8,
}

impl Pool {
    /// Account discriminator (8) + all fields
    pub const LEN: usize = 8
        + 32  // authority
        + 32  // token_a_mint
        + 32  // token_b_mint
        + 32  // vault_a
        + 32  // vault_b
        + 32  // lp_mint
        + 8   // fee_numerator
        + 8   // fee_denominator
        + 8   // lp_supply
        + 1   // bump
        + 1   // vault_a_bump
        + 1   // vault_b_bump
        + 1;  // lp_mint_bump
}
