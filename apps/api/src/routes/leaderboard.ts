import { Router } from "express";
import { fetchLeaderboard } from "../services/snowflake.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const leaderboardRouter = Router();

leaderboardRouter.get("/neighborhood/:id", asyncHandler(async (req, res) => {
  const neighborhoodId = String(req.params.id);
  const rows = await fetchLeaderboard(neighborhoodId);
  res.json({ neighborhoodId, rows: rows.slice(0, 10) });
}));

leaderboardRouter.get("/global", asyncHandler(async (_req, res) => {
  const rows = await fetchLeaderboard("global-demo");
  res.json({ rows: rows.map((r, idx) => ({ ...r, rank: idx + 1 })) });
}));

leaderboardRouter.get("/me", asyncHandler(async (req, res) => {
  const user = req.authUser!;
  const rows = await fetchLeaderboard(user.neighborhoodId);
  const me = rows.find((row) => row.handle === user.handle) || { rank: 11, handle: user.handle, efficiencyScore: 48, tokensEarned: 0, ghostType: "Thermal Vampire" };
  res.json(me);
}));
