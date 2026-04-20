import cors, { type CorsOptions } from "cors";
import express from "express";
import helmet from "helmet";
import { attachAuth } from "./middleware/auth.js";
import { authRouter } from "./routes/auth.js";
import { apiRouter } from "./routes/index.js";

export const app = express();

const configuredOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const defaultOrigins = [
  "http://localhost:3000",
  "https://thermal-guilt-web.vercel.app"
];

const allowedOrigins = configuredOrigins.length ? configuredOrigins : defaultOrigins;

function isAllowedOrigin(origin: string) {
  if (allowedOrigins.includes(origin)) return true;
  if (origin.endsWith(".vercel.app") && origin.includes("thermal-guilt-web")) return true;
  return false;
}

app.use(helmet());
const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "2mb" }));
app.use(attachAuth);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "thermal-guilt-api", timestamp: new Date().toISOString() });
});

app.use("/auth", authRouter);
app.use("/api", apiRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : "Internal server error";
  res.status(500).json({ error: message });
});
