import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Program as AmmProgram } from "../target/types/program";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";

async function main() {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Program as Program<AmmProgram>;
  const wallet = provider.wallet as anchor.Wallet;

  console.log("Setting up tokens and pool on Devnet...");

  // 1. Create two test tokens
  console.log("Creating Token A...");
  const tokenAMint = await createMint(
    provider.connection,
    wallet.payer,
    wallet.publicKey,
    null,
    6
  );

  console.log("Creating Token B...");
  const tokenBMint = await createMint(
    provider.connection,
    wallet.payer,
    wallet.publicKey,
    null,
    6
  );

  console.log(`Token A: ${tokenAMint.toBase58()}`);
  console.log(`Token B: ${tokenBMint.toBase58()}`);

  // 2. Initialize the AMM pool
  // Get PDAs
  const [poolPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("pool"),
      tokenAMint.toBuffer(),
      tokenBMint.toBuffer(),
    ],
    program.programId
  );

  const [vaultAPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vault_a"), poolPda.toBuffer()],
    program.programId
  );

  const [vaultBPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vault_b"), poolPda.toBuffer()],
    program.programId
  );

  const [lpMintPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("lp_mint"), poolPda.toBuffer()],
    program.programId
  );

  console.log("Initializing Pool...");
  const tx = await program.methods
    .initializePool()
    .accounts({
      tokenAMint,
      tokenBMint,
      pool: poolPda,
      vaultA: vaultAPda,
      vaultB: vaultBPda,
      lpMint: lpMintPda,
      payer: wallet.publicKey,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    } as any) // Type bypass for IDL accounts struct mismatches
    .rpc();

  console.log(`Pool initialized! Transaction Signature: ${tx}`);
  console.log("==========================================");
  console.log("Setup complete! Your test pool is ready.");
  console.log(`Token A: ${tokenAMint.toBase58()}`);
  console.log(`Token B: ${tokenBMint.toBase58()}`);
}

main().catch((err) => {
  console.error(err);
});
