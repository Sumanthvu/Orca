use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, MintTo, Token, TokenAccount, Transfer},
};

use crate::state::*;
use crate::errors::AmmError;

/// Adds liquidity to an existing pool.
///
/// Transfers `amount_a` of Token A and the required proportional amount of Token B
/// from the user's wallet into the pool vaults, then mints LP tokens to the user.
///
/// First deposit uses: lp_tokens = sqrt(amount_a * amount_b) - MINIMUM_LIQUIDITY
/// Subsequent deposits use: lp_tokens = (amount_a / reserve_a) * total_supply
pub fn handle_add_liquidity(
    ctx: Context<AddLiquidity>,
    amount_a_desired: u64,
    amount_b_desired: u64,
    amount_a_min: u64,
    amount_b_min: u64,
) -> Result<()> {
    require!(amount_a_desired > 0 && amount_b_desired > 0, AmmError::InvalidAmount);

    let pool = &ctx.accounts.pool;
    let reserve_a = ctx.accounts.vault_a.amount;
    let reserve_b = ctx.accounts.vault_b.amount;
    let total_lp = ctx.accounts.lp_mint.supply;

    let (amount_a, amount_b, lp_tokens_to_mint) = if total_lp == 0 {
        // === First deposit: geometric mean formula ===
        require!(
            amount_a_desired > MINIMUM_LIQUIDITY && amount_b_desired > MINIMUM_LIQUIDITY,
            AmmError::InsufficientInitialLiquidity
        );
        let lp = integer_sqrt(
            (amount_a_desired as u128)
                .checked_mul(amount_b_desired as u128)
                .ok_or(AmmError::MathOverflow)?,
        )
        .checked_sub(MINIMUM_LIQUIDITY as u128)
        .ok_or(AmmError::InsufficientInitialLiquidity)? as u64;

        (amount_a_desired, amount_b_desired, lp)
    } else {
        // === Subsequent deposits: proportional ===
        // Calculate optimal amounts maintaining current ratio
        let amount_b_optimal = (amount_a_desired as u128)
            .checked_mul(reserve_b as u128)
            .ok_or(AmmError::MathOverflow)?
            .checked_div(reserve_a as u128)
            .ok_or(AmmError::MathOverflow)? as u64;

        let (actual_a, actual_b) = if amount_b_optimal <= amount_b_desired {
            require!(amount_b_optimal >= amount_b_min, AmmError::SlippageExceeded);
            (amount_a_desired, amount_b_optimal)
        } else {
            let amount_a_optimal = (amount_b_desired as u128)
                .checked_mul(reserve_a as u128)
                .ok_or(AmmError::MathOverflow)?
                .checked_div(reserve_b as u128)
                .ok_or(AmmError::MathOverflow)? as u64;
            require!(amount_a_optimal >= amount_a_min, AmmError::SlippageExceeded);
            (amount_a_optimal, amount_b_desired)
        };

        let lp = std::cmp::min(
            (actual_a as u128)
                .checked_mul(total_lp as u128)
                .ok_or(AmmError::MathOverflow)?
                .checked_div(reserve_a as u128)
                .ok_or(AmmError::MathOverflow)? as u64,
            (actual_b as u128)
                .checked_mul(total_lp as u128)
                .ok_or(AmmError::MathOverflow)?
                .checked_div(reserve_b as u128)
                .ok_or(AmmError::MathOverflow)? as u64,
        );

        (actual_a, actual_b, lp)
    };

    require!(lp_tokens_to_mint > 0, AmmError::InsufficientLiquidity);

    // CPI: Transfer Token A from user → vault A
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token_a.to_account_info(),
                to: ctx.accounts.vault_a.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount_a,
    )?;

    // CPI: Transfer Token B from user → vault B
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token_b.to_account_info(),
                to: ctx.accounts.vault_b.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount_b,
    )?;

    // Pool PDA signer seeds
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

    // CPI: Mint LP tokens to user
    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.lp_mint.to_account_info(),
                to: ctx.accounts.user_lp_token.to_account_info(),
                authority: ctx.accounts.pool.to_account_info(),
            },
            signer_seeds,
        ),
        lp_tokens_to_mint,
    )?;

    // Update pool lp_supply
    let pool = &mut ctx.accounts.pool;
    pool.lp_supply = pool
        .lp_supply
        .checked_add(lp_tokens_to_mint)
        .ok_or(AmmError::MathOverflow)?;

    msg!(
        "Liquidity added: {} Token A, {} Token B, {} LP tokens minted",
        amount_a,
        amount_b,
        lp_tokens_to_mint
    );

    Ok(())
}

/// Integer square root (floor)
fn integer_sqrt(n: u128) -> u128 {
    if n == 0 {
        return 0;
    }
    let mut x = n;
    let mut y = (x + 1) / 2;
    while y < x {
        x = y;
        y = (x + n / x) / 2;
    }
    x
}

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    /// The user depositing liquidity
    #[account(mut)]
    pub user: Signer<'info>,

    /// Pool State PDA
    #[account(
        mut,
        seeds = [POOL_SEED, pool.token_a_mint.as_ref(), pool.token_b_mint.as_ref()],
        bump = pool.bump
    )]
    pub pool: Box<Account<'info, Pool>>,

    /// Vault A holding Token A reserves
    #[account(
        mut,
        seeds = [VAULT_A_SEED, pool.key().as_ref()],
        bump = pool.vault_a_bump,
        token::mint = pool.token_a_mint,
        token::authority = pool
    )]
    pub vault_a: Box<Account<'info, TokenAccount>>,

    /// Vault B holding Token B reserves
    #[account(
        mut,
        seeds = [VAULT_B_SEED, pool.key().as_ref()],
        bump = pool.vault_b_bump,
        token::mint = pool.token_b_mint,
        token::authority = pool
    )]
    pub vault_b: Box<Account<'info, TokenAccount>>,

    /// LP Mint — mints LP tokens
    #[account(
        mut,
        seeds = [LP_MINT_SEED, pool.key().as_ref()],
        bump = pool.lp_mint_bump,
        mint::authority = pool
    )]
    pub lp_mint: Box<Account<'info, Mint>>,

    /// User's Token A account (source of deposit)
    #[account(
        mut,
        token::mint = pool.token_a_mint,
        token::authority = user
    )]
    pub user_token_a: Box<Account<'info, TokenAccount>>,

    /// User's Token B account (source of deposit)
    #[account(
        mut,
        token::mint = pool.token_b_mint,
        token::authority = user
    )]
    pub user_token_b: Box<Account<'info, TokenAccount>>,

    /// User's LP token account (receives minted LP tokens)
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = lp_mint,
        associated_token::authority = user
    )]
    pub user_lp_token: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
