export const AUTH0_SCOPES = {
  readEnergy: "read:energy",
  writeThermostat: "write:thermostat",
  readNeighborhood: "read:neighborhood"
} as const;

export type ConsentPreferences = {
  allowAgentReadEnergy: boolean;
  allowAgentThermostatWrites: boolean;
  allowNeighborhoodComparison: boolean;
};

export function defaultConsent(): ConsentPreferences {
  return {
    allowAgentReadEnergy: true,
    allowAgentThermostatWrites: false,
    allowNeighborhoodComparison: true
  };
}
