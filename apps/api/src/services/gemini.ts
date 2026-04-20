import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { config } from "../config.js";

const GhostReportSchema = z.object({
  thermalPersonality: z.string(),
  anomaly: z.string(),
  recommendation: z.array(z.string())
});

const geminiClient = config.geminiApiKey ? new GoogleGenerativeAI(config.geminiApiKey) : null;

export async function analyzeEnergyWithGemini(input: {
  currentKwh: number;
  neighborhoodMean: number;
  stdDev: number;
  weatherSummary: string;
}) {
  if (!geminiClient || config.testMode) {
    const zScore = input.stdDev ? (input.currentKwh - input.neighborhoodMean) / input.stdDev : 0;
    return GhostReportSchema.parse({
      thermalPersonality: zScore > 2
        ? `Thermal Vampire at ${zScore.toFixed(1)}σ above neighborhood average`
        : "Cool Cat cruising near neighborhood baseline",
      anomaly: zScore > 1.5
        ? "AC runtime appears elevated compared to similar homes"
        : "No major anomaly detected",
      recommendation: [
        "Enable 2°F setback during midday peak window",
        "Tune fan cycle to reduce short cycling",
        `Weather note: ${input.weatherSummary}`
      ]
    });
  }

  const model = geminiClient.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = `
Analyze home energy vs neighborhood and respond in strict JSON.
Fields: thermalPersonality:string, anomaly:string, recommendation:string[]
Input:
- currentKwh: ${input.currentKwh}
- neighborhoodMean: ${input.neighborhoodMean}
- stdDev: ${input.stdDev}
- weatherSummary: ${input.weatherSummary}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const jsonText = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    const parsed = JSON.parse(jsonText) as unknown;
    return GhostReportSchema.parse(parsed);
  } catch {
    throw new Error(`Gemini response was not valid JSON: ${text}`);
  }
}
