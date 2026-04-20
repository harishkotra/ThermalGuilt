import { Router } from "express";
import { createDemoJwt } from "../services/auth0.js";

export const authRouter = Router();

authRouter.post("/login", (_req, res) => {
  const token = createDemoJwt(["read:energy", "read:neighborhood", "write:thermostat"]);
  res.json({ accessToken: token, tokenType: "Bearer", expiresIn: 3600 });
});

authRouter.post("/callback", (_req, res) => {
  res.json({ ok: true, message: "Auth0 callback accepted." });
});

authRouter.get("/me", (req, res) => {
  res.json(req.authUser);
});
