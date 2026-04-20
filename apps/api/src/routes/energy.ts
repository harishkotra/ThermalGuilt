import { Router } from "express";
import { fetchEnergyHistory, fetchNeighborhoodStats } from "../services/snowflake.js";
import { generateCurrentUsage } from "../services/simulatedMeter.js";
import { buildEnergySummary } from "../utils/score.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const energyRouter = Router();

energyRouter.get("/current", asyncHandler(async (req, res) => {
  const user = req.authUser!;
  const currentKwh = generateCurrentUsage(user.userId);
  const stats = await fetchNeighborhoodStats(user.neighborhoodId);
  const summary = buildEnergySummary(currentKwh, stats.avgEnergyKwh, stats.stdDevEnergy);

  res.json({ userId: user.userId, summary });
}));

energyRouter.get("/history", asyncHandler(async (req, res) => {
  const user = req.authUser!;
  const rows = await fetchEnergyHistory(user.userId, user.neighborhoodId);
  res.json({ rows });
}));

energyRouter.get("/neighborhood", asyncHandler(async (req, res) => {
  const user = req.authUser!;
  const stats = await fetchNeighborhoodStats(user.neighborhoodId);
  res.json(stats);
}));
