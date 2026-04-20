import { randomUUID } from "node:crypto";
import type { EnergyReading } from "../domain.js";

const users = ["u_alex", "u_jo", "u_sam", "u_taylor", "u_casey"];

export function generateCurrentUsage(userId: string): number {
  const hour = new Date().getHours();
  const peakFactor = hour >= 13 && hour <= 19 ? 1.25 : 0.9;
  return Number((3 + Math.random() * 4 * peakFactor).toFixed(2));
}

export function generateHourlyHistory(userId: string, neighborhoodId: string, hours = 72): EnergyReading[] {
  const now = Date.now();

  return Array.from({ length: hours }, (_, i) => {
    const timestamp = new Date(now - (hours - i) * 3600_000);
    const hour = timestamp.getHours();
    const temp = 68 + Math.sin(hour / 24 * Math.PI * 2) * 12 + Math.random() * 2;
    const hvacStatus = temp > 74 ? "cooling" : temp < 62 ? "heating" : "off";
    const baseline = hvacStatus === "off" ? 1.8 : 3.1;

    return {
      readingId: randomUUID(),
      userId,
      neighborhoodId,
      timestamp: timestamp.toISOString(),
      energyKwh: Number((baseline + Math.random() * 2.8).toFixed(3)),
      temperatureF: Number(temp.toFixed(2)),
      humidityPercent: Number((30 + Math.random() * 45).toFixed(2)),
      hvacStatus,
      source: "simulated"
    };
  });
}

export function generateNeighborhoodSnapshot(neighborhoodId: string) {
  const samples = users.map((u) => generateCurrentUsage(u));
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const variance = samples.reduce((acc, x) => acc + (x - mean) ** 2, 0) / samples.length;

  return {
    neighborhoodId,
    samples,
    mean: Number(mean.toFixed(2)),
    stdDev: Number(Math.sqrt(variance).toFixed(2))
  };
}
