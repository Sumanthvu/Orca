use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("6gzsk7VbTk7oa2tmGqcaAwpbSxg9jbs7AvDKoG6KkXPQ");

#[program]
pub mod orca_amm {
    use super::*;

    /// Creates a new liquidity pool for the given token pair.
    /// Initializes Pool State PDA, Vault A, Vault B, and LP Mint.
    pub fn initialize_pool(ctx: Context<InitializePool>) -> Result<()> {
        handle_initialize_pool(ctx)
    }

    /// Deposits Token A and Token B into the pool and mints LP tokens to the user.
    ///
    /// # Arguments
    /// * `amount_a_desired` — Maximum Token A to deposit
    /// * `amount_b_desired` — Maximum Token B to deposit
    /// * `amount_a_min` — Minimum Token A (slippage guard)
    /// * `amount_b_min` — Minimum Token B (slippage guard)
    pub fn add_liquidity(
        ctx: Context<AddLiquidity>,
        amount_a_desired: u64,
        amount_b_desired: u64,
        amount_a_min: u64,
        amount_b_min: u64,
    ) -> Result<()> {
        handle_add_liquidity(ctx, amount_a_desired, amount_b_desired, amount_a_min, amount_b_min)
    }

    /// Executes a constant-product swap (x * y = k) with 0.3% fee.
    ///
    /// # Arguments
    /// * `amount_in` — Amount of input token to swap
    /// * `minimum_amount_out` — Minimum output (slippage protection)
    /// * `a_to_b` — Direction: true = Token A → Token B, false = Token B → Token A
    pub fn swap(
        ctx: Context<Swap>,
        amount_in: u64,
        minimum_amount_out: u64,
        a_to_b: bool,
    ) -> Result<()> {
        handle_swap(ctx, amount_in, minimum_amount_out, a_to_b)
    }

    /// Burns LP tokens and returns proportional Token A + Token B to the user.
    ///
    /// # Arguments
    /// * `lp_amount` — LP tokens to burn
    /// * `minimum_a_out` — Minimum Token A to receive (slippage guard)
    /// * `minimum_b_out` — Minimum Token B to receive (slippage guard)
    pub fn remove_liquidity(
        ctx: Context<RemoveLiquidity>,
        lp_amount: u64,
        minimum_a_out: u64,
        minimum_b_out: u64,
    ) -> Result<()> {
        handle_remove_liquidity(ctx, lp_amount, minimum_a_out, minimum_b_out)
    }
}
