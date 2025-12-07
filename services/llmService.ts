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
): Promise<{ score: number; reasoning: string; suggestions?: string[] }> => {
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
- reasoning: string (brief explanation of the score)
- suggestions: array of strings (3-5 specific, actionable suggestions for improving the prompt if score < 70, otherwise empty array)

IMPORTANT: For scores below 70, suggestions MUST be:
1. Specific and actionable (e.g., "ADD instruction: 'Always include [specific element]'")
2. Reference exact parts of the prompt that need changes
3. Include examples of what to add/change
4. Focus on prompt editing, not just general feedback
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
    const score = result.score || 0;
    const reasoning = result.reasoning || "Failed to parse evaluation result.";
    let suggestions = result.suggestions || [];

    // Ensure failures always have suggestions - generate fallback if missing
    if (score < 70 && suggestions.length === 0) {
      suggestions = [
        `Review the output against the criteria: "${criteria}". The output scored ${score}/100.`,
        `Consider adding more specific instructions to address: ${reasoning.substring(0, 100)}`,
        `Add examples or constraints to guide the model toward the expected output format.`
      ];
    }

    return {
      score,
      reasoning,
      suggestions
    };
  } catch (e: any) {
    console.error("Eval failed", e);
    return { score: 0, reasoning: `Evaluation failed: ${e.message || "Unknown error"}` };
  }
};

// Generate overall improvement suggestions based on evaluation results
export const generateImprovementSuggestions = async (
  promptTemplate: string,
  failedResults: Array<{ input: Record<string, string>; output: string; score: number; gradeReason?: string }>
): Promise<string[]> => {
  const apiKey = await storage.getApiKey('gemini') || (process.env.GEMINI_API_KEY as string);

  if (!apiKey || failedResults.length === 0) {
    return [];
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const suggestionPrompt = `
You are a prompt engineering expert. Analyze the following prompt template and its failed test cases to provide actionable, specific improvement suggestions.

Current Prompt Template:
"""
${promptTemplate}
"""

Failed Test Cases:
${failedResults.map((r, i) => `
Test ${i + 1}:
- Input: ${JSON.stringify(r.input)}
- Output: ${r.output.substring(0, 300)}${r.output.length > 300 ? '...' : ''}
- Score: ${r.score}/100
- Reason: ${r.gradeReason || 'N/A'}
${r.output.length > 300 ? `\n- Full Output Length: ${r.output.length} characters` : ''}
`).join('\n')}

Analyze the patterns in the failures and provide 4-6 highly specific, actionable suggestions. Each suggestion should:
1. Be concrete and implementable (not vague like "improve quality")
2. Reference specific parts of the prompt or test cases
3. Include examples of what to add/change when possible
4. Address the root cause of the failures, not just symptoms
5. Consider edge cases and error handling

CRITICAL: Format suggestions using action verbs that clearly indicate what to ADD, RESTORE, INCLUDE, SPECIFY, or REQUIRE in the prompt:
- Use "ADD instruction:" or "INCLUDE requirement:" for new instructions
- Use "RESTORE" for instructions that were removed
- Use "SPECIFY:" for clarifying existing instructions
- Use "REQUIRE:" for mandatory constraints
- Include exact text or examples to add when possible

Focus areas:
- Missing instructions or context that would prevent the observed failures
- Output format requirements that aren't specified
- Edge case handling (null values, empty inputs, extreme values)
- Tone, style, or structure requirements
- Variable usage and how they should be incorporated
- Examples or few-shot demonstrations that might help
- Constraints or guardrails needed

Respond with a JSON object containing:
- suggestions: array of strings (each suggestion should start with an action verb like "ADD", "RESTORE", "INCLUDE", "SPECIFY", or "REQUIRE" and provide exact guidance)
- priority: array of strings matching the suggestions, indicating "high", "medium", or "low" priority
`;

    const response = await ai.models.generateContent({
      model: ModelType.GEMINI_2_5_FLASH,
      contents: suggestionPrompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.5
      }
    });

    const result = JSON.parse(response.text || '{}');
    // Return suggestions with priority if available, otherwise just suggestions
    const suggestions = result.suggestions || [];
    // If priority is provided, we can use it for sorting/filtering in the UI
    // For now, just return suggestions as before for backward compatibility
    return suggestions;
  } catch (e: any) {
    console.error("Failed to generate suggestions", e);
    return [];
  }
};

