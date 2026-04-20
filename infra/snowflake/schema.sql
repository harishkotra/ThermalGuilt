CREATE OR REPLACE TABLE energy_readings (
    reading_id STRING PRIMARY KEY,
    user_id STRING,
    neighborhood_id STRING,
    timestamp TIMESTAMP_NTZ,
    energy_kwh DECIMAL(10,4),
    temperature_f DECIMAL(5,2),
    humidity_percent DECIMAL(5,2),
    hvac_status STRING,
    source STRING
);

CREATE OR REPLACE TABLE neighborhood_stats (
    neighborhood_id STRING,
    date DATE,
    avg_energy_kwh DECIMAL(10,4),
    std_dev_energy DECIMAL(10,4),
    percentile_25 DECIMAL(10,4),
    percentile_75 DECIMAL(10,4),
    active_users INTEGER,
    weather_avg_temp DECIMAL(5,2)
);

CREATE OR REPLACE TABLE leaderboard (
    user_id STRING,
    neighborhood_id STRING,
    week_start DATE,
    efficiency_score DECIMAL(5,2),
    tokens_earned INTEGER,
    rank INTEGER,
    thermal_ghost_type STRING
);

CREATE OR REPLACE DYNAMIC TABLE neighborhood_stats_daily
TARGET_LAG = '5 minutes'
WAREHOUSE = COMPUTE_WH
AS
SELECT
  neighborhood_id,
  CAST(timestamp AS DATE) AS date,
  AVG(energy_kwh) AS avg_energy_kwh,
  STDDEV(energy_kwh) AS std_dev_energy,
  APPROX_PERCENTILE(energy_kwh, 0.25) AS percentile_25,
  APPROX_PERCENTILE(energy_kwh, 0.75) AS percentile_75,
  COUNT(DISTINCT user_id) AS active_users,
  AVG(temperature_f) AS weather_avg_temp
FROM energy_readings
GROUP BY 1,2;

CREATE OR REPLACE STREAM energy_readings_stream ON TABLE energy_readings;

CREATE OR REPLACE TASK leaderboard_refresh_task
  SCHEDULE = 'USING CRON 0 0 * * MON America/Los_Angeles'
  WAREHOUSE = COMPUTE_WH
AS
MERGE INTO leaderboard t
USING (
  SELECT
    user_id,
    neighborhood_id,
    DATE_TRUNC('WEEK', timestamp)::DATE AS week_start,
    LEAST(100, GREATEST(0, 100 - (((AVG(energy_kwh) - AVG(avg_energy_kwh) OVER (PARTITION BY neighborhood_id))
      / NULLIF(STDDEV(energy_kwh) OVER (PARTITION BY neighborhood_id), 0)) * 15)))::DECIMAL(5,2) AS efficiency_score
  FROM energy_readings
  GROUP BY 1,2,3
) s
ON t.user_id = s.user_id AND t.week_start = s.week_start
WHEN MATCHED THEN UPDATE SET efficiency_score = s.efficiency_score
WHEN NOT MATCHED THEN INSERT (user_id, neighborhood_id, week_start, efficiency_score, tokens_earned, rank, thermal_ghost_type)
VALUES (s.user_id, s.neighborhood_id, s.week_start, s.efficiency_score, 0, 0, 'Warm Hug');
