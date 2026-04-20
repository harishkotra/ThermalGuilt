export type GhostType = "Ice Queen" | "Cool Cat" | "Warm Hug" | "Thermal Vampire" | "Inferno";

export type EnergyReading = {
  readingId: string;
  userId: string;
  neighborhoodId: string;
  timestamp: string;
  energyKwh: number;
  temperatureF: number;
  humidityPercent: number;
  hvacStatus: "heating" | "cooling" | "off";
  source: "smart_meter" | "manual_entry" | "simulated";
};

export function computeZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

export function classifyGhost(score: number): GhostType {
  if (score >= 95) return "Ice Queen";
  if (score >= 75) return "Cool Cat";
  if (score >= 50) return "Warm Hug";
  if (score >= 25) return "Thermal Vampire";
  return "Inferno";
}

export function scoreToTokenReward(score: number): number {
  if (score >= 95) return 100;
  if (score >= 85) return 50;
  if (score >= 70) return 20;
  if (score >= 50) return 5;
  return 0;
}

export function isShameRed(currentUsage: number, neighborhoodMean: number, stdDev: number): boolean {
  return computeZScore(currentUsage, neighborhoodMean, stdDev) > 2;
}
