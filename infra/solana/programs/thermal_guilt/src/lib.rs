use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};

declare_id!("11111111111111111111111111111111");

#[program]
pub mod thermal_guilt {
    use super::*;

    pub fn initialize_user(ctx: Context<InitializeUser>, neighborhood_id: String) -> Result<()> {
        let user_account = &mut ctx.accounts.user_account;
        user_account.owner = ctx.accounts.owner.key();
        user_account.neighborhood_id = neighborhood_id;
        user_account.total_tokens_earned = 0;
        user_account.current_streak = 0;
        user_account.last_week_score = 0;
        user_account.thermal_ghost_type = "Warm Hug".to_string();
        Ok(())
    }

    pub fn record_efficiency(ctx: Context<RecordEfficiency>, score: u8) -> Result<()> {
        require!(score <= 100, ErrorCode::InvalidScore);

        let user = &mut ctx.accounts.user_account;
        let tokens = calculate_reward(score);

        if tokens > 0 {
            token::mint_to(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    MintTo {
                        mint: ctx.accounts.cool_mint.to_account_info(),
                        to: ctx.accounts.user_token_account.to_account_info(),
                        authority: ctx.accounts.mint_authority.to_account_info(),
                    },
                    &[&[b"mint_authority", &[ctx.bumps.mint_authority]]],
                ),
                tokens,
            )?;
        }

        user.total_tokens_earned = user.total_tokens_earned.saturating_add(tokens);
        user.last_week_score = score;
        user.current_streak = if score >= 50 { user.current_streak + 1 } else { 0 };
        user.thermal_ghost_type = ghost_type_for_score(score);

        Ok(())
    }
}

fn calculate_reward(score: u8) -> u64 {
    match score {
        95..=100 => 100_000_000,
        85..=94 => 50_000_000,
        70..=84 => 20_000_000,
        50..=69 => 5_000_000,
        _ => 0,
    }
}

fn ghost_type_for_score(score: u8) -> String {
    match score {
        90..=100 => "Ice Queen".to_string(),
        75..=89 => "Cool Cat".to_string(),
        50..=74 => "Warm Hug".to_string(),
        25..=49 => "Thermal Vampire".to_string(),
        _ => "Inferno".to_string(),
    }
}

#[derive(Accounts)]
pub struct InitializeUser<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(init, payer = owner, space = 8 + UserAccount::INIT_SPACE)]
    pub user_account: Account<'info, UserAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RecordEfficiency<'info> {
    #[account(mut)]
    pub user_account: Account<'info, UserAccount>,

    #[account(mut)]
    pub cool_mint: Account<'info, Mint>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    /// CHECK: PDA authority for minting.
    #[account(seeds=[b"mint_authority"], bump)]
    pub mint_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

#[account]
#[derive(InitSpace)]
pub struct UserAccount {
    pub owner: Pubkey,
    #[max_len(64)]
    pub neighborhood_id: String,
    pub total_tokens_earned: u64,
    pub current_streak: u16,
    pub last_week_score: u8,
    #[max_len(24)]
    pub thermal_ghost_type: String,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Score must be between 0 and 100")]
    InvalidScore,
}
