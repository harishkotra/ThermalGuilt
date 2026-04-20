import { Router } from "express";
import multer from "multer";
import { chatWithThermalCoach, generateGhostAnalysis } from "../services/backboard.js";
import { analyzeEnergyWithGemini } from "../services/gemini.js";
import { fetchNeighborhoodStats } from "../services/snowflake.js";
import { generateCurrentUsage } from "../services/simulatedMeter.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const upload = multer({ storage: multer.memoryStorage() });

export const aiRouter = Router();

aiRouter.post("/chat", asyncHandler(async (req, res) => {
  const user = req.authUser!;
  const { message } = req.body as { message?: string };

  try {
    const stats = await fetchNeighborhoodStats(user.neighborhoodId);
    const currentKwh = generateCurrentUsage(user.userId);
    const score = Math.max(0, Math.min(100, Math.round(100 - ((currentKwh - stats.avgEnergyKwh) / stats.stdDevEnergy) * 15)));
    const ghostType = score < 25 ? "Inferno" : score < 50 ? "Thermal Vampire" : score < 75 ? "Warm Hug" : score < 95 ? "Cool Cat" : "Ice Queen";

    const response = await chatWithThermalCoach({
      userId: user.userId,
      message: message || "Give me a quick thermal coaching tip.",
      score,
      ghostType
    });
    res.json(response);
  } catch {
    res.json({
      assistant: "ThermalCoach",
      roastLevel: "gentle",
      reply: "Coach services are temporarily degraded. Quick win: raise setpoint by 1°F during peak hours (3pm-7pm).",
      memoryFacts: []
    });
  }
}));

aiRouter.get("/ghost-analysis", asyncHandler(async (req, res) => {
  const user = req.authUser!;
  const stats = await fetchNeighborhoodStats(user.neighborhoodId);
  const currentKwh = generateCurrentUsage(user.userId);
  const ghost = await generateGhostAnalysis(currentKwh, stats.avgEnergyKwh, stats.stdDevEnergy);
  const gemini = await analyzeEnergyWithGemini({
    currentKwh,
    neighborhoodMean: stats.avgEnergyKwh,
    stdDev: stats.stdDevEnergy,
    weatherSummary: "Hot and humid afternoon"
  });

  res.json({ ...ghost, gemini });
}));

aiRouter.post("/bill-upload", upload.single("bill"), asyncHandler(async (req, res) => {
  const filename = req.file?.originalname || "unknown.pdf";
  const size = req.file?.size || 0;

  res.json({
    parsed: true,
    filename,
    bytes: size,
    extractedInsights: [
      "Average monthly cooling load increased 12% since June.",
      "Peak demand spikes around 5pm on weekdays."
    ]
  });
}));
