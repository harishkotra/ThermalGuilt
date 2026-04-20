import { classifyGhost, computeZScore, isShameRed } from "@thermal-guilt/shared";
import type { EnergySummary } from "../types.js";

export function buildEnergySummary(currentKwh: number, mean: number, stdDev: number): EnergySummary {
  const zScore = computeZScore(currentKwh, mean, stdDev);
  const normalized = Math.max(0, Math.min(100, Math.round(100 - zScore * 15)));

  return {
    currentKwh,
    neighborhoodMean: mean,
    neighborhoodStdDev: stdDev,
    zScore,
    score: normalized,
    ghostType: classifyGhost(normalized),
    shameRed: isShameRed(currentKwh, mean, stdDev)
  };
}
