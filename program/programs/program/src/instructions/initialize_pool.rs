use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

use crate::state::*;
use crate::errors::AmmError;

/// Initializes a new constant-product AMM pool for a given token pair.
///
/// Creates:
///   - Pool State PDA (stores pool metadata)
///   - Vault A PDA (holds Token A reserves)
///   - Vault B PDA (holds Token B reserves)
///   - LP Mint PDA (LP tokens minted to liquidity providers)
pub fn handle_initialize_pool(ctx: Context<InitializePool>) -> Result<()> {
    require!(
        ctx.accounts.token_a_mint.key() != ctx.accounts.token_b_mint.key(),
        AmmError::SameTokenMints
    );

    let pool = &mut ctx.accounts.pool;
    pool.authority = ctx.accounts.authority.key();
    pool.token_a_mint = ctx.accounts.token_a_mint.key();
    pool.token_b_mint = ctx.accounts.token_b_mint.key();
    pool.vault_a = ctx.accounts.vault_a.key();
    pool.vault_b = ctx.accounts.vault_b.key();
    pool.lp_mint = ctx.accounts.lp_mint.key();
    pool.fee_numerator = FEE_NUMERATOR;
    pool.fee_denominator = FEE_DENOMINATOR;
    pool.lp_supply = 0;
    pool.bump = ctx.bumps.pool;
    pool.vault_a_bump = ctx.bumps.vault_a;
    pool.vault_b_bump = ctx.bumps.vault_b;
    pool.lp_mint_bump = ctx.bumps.lp_mint;

    msg!(
        "Pool initialized: {} / {}",
        ctx.accounts.token_a_mint.key(),
        ctx.accounts.token_b_mint.key()
    );

    Ok(())
}

#[derive(Accounts)]
pub struct InitializePool<'info> {
    /// The account paying for pool creation (deployer / admin)
    #[account(mut)]
    pub authority: Signer<'info>,

    /// Token A mint — one side of the pair
    pub token_a_mint: Account<'info, Mint>,

    /// Token B mint — other side of the pair
    pub token_b_mint: Account<'info, Mint>,

    /// Pool State PDA — stores all pool metadata
    /// Seeds: [POOL_SEED, token_a_mint, token_b_mint]
    #[account(
        init,
        payer = authority,
        space = Pool::LEN,
        seeds = [POOL_SEED, token_a_mint.key().as_ref(), token_b_mint.key().as_ref()],
        bump
    )]
    pub pool: Account<'info, Pool>,

    /// Vault A — PDA token account that holds Token A reserves
    /// Seeds: [VAULT_A_SEED, pool]
    #[account(
        init,
        payer = authority,
        token::mint = token_a_mint,
        token::authority = pool,
        seeds = [VAULT_A_SEED, pool.key().as_ref()],
        bump
    )]
    pub vault_a: Account<'info, TokenAccount>,

    /// Vault B — PDA token account that holds Token B reserves
    /// Seeds: [VAULT_B_SEED, pool]
    #[account(
        init,
        payer = authority,
        token::mint = token_b_mint,
        token::authority = pool,
        seeds = [VAULT_B_SEED, pool.key().as_ref()],
        bump
    )]
    pub vault_b: Account<'info, TokenAccount>,

    /// LP Token Mint — minted to LPs proportional to their share
    /// Seeds: [LP_MINT_SEED, pool]
    #[account(
        init,
        payer = authority,
        mint::decimals = 6,
        mint::authority = pool,
        seeds = [LP_MINT_SEED, pool.key().as_ref()],
        bump
    )]
    pub lp_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
