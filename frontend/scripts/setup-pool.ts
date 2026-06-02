import { Connection, Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction, TransactionInstruction, sendAndConfirmTransaction } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import fs from "fs";
import path from "path";

// Load Payer (Funded CLI Wallet)
const keypairPath = path.resolve(__dirname, "../../program/scripts/id.json");
const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
const payer = Keypair.fromSecretKey(new Uint8Array(keypairData));

// User Phantom Wallet Address
const USER_PHANTOM_WALLET = new PublicKey("EZXrvNyCnXV2Pyyj9JPTptukBQJM1WkhyQWRDagb4HL5");

const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const programId = new PublicKey("6gzsk7VbTk7oa2tmGqcaAwpbSxg9jbs7AvDKoG6KkXPQ");

async function main() {
  console.log(`Payer address: ${payer.publicKey.toBase58()}`);
  const balance = await connection.getBalance(payer.publicKey);
  console.log(`Payer balance: ${balance / 1e9} SOL`);
  
  if (balance === 0) throw new Error("Not enough SOL in payer wallet!");

  console.log("-----------------------------------------");
  console.log("1. Creating Test Tokens (Token A and Token B)");
  
  const tokenAMint = await createMint(connection, payer, payer.publicKey, null, 6);
  console.log(`Token A Mint Created: ${tokenAMint.toBase58()}`);
  
  const tokenBMint = await createMint(connection, payer, payer.publicKey, null, 6);
  console.log(`Token B Mint Created: ${tokenBMint.toBase58()}`);

  console.log("-----------------------------------------");
  console.log("2. Minting 100,000 Tokens to User Phantom Wallet");

  const userAtaA = await getOrCreateAssociatedTokenAccount(connection, payer, tokenAMint, USER_PHANTOM_WALLET);
  const userAtaB = await getOrCreateAssociatedTokenAccount(connection, payer, tokenBMint, USER_PHANTOM_WALLET);

  await mintTo(connection, payer, tokenAMint, userAtaA.address, payer, 100000 * 1e6);
  console.log("Minted 100,000 Token A to user!");

  await mintTo(connection, payer, tokenBMint, userAtaB.address, payer, 100000 * 1e6);
  console.log("Minted 100,000 Token B to user!");

  console.log("-----------------------------------------");
  console.log("3. Initializing AMM Pool Manually");

  const [poolPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool"), tokenAMint.toBuffer(), tokenBMint.toBuffer()],
    programId
  );
  const [vaultAPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault_a"), poolPda.toBuffer()],
    programId
  );
  const [vaultBPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault_b"), poolPda.toBuffer()],
    programId
  );
  const [lpMintPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("lp_mint"), poolPda.toBuffer()],
    programId
  );

  // Discriminator for initialize_pool
  const initializePoolDiscriminator = Buffer.from([95, 180, 10, 172, 84, 174, 232, 40]);

  const ix = new TransactionInstruction({
    programId,
    keys: [
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: tokenAMint, isSigner: false, isWritable: false },
      { pubkey: tokenBMint, isSigner: false, isWritable: false },
      { pubkey: poolPda, isSigner: false, isWritable: true },
      { pubkey: vaultAPda, isSigner: false, isWritable: true },
      { pubkey: vaultBPda, isSigner: false, isWritable: true },
      { pubkey: lpMintPda, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"), isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ],
    data: initializePoolDiscriminator,
  });

  const tx = new Transaction().add(ix);
  const sig = await sendAndConfirmTransaction(connection, tx, [payer]);

  console.log(`Success! Pool Initialized: ${poolPda.toBase58()}`);
  console.log(`Transaction Signature: ${sig}`);
  
  console.log("-----------------------------------------");
  console.log("DONE. The following are the Mint addresses:");
  console.log(`Token A: ${tokenAMint.toBase58()}`);
  console.log(`Token B: ${tokenBMint.toBase58()}`);
}

main().catch(console.error);
