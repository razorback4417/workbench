import { Prompt, LogEntry, EvalRun, PromptVersion, ModelType } from '../types';
import { MOCK_PROMPTS, MOCK_LOGS, MOCK_EVALS, MOCK_AB_TESTS, MOCK_AB_TEST_LOGS } from './mockData';

const STORAGE_KEYS = {
  PROMPTS: 'pw_prompts',
  LOGS: 'pw_logs',
  EVALS: 'pw_evals',
  API_KEYS: 'pw_api_keys',
  SETTINGS: 'pw_settings',
  EVAL_DATASETS: 'pw_eval_datasets',
  AB_TESTS: 'pw_ab_tests',
  REGRESSION_ALERTS: 'pw_regression_alerts',
};

// Initialize storage with mock data if empty
const initStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.PROMPTS)) {
    localStorage.setItem(STORAGE_KEYS.PROMPTS, JSON.stringify(MOCK_PROMPTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.LOGS)) {
    // Combine regular mock logs with A/B test logs
    const allLogs = [...MOCK_LOGS, ...MOCK_AB_TEST_LOGS];
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(allLogs));
  }

  // For evals, merge new mock data with existing (add new ones that don't exist)
  const existingEvals = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVALS) || '[]');
  const existingEvalIds = new Set(existingEvals.map((e: EvalRun) => e.id));
  const newEvals = MOCK_EVALS.filter(e => !existingEvalIds.has(e.id));
  if (newEvals.length > 0 || existingEvals.length === 0) {
    localStorage.setItem(STORAGE_KEYS.EVALS, JSON.stringify([...newEvals, ...existingEvals]));
  }

  // For AB tests, merge new mock data with existing
  const existingABTests = JSON.parse(localStorage.getItem(STORAGE_KEYS.AB_TESTS) || '[]');
  const existingABTestIds = new Set(existingABTests.map((t: any) => t.id));
  const newABTests = MOCK_AB_TESTS.filter(t => !existingABTestIds.has(t.id));
  if (newABTests.length > 0 || existingABTests.length === 0) {
    localStorage.setItem(STORAGE_KEYS.AB_TESTS, JSON.stringify([...newABTests, ...existingABTests]));
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
      model: versionData.model || ModelType.GEMINI_2_5_FLASH,
      temperature: versionData.temperature || 0.7,
      createdBy: 'Theo', // Mock user
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
  },

  // Update version status
  updateVersionStatus: async (promptId: string, versionId: string, status: 'draft' | 'staging' | 'production' | 'archived'): Promise<void> => {
    await delay(100);
    const prompts = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROMPTS) || '[]');
    const promptIndex = prompts.findIndex((p: Prompt) => p.id === promptId);

    if (promptIndex === -1) throw new Error('Prompt not found');

    const prompt = prompts[promptIndex];
    const versionIndex = prompt.versions.findIndex((v: PromptVersion) => v.id === versionId);

    if (versionIndex === -1) throw new Error('Version not found');

    // If promoting to production, archive other production versions
    if (status === 'production') {
      prompt.versions.forEach((v: PromptVersion) => {
        if (v.status === 'production' && v.id !== versionId) {
          v.status = 'archived';
        }
      });
      prompt.activeVersionId = versionId;
    }

    prompt.versions[versionIndex].status = status;
    prompt.updatedAt = new Date().toISOString();

    prompts[promptIndex] = prompt;
    localStorage.setItem(STORAGE_KEYS.PROMPTS, JSON.stringify(prompts));
  },

  // Evaluation Datasets
  getEvalDatasets: async (): Promise<any[]> => {
    await delay(50);
    const custom = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVAL_DATASETS) || '[]');
    return custom;
  },

  saveEvalDataset: async (dataset: any): Promise<void> => {
    await delay(100);
    const datasets = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVAL_DATASETS) || '[]');
    const index = datasets.findIndex((d: any) => d.id === dataset.id);
    if (index !== -1) {
      datasets[index] = dataset;
    } else {
      datasets.push(dataset);
    }
    localStorage.setItem(STORAGE_KEYS.EVAL_DATASETS, JSON.stringify(datasets));
  },

  deleteEvalDataset: async (id: string): Promise<void> => {
    await delay(100);
    let datasets = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVAL_DATASETS) || '[]');
    datasets = datasets.filter((d: any) => d.id !== id);
    localStorage.setItem(STORAGE_KEYS.EVAL_DATASETS, JSON.stringify(datasets));
  },
};
