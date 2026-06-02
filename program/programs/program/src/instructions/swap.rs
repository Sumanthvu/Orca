use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::state::*;
use crate::errors::AmmError;

/// Executes a constant-product (x * y = k) swap.
///
/// Formula (with 0.3% fee):
///   amount_in_with_fee = amount_in * (fee_denom - fee_num) / fee_denom
///   amount_out = (reserve_out * amount_in_with_fee) / (reserve_in + amount_in_with_fee)
///
/// Slippage protection: if amount_out < minimum_amount_out, reverts with SlippageExceeded.
pub fn handle_swap(
    ctx: Context<Swap>,
    amount_in: u64,
    minimum_amount_out: u64,
    a_to_b: bool, // true = swap Token A → Token B, false = swap Token B → Token A
) -> Result<()> {
    require!(amount_in > 0, AmmError::InvalidAmount);

    let pool = &ctx.accounts.pool;

    let (reserve_in, reserve_out) = if a_to_b {
        (ctx.accounts.vault_a.amount, ctx.accounts.vault_b.amount)
    } else {
        (ctx.accounts.vault_b.amount, ctx.accounts.vault_a.amount)
    };

    require!(reserve_in > 0 && reserve_out > 0, AmmError::InsufficientLiquidity);

    // Amount in after fee: amount_in * (1 - fee) = amount_in * 997 / 1000
    let amount_in_with_fee = (amount_in as u128)
        .checked_mul((pool.fee_denominator - pool.fee_numerator) as u128)
        .ok_or(AmmError::MathOverflow)?;

    // output = (reserve_out * amount_in_with_fee) / (reserve_in * fee_denom + amount_in_with_fee)
    let numerator = amount_in_with_fee
        .checked_mul(reserve_out as u128)
        .ok_or(AmmError::MathOverflow)?;

    let denominator = (reserve_in as u128)
        .checked_mul(pool.fee_denominator as u128)
        .ok_or(AmmError::MathOverflow)?
        .checked_add(amount_in_with_fee)
        .ok_or(AmmError::MathOverflow)?;

    let amount_out = (numerator
        .checked_div(denominator)
        .ok_or(AmmError::MathOverflow)?) as u64;

    require!(amount_out > 0, AmmError::InsufficientLiquidity);
    require!(amount_out >= minimum_amount_out, AmmError::SlippageExceeded);
    require!(amount_out < reserve_out, AmmError::InsufficientLiquidity);

    // Pool PDA signer seeds (used to sign vault transfers out)
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

    if a_to_b {
        // Transfer Token A from user → vault A
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token_in.to_account_info(),
                    to: ctx.accounts.vault_a.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount_in,
        )?;

        // Transfer Token B from vault B → user (pool PDA signs)
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault_b.to_account_info(),
                    to: ctx.accounts.user_token_out.to_account_info(),
                    authority: ctx.accounts.pool.to_account_info(),
                },
                signer_seeds,
            ),
            amount_out,
        )?;
    } else {
        // Transfer Token B from user → vault B
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token_in.to_account_info(),
                    to: ctx.accounts.vault_b.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount_in,
        )?;

        // Transfer Token A from vault A → user (pool PDA signs)
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault_a.to_account_info(),
                    to: ctx.accounts.user_token_out.to_account_info(),
                    authority: ctx.accounts.pool.to_account_info(),
                },
                signer_seeds,
            ),
            amount_out,
        )?;
    }

    msg!(
        "Swap: {} in → {} out (a_to_b={})",
        amount_in,
        amount_out,
        a_to_b
    );

    Ok(())
}

#[derive(Accounts)]
pub struct Swap<'info> {
    /// The user performing the swap
    #[account(mut)]
    pub user: Signer<'info>,

    /// Pool State PDA
    #[account(
        seeds = [POOL_SEED, pool.token_a_mint.as_ref(), pool.token_b_mint.as_ref()],
        bump = pool.bump
    )]
    pub pool: Account<'info, Pool>,

    /// Vault A — Token A reserves
    #[account(
        mut,
        seeds = [VAULT_A_SEED, pool.key().as_ref()],
        bump = pool.vault_a_bump,
        token::mint = pool.token_a_mint,
        token::authority = pool
    )]
    pub vault_a: Account<'info, TokenAccount>,

    /// Vault B — Token B reserves
    #[account(
        mut,
        seeds = [VAULT_B_SEED, pool.key().as_ref()],
        bump = pool.vault_b_bump,
        token::mint = pool.token_b_mint,
        token::authority = pool
    )]
    pub vault_b: Account<'info, TokenAccount>,

    /// User's source token account (Token A if a_to_b, else Token B)
    #[account(mut)]
    pub user_token_in: Account<'info, TokenAccount>,

    /// User's destination token account (Token B if a_to_b, else Token A)
    #[account(mut)]
    pub user_token_out: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}
