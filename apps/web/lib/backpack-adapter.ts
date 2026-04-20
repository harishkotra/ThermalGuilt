"use client";

import {
  BaseMessageSignerWalletAdapter,
  WalletNotConnectedError,
  WalletReadyState,
  type WalletName
} from "@solana/wallet-adapter-base";
import { PublicKey } from "@solana/web3.js";

type BackpackProvider = {
  isBackpack?: boolean;
  publicKey?: { toBase58(): string };
  connect(): Promise<{ publicKey: { toBase58(): string } }>;
  disconnect(): Promise<void>;
  signTransaction<T>(transaction: T): Promise<T>;
  signAllTransactions?<T>(transactions: T[]): Promise<T[]>;
  signMessage(message: Uint8Array): Promise<Uint8Array>;
};

function getProvider(): BackpackProvider | null {
  if (typeof window === "undefined") return null;
  const candidate = (window as Window & { backpack?: { solana?: BackpackProvider } }).backpack?.solana;
  return candidate && candidate.isBackpack ? candidate : null;
}

export class BackpackAdapter extends BaseMessageSignerWalletAdapter<"Backpack"> {
  name = "Backpack" as WalletName<"Backpack">;
  url = "https://backpack.app";
  icon = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMzInIGhlaWdodD0nMzInIHZpZXdCb3g9JzAgMCAzMiAzMicgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJz48cmVjdCB3aWR0aD0nMzInIGhlaWdodD0nMzInIHJ4PSc4JyBmaWxsPScjRkY1QzM5Jy8+PHBhdGggZD0nTTggMTJoMTZ2OGgtMTZ6JyBmaWxsPScjMTAxMDEwJy8+PC9zdmc+";
  readonly supportedTransactionVersions = null;

  #publicKey: PublicKey | null = null;
  #connecting = false;

  get publicKey() {
    return this.#publicKey;
  }

  get connecting() {
    return this.#connecting;
  }

  get readyState() {
    if (typeof window === "undefined") return WalletReadyState.Unsupported;
    return getProvider() ? WalletReadyState.Installed : WalletReadyState.NotDetected;
  }

  async connect() {
    if (this.connected || this.connecting) return;
    const provider = getProvider();
    if (!provider) {
      throw new Error("Backpack wallet not detected.");
    }

    this.#connecting = true;
    try {
      const result = await provider.connect();
      this.#publicKey = new PublicKey(result.publicKey.toBase58());
      this.emit("connect", this.#publicKey);
    } finally {
      this.#connecting = false;
    }
  }

  async disconnect() {
    const provider = getProvider();
    if (provider) await provider.disconnect();
    this.#publicKey = null;
    this.emit("disconnect");
  }

  async signTransaction<T>(transaction: T): Promise<T> {
    const provider = getProvider();
    if (!provider || !this.publicKey) throw new WalletNotConnectedError();
    return provider.signTransaction(transaction);
  }

  async signAllTransactions<T>(transactions: T[]): Promise<T[]> {
    const provider = getProvider();
    if (!provider || !this.publicKey) throw new WalletNotConnectedError();
    if (provider.signAllTransactions) return provider.signAllTransactions(transactions);

    const signed: T[] = [];
    for (const tx of transactions) {
      signed.push(await provider.signTransaction(tx));
    }
    return signed;
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    const provider = getProvider();
    if (!provider || !this.publicKey) throw new WalletNotConnectedError();
    return provider.signMessage(message);
  }
}
