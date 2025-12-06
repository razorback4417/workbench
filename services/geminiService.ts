import { GoogleGenAI } from "@google/genai";
import { ModelType } from "../types";

const ESTIMATED_COST_PER_1K_TOKENS = {
  [ModelType.GEMINI_FLASH]: 0.0005,
  [ModelType.GEMINI_PRO]: 0.0015,
  [ModelType.GPT_4]: 0.03, // Mock
  [ModelType.CLAUDE_3]: 0.015, // Mock
};

export const runPrompt = async (
  model: string,
  template: string,
  variables: Record<string, string>
): Promise<{ text: string; latency: number; cost: number; tokens: number; status: 'success' | 'error' }> => {
  
  // Substitute variables
  let promptText = template;
  Object.entries(variables).forEach(([key, value]) => {
    // Basic substitution handling {{variable}}
    promptText = promptText.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
  });

  const startTime = performance.now();
  let text = "";
  let status: 'success' | 'error' = 'success';
  let tokens = 0;

  try {
    if (process.env.API_KEY) {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Map UI ModelType to actual Gemini model names if needed, 
      // but ModelType enum already matches Gemini expectations mostly.
      // Fallback for non-Gemini models in this mock environment:
      let targetModel = model;
      if (model.includes('gpt') || model.includes('claude')) {
         // Force use of Gemini Flash for demo purposes if user selects non-gemini model
         // In a real app we'd call their respective APIs
         targetModel = 'gemini-2.5-flash';
         text = `[Simulated ${model} Output via Gemini]\n`;
      }

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: promptText,
      });

      const responseText = response.text;
      text += responseText || "No content generated.";
      
      // Rough token estimation since API doesn't always return usage metadata in all contexts yet
      // A rough char to token estimate is 4 chars per token
      tokens = Math.ceil((promptText.length + text.length) / 4);

    } else {
      // Fallback if no API key is set in environment
      await new Promise(r => setTimeout(r, 1000));
      text = "API_KEY not found in environment variables. Please configure your API key to run live prompts.\n\nSimulated Output:\n" + promptText;
      status = 'error';
    }
  } catch (error: any) {
    console.error("Gemini API Error", error);
    text = `Error: ${error.message || "Unknown error occurred"}`;
    status = 'error';
  }

  const endTime = performance.now();
  const latency = Math.round(endTime - startTime);
  
  // Cost calculation
  const rate = ESTIMATED_COST_PER_1K_TOKENS[model as ModelType] || 0.0005;
  const cost = (tokens / 1000) * rate;

  return {
    text,
    latency,
    cost,
    tokens,
    status
  };
};

export const evaluateResponse = async (
  input: string,
  output: string,
  criteria: string
): Promise<{ score: number; reasoning: string }> => {
  if (!process.env.API_KEY) {
    return { score: 0, reasoning: "No API Key available for evaluation." };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
      model: 'gemini-2.5-flash',
      contents: evalPrompt,
      config: { responseMimeType: 'application/json' }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      score: result.score || 0,
      reasoning: result.reasoning || "Failed to parse evaluation result."
    };
  } catch (e) {
    console.error("Eval failed", e);
    return { score: 0, reasoning: "Evaluation failed due to API error." };
  }
};
