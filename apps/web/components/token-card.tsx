"use client";

import { useEffect, useMemo, useState } from "react";
import { Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { apiGet, apiPost } from "../lib/api";

type Balance = {
  walletAddress: string;
  balance: number;
};

type ClaimTx = {
  serializedTransaction: string;
  reward: number;
};

export function TokenCard({ score }: { score: number }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const walletAddress = useMemo(() => wallet.publicKey?.toBase58(), [wallet.publicKey]);

  const [balance, setBalance] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("Connect wallet to view and claim $COOL.");
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!walletAddress) {
      setBalance(null);
      return;
    }

    apiGet<Balance>(`/api/solana/balance/${walletAddress}`)
      .then((res) => setBalance(res.balance))
      .catch(() => setBalance(null));
  }, [walletAddress]);

  async function claim() {
    if (!walletAddress || !wallet.signTransaction) {
      setStatus("Wallet must support transaction signing.");
      return;
    }

    setClaiming(true);
    setStatus("Building devnet claim transaction...");

    try {
      const txPayload = await apiPost<ClaimTx>("/api/solana/claim/transaction", { walletAddress, score });
      const tx = Transaction.from(Buffer.from(txPayload.serializedTransaction, "base64"));
      const signed = await wallet.signTransaction(tx);
      const signedB64 = signed.serialize().toString("base64");

      setStatus("Submitting signed transaction...");
      const { signature } = await apiPost<{ signature: string }>("/api/solana/claim/submit", {
        signedTransaction: signedB64
      });

      await connection.confirmTransaction(signature, "confirmed");
      const refreshed = await apiGet<Balance>(`/api/solana/balance/${walletAddress}`);
      setBalance(refreshed.balance);
      setStatus(`Claimed ${txPayload.reward} COOL on devnet. Tx: ${signature.slice(0, 12)}...`);
    } catch (error) {
      setStatus(`Claim failed: ${(error as Error).message}`);
    } finally {
      setClaiming(false);
    }
  }

  return (
    <section className="card p-5">
      <h2 className="text-sm uppercase tracking-[0.18em] text-slate-300">$COOL Wallet</h2>
      <div className="mt-3">
        <WalletMultiButton className="!bg-mint !text-slate-900" />
      </div>
      <p className="mt-3 text-3xl font-semibold text-mint">{balance !== null ? balance.toFixed(2) : "--"}</p>
      <p className="text-sm text-slate-300">Devnet token balance</p>
      <button
        type="button"
        onClick={claim}
        disabled={!wallet.connected || claiming}
        className="mt-3 rounded-lg bg-frost px-3 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
      >
        {claiming ? "Claiming..." : "Claim Weekly Reward"}
      </button>
      <p className="mt-2 text-xs text-slate-300">{status}</p>
    </section>
  );
}
