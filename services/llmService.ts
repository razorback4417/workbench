import { GoogleGenAI } from "@google/genai";
import { ModelType } from "../types";
import { storage } from "./storage";

export interface LLMResponse {
  text: string;
  latency: number;
  cost: number;
  tokens: number;
  status: 'success' | 'error';
  error?: string;
}

export interface LLMProvider {
  name: string;
  run: (model: string, prompt: string, temperature: number) => Promise<LLMResponse>;
}

// Cost estimates per 1K tokens (input + output average)
const ESTIMATED_COST_PER_1K_TOKENS: Record<string, number> = {
  'gemini-2.0-flash-exp': 0.0005,
  'gemini-2.0-flash-lite': 0.00025,
  'gemini-2.0-flash': 0.0005,
  'gemini-2.5-flash': 0.0005,
};

// Gemini Provider
class GeminiProvider implements LLMProvider {
  name = 'gemini';

  async run(model: string, prompt: string, temperature: number): Promise<LLMResponse> {
    const startTime = performance.now();
    let text = "";
    let status: 'success' | 'error' = 'success';
    let error: string | undefined;

    try {
      const apiKey = await storage.getApiKey('gemini') || (process.env.GEMINI_API_KEY as string);

      if (!apiKey) {
        throw new Error('Gemini API key not configured. Please set it in Settings.');
      }

      const ai = new GoogleGenAI({ apiKey });

      // Use the model name directly (already matches Gemini API format)
      const targetModel = model;

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: prompt,
        config: {
          temperature,
          responseMimeType: 'text/plain'
        }
      });

      text = response.text || "No content generated.";

      // Rough token estimation (4 chars per token)
      const tokens = Math.ceil((prompt.length + text.length) / 4);

      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);
      const cost = (tokens / 1000) * (ESTIMATED_COST_PER_1K_TOKENS[targetModel] || 0.0005);

      return { text, latency, cost, tokens, status };
    } catch (err: any) {
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);
      error = err.message || "Unknown error occurred";
      status = 'error';

      return {
        text: `Error: ${error}`,
        latency,
        cost: 0,
        tokens: 0,
        status,
        error
      };
    }
  }
}

// Provider registry - only Gemini supported
const providers: Record<string, LLMProvider> = {
  gemini: new GeminiProvider(),
};

// Main function to run a prompt
export const runPrompt = async (
  model: ModelType | string,
  template: string,
  variables: Record<string, string>,
  temperature: number = 0.7
): Promise<LLMResponse> => {
  // Substitute variables in template
  let promptText = template;
  Object.entries(variables).forEach(([key, value]) => {
    promptText = promptText.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
  });

  // Only Gemini is supported
  const provider = providers.gemini;
  return provider.run(model, promptText, temperature);
};

// AI-as-judge evaluation
export const evaluateResponse = async (
  input: string,
  output: string,
  criteria: string
): Promise<{ score: number; reasoning: string }> => {
  const apiKey = await storage.getApiKey('gemini') || (process.env.GEMINI_API_KEY as string);

  if (!apiKey) {
    return { score: 0, reasoning: "No API Key available for evaluation." };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const evalPrompt = `
You are an AI Judge. Evaluate the following LLM output based on the criteria provided.

Input Prompt: "${input}"
Model Output: "${output}"
Criteria: "${criteria}"

Respond with a JSON object containing:
- score: number (0-100)
- reasoning: string (brief explanation)
`;

    const response = await ai.models.generateContent({
      model: ModelType.GEMINI_2_5_FLASH,
      contents: evalPrompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      score: result.score || 0,
      reasoning: result.reasoning || "Failed to parse evaluation result."
    };
  } catch (e: any) {
    console.error("Eval failed", e);
    return { score: 0, reasoning: `Evaluation failed: ${e.message || "Unknown error"}` };
  }
};

