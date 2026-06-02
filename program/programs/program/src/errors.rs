use anchor_lang::prelude::*;

#[error_code]
pub enum AmmError {
    #[msg("Slippage tolerance exceeded — output is below your minimum accepted amount")]
    SlippageExceeded,

    #[msg("Invalid amount — must be greater than zero")]
    InvalidAmount,

    #[msg("Insufficient liquidity in the pool for this trade")]
    InsufficientLiquidity,

    #[msg("Invalid token mint — token does not belong to this pool")]
    InvalidTokenMint,

    #[msg("Mathematical overflow occurred")]
    MathOverflow,

    #[msg("Initial liquidity deposit must be above minimum threshold")]
    InsufficientInitialLiquidity,

    #[msg("LP token balance is insufficient for this withdrawal")]
    InsufficientLpTokens,

    #[msg("Token mints must be different")]
    SameTokenMints,
}
