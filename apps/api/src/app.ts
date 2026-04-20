import cors from "cors";
import express from "express";
import helmet from "helmet";
import { attachAuth } from "./middleware/auth.js";
import { authRouter } from "./routes/auth.js";
import { apiRouter } from "./routes/index.js";

export const app = express();

app.use(helmet());
app.use(cors());
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
