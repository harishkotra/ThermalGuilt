import type { GhostType } from "./domain.js";

export type AuthUser = {
  userId: string;
  handle: string;
  neighborhoodId: string;
  zipCode: string;
  walletAddress?: string;
};

export type EnergySummary = {
  currentKwh: number;
  neighborhoodMean: number;
  neighborhoodStdDev: number;
  zScore: number;
  score: number;
  ghostType: GhostType;
  shameRed: boolean;
};
