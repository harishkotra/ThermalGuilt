import "dotenv/config";
import path from "node:path";
import fs from "node:fs";
import bs58 from "bs58";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  clusterApiUrl
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintToChecked
} from "@solana/spl-token";

type Cli = {
  supply: string;
  decimals: number;
};

function loadEnvFileIfPresent() {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../../.env")
  ];

  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
    break;
  }
}

function parseCli(): Cli {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) {
    console.log(`
Usage:
  npm --workspace @thermal-guilt/api run solana:bootstrap-mint -- --supply 10000000 --decimals 6

Options:
  --supply    Initial token supply in whole tokens (default: 10000000)
  --decimals  Token decimals (default: 6)
`);
    process.exit(0);
  }

  const supplyArg = readArg(args, "--supply") ?? "10000000";
  const decimalsArg = readArg(args, "--decimals") ?? "6";
  const decimals = Number(decimalsArg);

  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 9) {
    throw new Error("--decimals must be an integer between 0 and 9");
  }

  if (!/^\d+(\.\d+)?$/.test(supplyArg)) {
    throw new Error("--supply must be a positive number, e.g. 10000000 or 10000000.5");
  }

  return {
    supply: supplyArg,
    decimals
  };
}

function readArg(args: string[], key: string): string | undefined {
  const idx = args.indexOf(key);
  if (idx === -1) return undefined;
  return args[idx + 1];
}

function parseTreasuryKey(raw: string): Keypair {
  try {
    return Keypair.fromSecretKey(bs58.decode(raw));
  } catch {
    const arr = JSON.parse(raw) as number[];
    return Keypair.fromSecretKey(Uint8Array.from(arr));
  }
}

function amountToBaseUnits(amount: string, decimals: number): bigint {
  const [whole, frac = ""] = amount.split(".");
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  const wholeUnits = BigInt(whole) * BigInt(10 ** decimals);
  const fracUnits = fracPadded ? BigInt(fracPadded) : 0n;
  return wholeUnits + fracUnits;
}

async function main() {
  loadEnvFileIfPresent();
  const { supply, decimals } = parseCli();

  const rpc = process.env.SOLANA_RPC_URL || clusterApiUrl("devnet");
  if (!rpc.includes("devnet")) {
    throw new Error(`SOLANA_RPC_URL must point to Devnet. Got: ${rpc}`);
  }

  const rawKey = process.env.SOLANA_PRIVATE_KEY;
  if (!rawKey) {
    throw new Error("SOLANA_PRIVATE_KEY is required in .env");
  }

  const treasury = parseTreasuryKey(rawKey);
  const connection = new Connection(rpc, "confirmed");

  const balance = await connection.getBalance(treasury.publicKey);
  if (balance < 0.05 * LAMPORTS_PER_SOL) {
    console.warn(`Warning: treasury wallet has low SOL on Devnet (${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL).`);
  }

  const mint = await createMint(
    connection,
    treasury,
    treasury.publicKey,
    null,
    decimals,
    undefined,
    undefined,
    TOKEN_PROGRAM_ID
  );

  const treasuryAta = await getOrCreateAssociatedTokenAccount(
    connection,
    treasury,
    mint,
    treasury.publicKey,
    false,
    undefined,
    undefined,
    TOKEN_PROGRAM_ID
  );

  const baseUnits = amountToBaseUnits(supply, decimals);
  if (baseUnits > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("Initial supply too large for JS number mint helper. Use a smaller --supply.");
  }

  const mintSig = await mintToChecked(
    connection,
    treasury,
    mint,
    treasuryAta.address,
    treasury,
    Number(baseUnits),
    decimals,
    undefined,
    undefined,
    TOKEN_PROGRAM_ID
  );

  console.log("\nCreated COOL token mint on DEVNET");
  console.log(`Mint Address:      ${mint.toBase58()}`);
  console.log(`Treasury Wallet:   ${treasury.publicKey.toBase58()}`);
  console.log(`Treasury ATA:      ${treasuryAta.address.toBase58()}`);
  console.log(`Initial Supply:    ${supply} COOL`);
  console.log(`Decimals:          ${decimals}`);
  console.log(`Mint Tx Signature: ${mintSig}`);

  console.log("\nPaste into .env:");
  console.log(`SOLANA_RPC_URL=${rpc}`);
  console.log(`NEXT_PUBLIC_SOLANA_RPC_URL=${rpc}`);
  console.log(`COOL_TOKEN_MINT=${mint.toBase58()}`);
  console.log(`PROGRAM_ID=${process.env.PROGRAM_ID || "11111111111111111111111111111111"}`);
}

main().catch((error) => {
  console.error(`\nFailed to bootstrap mint: ${(error as Error).message}`);
  process.exit(1);
});
