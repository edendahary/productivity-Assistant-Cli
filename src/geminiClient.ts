import { GoogleGenerativeAI } from "@google/generative-ai";
import { ConversationState, WeatherInfo, Quote } from "./types";

const MODEL_NAME = "gemini-2.5-flash";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("[geminiClient] Missing GEMINI_API_KEY in .env");
}

const genAI = new GoogleGenerativeAI(apiKey!);

export type LlmMode = "DAY_SUMMARY" | "SMALL_TALK" | "DAILY_RECOMMENDATION";

interface AskGeminiParams {
  state: ConversationState;
  userInput: string;
  mode: LlmMode;
  weather?: WeatherInfo | null;
  quote?: Quote | null;
}

function buildSystemPrompt(): string {
  return `
You are a helpful and concise Productivity Assistant.

Rules:
- Give practical, short, structured answers.
- Never invent data. If weather or quote is missing, say so.
- If the user input is unclear, ask for clarification.
- Stay friendly, positive, and useful.
  `.trim();
}

function buildModeInstruction(
  mode: LlmMode,
  weather?: WeatherInfo | null,
  quote?: Quote | null
): string {
  if (mode === "DAY_SUMMARY") {
    return `
The user is asking for a summary of their day.

Steps:
1. Summarize the day in 1-2 sentences.
2. Identify strengths.
3. Identify areas for improvement.
4. Suggest 2-3 actionable productivity tips for tomorrow.

Do NOT hallucinate.  
  `.trim();
  }

  if (mode === "DAILY_RECOMMENDATION") {
    return `
Generate a daily productivity recommendation.

Weather info:
- Weather: ${weather ? weather.description : "unknown"}
- Temperature: ${weather ? weather.temperatureC + "°C" : "unknown"}
- Raining: ${weather ? weather.isRaining : "unknown"}
- City: ${weather ? weather.city : "unknown"}

Quote:
- ${quote ? `"${quote.text}" - ${quote.author}` : "No quote available"}

Rules:
- If any data is missing, say so explicitly.
- Do not invent weather or quotes.
- Give clear, helpful advice for planning the day.

  `.trim();
  }

  return `
The user is asking a general question.

Answer briefly, helpfully, and stay in the domain of:
- Productivity
- Motivation
- Time management
- Light friendly conversation

Do NOT hallucinate facts.
  `.trim();
}

export async function askGemini({
  state,
  userInput,
  mode,
  weather,
  quote,
}: AskGeminiParams): Promise<string> {
  try {
    const prompt = `
${buildSystemPrompt()}

${buildModeInstruction(mode, weather, quote)}

Conversation history:
${state.history.map((h) => `${h.role}: ${h.content}`).join("\n")}

User: ${userInput}
Assistant:
    `.trim();

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    if (!text) return "Sorry, I couldn't generate a response.";
    return text.trim();
  } catch (err: any) {
    console.error("askGemini Error:", err?.message ?? err);
    return "Sorry - Gemini API failed. Try again later.";
  }
}
