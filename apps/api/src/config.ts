import dotenv from "dotenv";

dotenv.config();

function boolFromEnv(key: string, fallback = false) {
  const value = process.env[key];
  if (!value) return fallback;
  return value.toLowerCase() === "true";
}

const rpc = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
if (!rpc.includes("devnet")) {
  throw new Error("SOLANA_RPC_URL must point to DEVNET only.");
}

export const config = {
  port: Number(process.env.PORT || 3001),
  nodeEnv: process.env.NODE_ENV || "development",
  testMode: boolFromEnv("TEST_MODE", false),
  auth0: {
    domain: process.env.AUTH0_DOMAIN || "",
    audience: process.env.AUTH0_AUDIENCE || "",
    clientId: process.env.AUTH0_CLIENT_ID || "",
    clientSecret: process.env.AUTH0_CLIENT_SECRET || "",
    agentClientId: process.env.AUTH0_AI_AGENT_CLIENT_ID || "",
    agentClientSecret: process.env.AUTH0_AI_AGENT_CLIENT_SECRET || "",
    namespace: process.env.AUTH0_NAMESPACE || "https://thermal-guilt"
  },
  backboard: {
    baseUrl: process.env.BACKBOARD_BASE_URL || "https://app.backboard.io/api",
    apiKey: process.env.BACKBOARD_API_KEY || "",
    assistantId: process.env.BACKBOARD_ASSISTANT_ID || "thermal_coach_id"
  },
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  snowflake: {
    enabled: boolFromEnv("SNOWFLAKE_ENABLED", false),
    account: process.env.SNOWFLAKE_ACCOUNT || "",
    username: process.env.SNOWFLAKE_USERNAME || "",
    password: process.env.SNOWFLAKE_PASSWORD || "",
    database: process.env.SNOWFLAKE_DATABASE || "THERMAL_GUILT",
    schema: process.env.SNOWFLAKE_SCHEMA || "PUBLIC",
    warehouse: process.env.SNOWFLAKE_WAREHOUSE || "COMPUTE_WH"
  },
  solana: {
    rpcUrl: rpc,
    privateKey: process.env.SOLANA_PRIVATE_KEY || "",
    coolMint: process.env.COOL_TOKEN_MINT || "",
    programId: process.env.PROGRAM_ID || ""
  }
};
