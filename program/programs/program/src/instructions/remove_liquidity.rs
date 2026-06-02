use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Burn, Mint, Token, TokenAccount, Transfer},
};

use crate::state::*;
use crate::errors::AmmError;

/// Removes liquidity from the pool by burning LP tokens.
///
/// Calculates proportional share of each vault:
///   amount_a = (lp_amount / total_lp_supply) * reserve_a
///   amount_b = (lp_amount / total_lp_supply) * reserve_b
///
/// Slippage protection via `minimum_a_out` and `minimum_b_out`.
pub fn handle_remove_liquidity(
    ctx: Context<RemoveLiquidity>,
    lp_amount: u64,
    minimum_a_out: u64,
    minimum_b_out: u64,
) -> Result<()> {
    require!(lp_amount > 0, AmmError::InvalidAmount);

    let total_lp = ctx.accounts.lp_mint.supply;
    require!(total_lp > 0, AmmError::InsufficientLiquidity);
    require!(
        ctx.accounts.user_lp_token.amount >= lp_amount,
        AmmError::InsufficientLpTokens
    );

    let reserve_a = ctx.accounts.vault_a.amount;
    let reserve_b = ctx.accounts.vault_b.amount;

    // Proportional share
    let amount_a = (lp_amount as u128)
        .checked_mul(reserve_a as u128)
        .ok_or(AmmError::MathOverflow)?
        .checked_div(total_lp as u128)
        .ok_or(AmmError::MathOverflow)? as u64;

    let amount_b = (lp_amount as u128)
        .checked_mul(reserve_b as u128)
        .ok_or(AmmError::MathOverflow)?
        .checked_div(total_lp as u128)
        .ok_or(AmmError::MathOverflow)? as u64;

    require!(amount_a >= minimum_a_out, AmmError::SlippageExceeded);
    require!(amount_b >= minimum_b_out, AmmError::SlippageExceeded);
    require!(amount_a > 0 && amount_b > 0, AmmError::InsufficientLiquidity);

    // Pool PDA signer seeds
    let pool = &ctx.accounts.pool;
    let token_a_key = pool.token_a_mint;
    let token_b_key = pool.token_b_mint;
    let pool_bump = pool.bump;
    let seeds = &[
        POOL_SEED,
        token_a_key.as_ref(),
        token_b_key.as_ref(),
        &[pool_bump],
    ];
    let signer_seeds = &[&seeds[..]];

    // CPI: Burn LP tokens from user
    token::burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.lp_mint.to_account_info(),
                from: ctx.accounts.user_lp_token.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        lp_amount,
    )?;

    // CPI: Transfer Token A from vault A → user (pool PDA signs)
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_a.to_account_info(),
                to: ctx.accounts.user_token_a.to_account_info(),
                authority: ctx.accounts.pool.to_account_info(),
            },
            signer_seeds,
        ),
        amount_a,
    )?;

    // CPI: Transfer Token B from vault B → user (pool PDA signs)
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_b.to_account_info(),
                to: ctx.accounts.user_token_b.to_account_info(),
                authority: ctx.accounts.pool.to_account_info(),
            },
            signer_seeds,
        ),
        amount_b,
    )?;

    // Update pool lp_supply
    let pool = &mut ctx.accounts.pool;
    pool.lp_supply = pool
        .lp_supply
        .checked_sub(lp_amount)
        .ok_or(AmmError::MathOverflow)?;

    msg!(
        "Liquidity removed: {} LP burned → {} Token A + {} Token B",
        lp_amount,
        amount_a,
        amount_b
    );

    Ok(())
}

#[derive(Accounts)]
pub struct RemoveLiquidity<'info> {
    /// The user removing liquidity
    #[account(mut)]
    pub user: Signer<'info>,

    /// Pool State PDA
    #[account(
        mut,
        seeds = [POOL_SEED, pool.token_a_mint.as_ref(), pool.token_b_mint.as_ref()],
        bump = pool.bump
    )]
    pub pool: Box<Account<'info, Pool>>,

    /// Token A mint (needed for init_if_needed ATA creation)
    pub token_a_mint: Box<Account<'info, Mint>>,

    /// Token B mint (needed for init_if_needed ATA creation)
    pub token_b_mint: Box<Account<'info, Mint>>,

    /// Vault A — Token A reserves
    #[account(
        mut,
        seeds = [VAULT_A_SEED, pool.key().as_ref()],
        bump = pool.vault_a_bump,
        token::mint = token_a_mint,
        token::authority = pool
    )]
    pub vault_a: Box<Account<'info, TokenAccount>>,

    /// Vault B — Token B reserves
    #[account(
        mut,
        seeds = [VAULT_B_SEED, pool.key().as_ref()],
        bump = pool.vault_b_bump,
        token::mint = token_b_mint,
        token::authority = pool
    )]
    pub vault_b: Box<Account<'info, TokenAccount>>,

    /// LP Mint — burns LP tokens
    #[account(
        mut,
        seeds = [LP_MINT_SEED, pool.key().as_ref()],
        bump = pool.lp_mint_bump,
        mint::authority = pool
    )]
    pub lp_mint: Box<Account<'info, Mint>>,

    /// User's LP token account (source of LP tokens to burn)
    #[account(
        mut,
        token::mint = lp_mint,
        token::authority = user
    )]
    pub user_lp_token: Box<Account<'info, TokenAccount>>,

    /// User's Token A account (receives withdrawn Token A)
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = token_a_mint,
        associated_token::authority = user
    )]
    pub user_token_a: Box<Account<'info, TokenAccount>>,

    /// User's Token B account (receives withdrawn Token B)
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = token_b_mint,
        associated_token::authority = user
    )]
    pub user_token_b: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
