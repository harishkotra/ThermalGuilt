import snowflake from "snowflake-sdk";
import type { EnergyReading } from "../domain.js";
import { config } from "../config.js";
import { generateHourlyHistory, generateNeighborhoodSnapshot } from "./simulatedMeter.js";

type SnowflakeConnection = snowflake.Connection;
let cachedConnection: SnowflakeConnection | null = null;

function hasSnowflakeConfig() {
  if (!config.snowflake.enabled) return false;
  const s = config.snowflake;
  return Boolean(s.account && s.username && s.password && s.database && s.schema && s.warehouse);
}

function getConnection(): Promise<SnowflakeConnection> {
  if (cachedConnection) return Promise.resolve(cachedConnection);

  return new Promise((resolve, reject) => {
    const conn = snowflake.createConnection({
      account: config.snowflake.account,
      username: config.snowflake.username,
      password: config.snowflake.password,
      database: config.snowflake.database,
      schema: config.snowflake.schema,
      warehouse: config.snowflake.warehouse
    });

    conn.connect((err) => {
      if (err) {
        reject(err);
        return;
      }
      cachedConnection = conn;
      resolve(conn);
    });
  });
}

async function execute<T = Record<string, unknown>>(sqlText: string, binds: (string | number | boolean | null)[] = []): Promise<T[]> {
  const conn = await getConnection();
  return new Promise<T[]>((resolve, reject) => {
    conn.execute({
      sqlText,
      binds: binds as never,
      complete: (err, _stmt, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve((rows || []) as T[]);
      }
    });
  });
}

export async function fetchEnergyHistory(userId: string, neighborhoodId: string): Promise<EnergyReading[]> {
  if (!hasSnowflakeConfig() || config.testMode) {
    return generateHourlyHistory(userId, neighborhoodId, 24 * 14);
  }

  const rows = await execute<Record<string, unknown>>(
    `SELECT reading_id, user_id, neighborhood_id, timestamp, energy_kwh, temperature_f, humidity_percent, hvac_status, source
     FROM energy_readings
     WHERE user_id = ? AND neighborhood_id = ?
     ORDER BY timestamp DESC
     LIMIT 336`,
    [userId, neighborhoodId]
  );

  return rows.map((row) => ({
    readingId: String(row.READING_ID),
    userId: String(row.USER_ID),
    neighborhoodId: String(row.NEIGHBORHOOD_ID),
    timestamp: new Date(String(row.TIMESTAMP)).toISOString(),
    energyKwh: Number(row.ENERGY_KWH),
    temperatureF: Number(row.TEMPERATURE_F),
    humidityPercent: Number(row.HUMIDITY_PERCENT),
    hvacStatus: String(row.HVAC_STATUS) as EnergyReading["hvacStatus"],
    source: String(row.SOURCE) as EnergyReading["source"]
  }));
}

export async function fetchLeaderboard(neighborhoodId: string) {
  if (!hasSnowflakeConfig() || config.testMode) {
    const handles = ["@coolcat_42", "@frostbyte", "@eco_owl", "@vent_sense", "@quiet_compressor", "@thermal_hero"];
    return handles.map((handle, idx) => ({
      rank: idx + 1,
      handle,
      efficiencyScore: Math.max(40, 98 - idx * 7),
      tokensEarned: [100, 50, 50, 20, 20, 5][idx] || 0,
      ghostType: ["Ice Queen", "Cool Cat", "Cool Cat", "Warm Hug", "Warm Hug", "Thermal Vampire"][idx]
    }));
  }

  const rows = await execute<Record<string, unknown>>(
    `SELECT rank, user_id, efficiency_score, tokens_earned, thermal_ghost_type
     FROM leaderboard
     WHERE neighborhood_id = ?
       AND week_start = DATE_TRUNC('WEEK', CURRENT_DATE())
     ORDER BY rank ASC
     LIMIT 10`,
    [neighborhoodId]
  );

  return rows.map((row) => ({
    rank: Number(row.RANK),
    handle: `@${String(row.USER_ID).slice(0, 10)}`,
    efficiencyScore: Number(row.EFFICIENCY_SCORE),
    tokensEarned: Number(row.TOKENS_EARNED),
    ghostType: String(row.THERMAL_GHOST_TYPE)
  }));
}

export async function fetchNeighborhoodStats(neighborhoodId: string) {
  if (!hasSnowflakeConfig() || config.testMode) {
    const snapshot = generateNeighborhoodSnapshot(neighborhoodId);
    return {
      neighborhoodId,
      avgEnergyKwh: snapshot.mean,
      stdDevEnergy: snapshot.stdDev,
      percentile25: Number((snapshot.mean - snapshot.stdDev * 0.65).toFixed(2)),
      percentile75: Number((snapshot.mean + snapshot.stdDev * 0.65).toFixed(2)),
      activeUsers: snapshot.samples.length,
      weatherAvgTemp: 78.2
    };
  }

  const rows = await execute<Record<string, unknown>>(
    `SELECT neighborhood_id, avg_energy_kwh, std_dev_energy, percentile_25, percentile_75, active_users, weather_avg_temp
     FROM neighborhood_stats
     WHERE neighborhood_id = ?
       AND date = CURRENT_DATE()
     LIMIT 1`,
    [neighborhoodId]
  );

  if (!rows.length) {
    throw new Error(`No neighborhood stats found for ${neighborhoodId}`);
  }

  const row = rows[0];
  return {
    neighborhoodId: String(row.NEIGHBORHOOD_ID),
    avgEnergyKwh: Number(row.AVG_ENERGY_KWH),
    stdDevEnergy: Number(row.STD_DEV_ENERGY),
    percentile25: Number(row.PERCENTILE_25),
    percentile75: Number(row.PERCENTILE_75),
    activeUsers: Number(row.ACTIVE_USERS),
    weatherAvgTemp: Number(row.WEATHER_AVG_TEMP)
  };
}
