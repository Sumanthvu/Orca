use anchor_lang::prelude::*;

declare_id!("6gzsk7VbTk7oa2tmGqcaAwpbSxg9jbs7AvDKoG6KkXPQ");

#[program]
pub mod orca_amm {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
