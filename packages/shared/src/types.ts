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

export type NeighborhoodStat = {
  neighborhoodId: string;
  date: string;
  avgEnergyKwh: number;
  stdDevEnergy: number;
  percentile25: number;
  percentile75: number;
  activeUsers: number;
  weatherAvgTemp: number;
};
