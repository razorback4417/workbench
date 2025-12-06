import { Prompt, LogEntry, EvalRun, PromptVersion, ModelType } from '../types';
import { MOCK_PROMPTS, MOCK_LOGS, MOCK_EVALS } from './mockData';

const STORAGE_KEYS = {
  PROMPTS: 'pw_prompts',
  LOGS: 'pw_logs',
  EVALS: 'pw_evals',
  API_KEYS: 'pw_api_keys',
  SETTINGS: 'pw_settings',
};

// Initialize storage with mock data if empty
const initStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.PROMPTS)) {
    localStorage.setItem(STORAGE_KEYS.PROMPTS, JSON.stringify(MOCK_PROMPTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.LOGS)) {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(MOCK_LOGS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.EVALS)) {
    localStorage.setItem(STORAGE_KEYS.EVALS, JSON.stringify(MOCK_EVALS));
  }
};

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const storage = {
  init: initStorage,

  getPrompts: async (): Promise<Prompt[]> => {
    await delay(100);
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROMPTS) || '[]');
  },

  getPromptById: async (id: string): Promise<Prompt | undefined> => {
    await delay(50);
    const prompts = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROMPTS) || '[]');
    return prompts.find((p: Prompt) => p.id === id);
  },

  savePrompt: async (updatedPrompt: Prompt): Promise<void> => {
    await delay(200);
    const prompts = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROMPTS) || '[]');
    const index = prompts.findIndex((p: Prompt) => p.id === updatedPrompt.id);
    if (index !== -1) {
      prompts[index] = updatedPrompt;
    } else {
      prompts.push(updatedPrompt);
    }
    localStorage.setItem(STORAGE_KEYS.PROMPTS, JSON.stringify(prompts));
  },

  createPromptVersion: async (promptId: string, versionData: Partial<PromptVersion>): Promise<PromptVersion> => {
    const prompts = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROMPTS) || '[]');
    const promptIndex = prompts.findIndex((p: Prompt) => p.id === promptId);
    
    if (promptIndex === -1) throw new Error('Prompt not found');

    const prompt = prompts[promptIndex];
    const newVersionNumber = prompt.versions.length > 0 
      ? Math.max(...prompt.versions.map((v: PromptVersion) => v.version)) + 1 
      : 1;

    const newVersion: PromptVersion = {
      id: `v${Date.now()}`,
      version: newVersionNumber,
      createdAt: new Date().toISOString(),
      status: 'draft',
      template: versionData.template || '',
      variables: versionData.variables || [],
      model: versionData.model || ModelType.GEMINI_FLASH,
      temperature: versionData.temperature || 0.7,
      createdBy: 'Theo Designer', // Mock user
      commitMessage: versionData.commitMessage || `Version ${newVersionNumber}`,
    };

    prompt.versions.unshift(newVersion); // Add to top
    prompt.activeVersionId = newVersion.id;
    prompt.updatedAt = new Date().toISOString();
    
    prompts[promptIndex] = prompt;
    localStorage.setItem(STORAGE_KEYS.PROMPTS, JSON.stringify(prompts));
    return newVersion;
  },

  getLogs: async (): Promise<LogEntry[]> => {
    await delay(100);
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]');
  },

  addLog: async (log: LogEntry): Promise<void> => {
    const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]');
    logs.unshift(log); // Add to top
    // Keep only last 1000 logs
    if (logs.length > 1000) logs.length = 1000;
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  },

  getEvals: async (): Promise<EvalRun[]> => {
    await delay(100);
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.EVALS) || '[]');
  },

  saveEvalRun: async (run: EvalRun): Promise<void> => {
    const evals = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVALS) || '[]');
    const index = evals.findIndex((e: EvalRun) => e.id === run.id);
    if (index !== -1) {
      evals[index] = run;
    } else {
      evals.unshift(run);
    }
    localStorage.setItem(STORAGE_KEYS.EVALS, JSON.stringify(evals));
  },

  // API Key Management
  getApiKey: async (provider: 'gemini' | 'openai' | 'anthropic'): Promise<string | null> => {
    await delay(50);
    const keys = JSON.parse(localStorage.getItem(STORAGE_KEYS.API_KEYS) || '{}');
    return keys[provider] || null;
  },

  setApiKey: async (provider: 'gemini' | 'openai' | 'anthropic', key: string): Promise<void> => {
    await delay(50);
    const keys = JSON.parse(localStorage.getItem(STORAGE_KEYS.API_KEYS) || '{}');
    keys[provider] = key;
    localStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify(keys));
  },

  getAllApiKeys: async (): Promise<Record<string, string>> => {
    await delay(50);
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.API_KEYS) || '{}');
  }
};
