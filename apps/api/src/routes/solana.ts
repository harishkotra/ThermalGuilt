import { Router } from "express";
import {
  buildClaimTransaction,
  claimWeeklyTokens,
  getCoolBalance,
  mintCoolTokens,
  submitSignedTransaction
} from "../services/solana.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const solanaRouter = Router();

solanaRouter.post("/mint", asyncHandler(async (req, res) => {
  const { walletAddress, amount } = req.body as { walletAddress: string; amount: number };
  const result = await mintCoolTokens(walletAddress, amount);
  res.json(result);
}));

solanaRouter.get("/balance/:wallet", asyncHandler(async (req, res) => {
  const result = await getCoolBalance(String(req.params.wallet));
  res.json(result);
}));

solanaRouter.post("/claim", asyncHandler(async (req, res) => {
  const { walletAddress, score } = req.body as { walletAddress: string; score: number };
  const result = await claimWeeklyTokens(walletAddress, score);
  res.json(result);
}));

solanaRouter.post("/claim/transaction", asyncHandler(async (req, res) => {
  const { walletAddress, score } = req.body as { walletAddress: string; score: number };
  const result = await buildClaimTransaction(walletAddress, score);
  res.json(result);
}));

solanaRouter.post("/claim/submit", asyncHandler(async (req, res) => {
  const { signedTransaction } = req.body as { signedTransaction: string };
  try {
    const signature = await submitSignedTransaction(signedTransaction);
    res.json({ signature, network: "solana-devnet" });
  } catch (error) {
    const message = (error as Error).message || "Unknown Solana submission error";
    if (message.includes("Blockhash not found")) {
      return res.status(409).json({
        error: message,
        code: "BLOCKHASH_EXPIRED",
        retryable: true
      });
    }
    throw error;
  }
}));
