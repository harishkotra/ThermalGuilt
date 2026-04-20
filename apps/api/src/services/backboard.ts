import { buildEnergySummary } from "../utils/score.js";
import { config } from "../config.js";

type ChatInput = {
  userId: string;
  message: string;
  score: number;
  ghostType: string;
};

async function backboardRequest<T>(path: string, body: object): Promise<T> {
  if (!config.backboard.apiKey) {
    throw new Error("BACKBOARD_API_KEY is not configured");
  }

  const response = await fetch(`${config.backboard.baseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.backboard.apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Backboard API failed: ${text}`);
  }

  return response.json() as Promise<T>;
}

export async function chatWithThermalCoach(input: ChatInput) {
  const localFallback = {
    assistant: "ThermalCoach",
    roastLevel: input.score < 50 ? "high" : "gentle",
    reply: input.score < 50
      ? `Your ghost is flashing ${input.ghostType} territory. Drop thermostat cycling and pre-cool before peak hours.`
      : `Nice work. You're holding ${input.ghostType} form. Keep it steady and stack streak days for COOL rewards.`,
    memoryFacts: ["User prefers 72F weekdays", "Works from home Wednesdays"]
  };

  if (!config.backboard.apiKey || config.testMode) {
    return localFallback;
  }

  try {
    const data = await backboardRequest<{ output?: { text?: string }; memory?: string[] }>(
      `/assistants/${config.backboard.assistantId}/chat`,
      {
        thread: { user_id: input.userId },
        messages: [{ role: "user", content: input.message }],
        metadata: {
          score: input.score,
          ghostType: input.ghostType
        }
      }
    );

    return {
      assistant: "ThermalCoach",
      roastLevel: input.score < 50 ? "high" : "gentle",
      reply: data.output?.text || localFallback.reply,
      memoryFacts: data.memory || []
    };
  } catch {
    return localFallback;
  }
}

export async function generateGhostAnalysis(currentKwh: number, neighborhoodMean: number, stdDev: number) {
  const summary = buildEnergySummary(currentKwh, neighborhoodMean, stdDev);

  const localFallback = {
    summary,
    narrative: `You're a ${summary.shameRed ? "Thermal Vampire" : summary.ghostType}. Current load sits at ${summary.zScore.toFixed(2)}σ vs neighborhood baseline.`,
    tips: [
      "Shift cooling 30 minutes earlier to avoid peak-hour compressor bursts.",
      "Increase setpoint by 1°F from 3pm-7pm.",
      "Replace filter if AC cycle interval is under 10 minutes."
    ]
  };

  if (!config.backboard.apiKey || config.testMode) {
    return localFallback;
  }

  try {
    const data = await backboardRequest<{ output?: { text?: string }; tips?: string[] }>(
      `/assistants/${config.backboard.assistantId}/run`,
      {
        inputs: {
          currentKwh,
          neighborhoodMean,
          stdDev,
          zScore: summary.zScore,
          ghostType: summary.ghostType
        },
        instruction: "Generate thermal ghost narrative and three concrete HVAC optimization tips."
      }
    );

    return {
      summary,
      narrative: data.output?.text || localFallback.narrative,
      tips: data.tips || localFallback.tips
    };
  } catch {
    return localFallback;
  }
}
