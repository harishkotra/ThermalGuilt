import { beforeAll, describe, expect, it, vi } from "vitest";
import { createRequest, createResponse } from "node-mocks-http";

process.env.TEST_MODE = "true";

vi.mock("../src/services/solana.js", () => ({
  mintCoolTokens: vi.fn(async (walletAddress: string, amount: number) => ({
    walletAddress,
    amount,
    transactionSignature: "mint_sig_test",
    network: "solana-devnet"
  })),
  getCoolBalance: vi.fn(async (walletAddress: string) => ({
    walletAddress,
    balance: 42,
    mint: "So11111111111111111111111111111111111111112"
  })),
  claimWeeklyTokens: vi.fn(async (walletAddress: string, score: number) => ({
    walletAddress,
    score,
    tokens: 20,
    serializedTransaction: "base64tx",
    network: "solana-devnet"
  })),
  buildClaimTransaction: vi.fn(async () => ({
    serializedTransaction: "base64tx",
    reward: 20,
    blockhash: "abc",
    lastValidBlockHeight: 1
  })),
  submitSignedTransaction: vi.fn(async () => "sig_test")
}));

let app: Awaited<ReturnType<typeof import("../src/app.js")>>["app"];

beforeAll(async () => {
  ({ app } = await import("../src/app.js"));
});

async function invoke(method: "GET" | "POST", url: string, body?: unknown) {
  const req = createRequest({ method, url, body });
  const res = createResponse({ eventEmitter: await import("events").then((m) => m.EventEmitter) });

  await new Promise<void>((resolve) => {
    res.on("end", () => resolve());
    res.on("finish", () => resolve());
    app.handle(req, res, () => resolve());
  });

  const data = res._getData();
  return {
    status: res.statusCode,
    body: typeof data === "string" && data.length ? JSON.parse(data) : data
  };
}

describe("Thermal Guilt API integration", () => {
  it("GET /health returns ok", async () => {
    const response = await invoke("GET", "/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  it("GET /api/energy/current returns summary", async () => {
    const response = await invoke("GET", "/api/energy/current");
    expect(response.status).toBe(200);
    expect(response.body.summary).toHaveProperty("score");
    expect(response.body.summary).toHaveProperty("ghostType");
  });

  it("GET /api/ai/ghost-analysis returns gemini + ghost", async () => {
    const response = await invoke("GET", "/api/ai/ghost-analysis");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("summary");
    expect(response.body).toHaveProperty("gemini");
  });

  it("POST /api/solana/claim/transaction returns wallet-sign payload", async () => {
    const response = await invoke("POST", "/api/solana/claim/transaction", {
      walletAddress: "DemoWallet11111111111111111111111111111111",
      score: 88
    });

    expect(response.status).toBe(200);
    expect(response.body.serializedTransaction).toBeTypeOf("string");
    expect(response.body.reward).toBeGreaterThanOrEqual(0);
  });

  it("POST /api/solana/claim/submit returns signature", async () => {
    const response = await invoke("POST", "/api/solana/claim/submit", { signedTransaction: "abc" });
    expect(response.status).toBe(200);
    expect(response.body.signature).toBe("sig_test");
  });
});
