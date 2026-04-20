import bs58 from "bs58";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmRawTransaction,
  type TransactionSignature
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAccount,
  getAssociatedTokenAddress,
  getMint,
  mintTo,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import { scoreToTokenReward } from "@thermal-guilt/shared";
import { config } from "../config.js";

const connection = new Connection(config.solana.rpcUrl, "confirmed");

function parseTreasurySigner() {
  if (!config.solana.privateKey) {
    throw new Error("SOLANA_PRIVATE_KEY is required for token treasury operations.");
  }

  try {
    const raw = bs58.decode(config.solana.privateKey);
    return Keypair.fromSecretKey(raw);
  } catch {
    const arr = JSON.parse(config.solana.privateKey) as number[];
    return Keypair.fromSecretKey(Uint8Array.from(arr));
  }
}

function parseMint() {
  if (!config.solana.coolMint) {
    throw new Error("COOL_TOKEN_MINT is required.");
  }
  return new PublicKey(config.solana.coolMint);
}

export async function mintCoolTokens(walletAddress: string, amount: number) {
  const recipient = new PublicKey(walletAddress);
  const treasury = parseTreasurySigner();
  const mint = parseMint();

  const recipientAta = await getAssociatedTokenAddress(mint, recipient);
  const maybeRecipient = await connection.getAccountInfo(recipientAta);

  if (!maybeRecipient) {
    const tx = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        treasury.publicKey,
        recipientAta,
        recipient,
        mint,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
    const { blockhash } = await connection.getLatestBlockhash("finalized");
    tx.recentBlockhash = blockhash;
    tx.feePayer = treasury.publicKey;
    tx.sign(treasury);
    await sendAndConfirmRawTransaction(connection, tx.serialize(), { commitment: "confirmed" });
  }

  const mintInfo = await getMint(connection, mint);
  const baseUnits = BigInt(Math.round(amount * 10 ** mintInfo.decimals));

  const sig = await mintTo(connection, treasury, mint, recipientAta, treasury, Number(baseUnits));
  return {
    walletAddress,
    amount,
    transactionSignature: sig,
    network: "solana-devnet"
  };
}

export async function getCoolBalance(walletAddress: string) {
  const owner = new PublicKey(walletAddress);
  const mint = parseMint();
  const ata = await getAssociatedTokenAddress(mint, owner);
  const mintInfo = await getMint(connection, mint);
  const accountInfo = await connection.getAccountInfo(ata);

  if (!accountInfo) {
    return {
      walletAddress,
      balance: 0,
      mint: mint.toBase58(),
      ata: ata.toBase58()
    };
  }

  const tokenAccount = await getAccount(connection, ata);
  const raw = Number(tokenAccount.amount);

  return {
    walletAddress,
    balance: raw / 10 ** mintInfo.decimals,
    mint: mint.toBase58(),
    ata: ata.toBase58()
  };
}

export async function buildClaimTransaction(walletAddress: string, score: number) {
  const owner = new PublicKey(walletAddress);
  const treasury = parseTreasurySigner();
  const mint = parseMint();
  const reward = scoreToTokenReward(score);

  const mintInfo = await getMint(connection, mint);
  const amount = BigInt(Math.round(reward * 10 ** mintInfo.decimals));

  const sourceAta = await getAssociatedTokenAddress(mint, treasury.publicKey);
  const destinationAta = await getAssociatedTokenAddress(mint, owner);

  const instructions = [];
  const destinationExists = await connection.getAccountInfo(destinationAta);

  if (!destinationExists) {
    instructions.push(
      createAssociatedTokenAccountInstruction(
        owner,
        destinationAta,
        owner,
        mint,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
  }

  instructions.push(
    createTransferCheckedInstruction(
      sourceAta,
      mint,
      destinationAta,
      treasury.publicKey,
      Number(amount),
      mintInfo.decimals,
      []
    )
  );

  const tx = new Transaction().add(...instructions);
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;
  tx.feePayer = owner;
  tx.partialSign(treasury);

  return {
    serializedTransaction: tx.serialize({ requireAllSignatures: false }).toString("base64"),
    reward,
    blockhash,
    lastValidBlockHeight
  };
}

export async function submitSignedTransaction(serializedSignedTx: string): Promise<TransactionSignature> {
  const raw = Buffer.from(serializedSignedTx, "base64");
  return connection.sendRawTransaction(raw, { skipPreflight: false, preflightCommitment: "confirmed" });
}

export async function claimWeeklyTokens(walletAddress: string, score: number) {
  const tx = await buildClaimTransaction(walletAddress, score);
  return {
    walletAddress,
    tokens: tx.reward,
    transactionMode: "wallet-sign-required",
    serializedTransaction: tx.serializedTransaction,
    network: "solana-devnet"
  };
}
