/**
 * Flux SDK - Main entry point
 *
 * This SDK provides a simple API for interacting with Flux prompt management
 * from your applications. It wraps the existing Flux services.
 */

import { storage } from '../services/storage';
import { runPrompt } from '../services/llmService';
import { runEval, getDatasets } from '../services/evalService';
import { getABTests, getABTestById, saveABTest, selectVariant, determineWinner } from '../services/abTestService';
import {
  Prompt,
  PromptVersion,
  LogEntry,
  EvalRun,
  ABTest,
  ModelType
} from '../types';

export interface FluxClientConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
}

export interface RunPromptOptions {
  version?: number | string;
  temperature?: number;
}

export interface ListLogsOptions {
  promptId?: string;
  versionId?: string;
  status?: 'success' | 'error';
  limit?: number;
  offset?: number;
}

export interface CreatePromptOptions {
  name: string;
  description: string;
  template: string;
  variables: string[];
  model?: ModelType;
  temperature?: number;
  tags?: string[];
  commitMessage?: string;
}

export interface CreateVersionOptions {
  template: string;
  variables: string[];
  model?: ModelType;
  temperature?: number;
  commitMessage?: string;
}

export interface CreateABTestOptions {
  name: string;
  description: string;
  variants: Array<{
    promptId: string;
    versionId: string;
    weight: number;
  }>;
}

export interface RunEvalOptions {
  promptId: string;
  versionId?: string;
  datasetId: string;
  criteria?: string;
}

/**
 * FluxClient - Main SDK class
 */
export class FluxClient {
  private config: FluxClientConfig;

  constructor(config: FluxClientConfig = {}) {
    this.config = config;

    // Initialize storage if in browser
    if (typeof window !== 'undefined' && storage.init) {
      storage.init();
    }
  }

  /**
   * Prompts API
   */
  prompts = {
    /**
     * Get all prompts
     */
    list: async (): Promise<Prompt[]> => {
      return await storage.getPrompts();
    },

    /**
     * Get a prompt by ID
     */
    get: async (id: string, options?: { version?: number }): Promise<Prompt | undefined> => {
      const prompt = await storage.getPromptById(id);
      if (!prompt) return undefined;

      // If version specified, filter to that version
      if (options?.version !== undefined) {
        const version = prompt.versions.find(v => v.version === options.version);
        if (version) {
          return {
            ...prompt,
            activeVersionId: version.id,
            versions: [version]
          };
        }
      }

      return prompt;
    },

    /**
     * Run a prompt with variables
     */
    run: async (
      promptId: string,
      variables: Record<string, string>,
      options?: RunPromptOptions
    ) => {
      const prompt = await storage.getPromptById(promptId);
      if (!prompt) {
        throw new Error(`Prompt not found: ${promptId}`);
      }

      // Find the version to use
      let version: PromptVersion | undefined;
      if (options?.version !== undefined) {
        if (typeof options.version === 'number') {
          version = prompt.versions.find(v => v.version === options.version);
        } else {
          version = prompt.versions.find(v => v.id === options.version);
        }
      } else {
        // Use active version or latest production version
        version = prompt.versions.find(v => v.id === prompt.activeVersionId) ||
                  prompt.versions.find(v => v.status === 'production') ||
                  prompt.versions[0];
      }

      if (!version) {
        throw new Error(`No version found for prompt: ${promptId}`);
      }

      // Run the prompt
      const temperature = options?.temperature ?? version.temperature;
      const response = await runPrompt(
        version.model,
        version.template,
        variables,
        temperature
      );

      // Log the execution
      const logEntry: LogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        promptId,
        versionId: version.id,
        timestamp: new Date().toISOString(),
        inputs: variables,
        output: response.text,
        latency: response.latency,
        cost: response.cost,
        tokens: response.tokens,
        status: response.status,
        model: version.model,
        error: response.error
      };

      await storage.addLog(logEntry);

      return response;
    },

    /**
     * Create a new prompt
     */
    create: async (options: CreatePromptOptions): Promise<Prompt> => {
      const promptId = `prompt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const newVersion: PromptVersion = {
        id: `v${Date.now()}`,
        version: 1,
        createdAt: new Date().toISOString(),
        status: 'draft',
        template: options.template,
        variables: options.variables,
        model: options.model || ModelType.GEMINI_2_5_FLASH,
        temperature: options.temperature ?? 0.7,
        createdBy: 'SDK',
        commitMessage: options.commitMessage || 'Initial version'
      };

      const prompt: Prompt = {
        id: promptId,
        name: options.name,
        description: options.description,
        tags: options.tags || [],
        activeVersionId: newVersion.id,
        updatedAt: new Date().toISOString(),
        versions: [newVersion]
      };

      await storage.savePrompt(prompt);
      return prompt;
    },

    /**
     * Create a new version of an existing prompt
     */
    createVersion: async (
      promptId: string,
      options: CreateVersionOptions
    ): Promise<PromptVersion> => {
      return await storage.createPromptVersion(promptId, {
        template: options.template,
        variables: options.variables,
        model: options.model,
        temperature: options.temperature,
        commitMessage: options.commitMessage
      });
    },

    /**
     * Update version status
     */
    updateVersionStatus: async (
      promptId: string,
      versionId: string,
      status: 'draft' | 'staging' | 'production' | 'archived'
    ): Promise<void> => {
      return await storage.updateVersionStatus(promptId, versionId, status);
    }
  };

  /**
   * Logs API
   */
  logs = {
    /**
     * List logs with optional filters
     */
    list: async (options?: ListLogsOptions): Promise<LogEntry[]> => {
      let logs = await storage.getLogs();

      // Apply filters
      if (options?.promptId) {
        logs = logs.filter(log => log.promptId === options.promptId);
      }
      if (options?.versionId) {
        logs = logs.filter(log => log.versionId === options.versionId);
      }
      if (options?.status) {
        logs = logs.filter(log => log.status === options.status);
      }

      // Apply pagination
      const offset = options?.offset || 0;
      const limit = options?.limit || 100;

      return logs.slice(offset, offset + limit);
    },

    /**
     * Get a specific log entry
     */
    get: async (id: string): Promise<LogEntry | undefined> => {
      const logs = await storage.getLogs();
      return logs.find(log => log.id === id);
    }
  };

  /**
   * Evaluations API
   */
  evaluations = {
    /**
     * Run an evaluation
     */
    run: async (options: RunEvalOptions): Promise<EvalRun> => {
      const prompt = await storage.getPromptById(options.promptId);
      if (!prompt) {
        throw new Error(`Prompt not found: ${options.promptId}`);
      }

      // Find version to use
      let versionId: string;
      if (options.versionId) {
        versionId = options.versionId;
      } else {
        const version = prompt.versions.find(v => v.id === prompt.activeVersionId) ||
                       prompt.versions.find(v => v.status === 'production') ||
                       prompt.versions[0];
        if (!version) {
          throw new Error(`No version found for prompt: ${options.promptId}`);
        }
        versionId = version.id;
      }

      return await runEval(
        options.promptId,
        versionId,
        options.datasetId,
        options.criteria
      );
    },

    /**
     * Get all evaluations
     */
    list: async (): Promise<EvalRun[]> => {
      return await storage.getEvals();
    },

    /**
     * Get a specific evaluation
     */
    get: async (id: string): Promise<EvalRun | undefined> => {
      const evals = await storage.getEvals();
      return evals.find(e => e.id === id);
    },

    /**
     * Get available datasets
     */
    getDatasets: async () => {
      return await getDatasets();
    }
  };

  /**
   * A/B Tests API
   */
  abTests = {
    /**
     * Create a new A/B test
     */
    create: async (options: CreateABTestOptions): Promise<ABTest> => {
      const test: ABTest = {
        id: `abtest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: options.name,
        description: options.description,
        variants: options.variants,
        status: 'draft',
        startDate: new Date().toISOString(),
        metrics: {
          totalRequests: 0,
          successRate: 0,
          avgLatency: 0,
          avgCost: 0,
          errorRate: 0
        }
      };

      await saveABTest(test);
      return test;
    },

    /**
     * Get all A/B tests
     */
    list: async (): Promise<ABTest[]> => {
      return await getABTests();
    },

    /**
     * Get a specific A/B test
     */
    get: async (id: string): Promise<ABTest | undefined> => {
      return await getABTestById(id);
    },

    /**
     * Start an A/B test
     */
    start: async (id: string): Promise<void> => {
      const test = await getABTestById(id);
      if (!test) {
        throw new Error(`A/B test not found: ${id}`);
      }
      test.status = 'running';
      await saveABTest(test);
    },

    /**
     * Pause an A/B test
     */
    pause: async (id: string): Promise<void> => {
      const test = await getABTestById(id);
      if (!test) {
        throw new Error(`A/B test not found: ${id}`);
      }
      test.status = 'paused';
      await saveABTest(test);
    },

    /**
     * Select a variant for A/B testing (weighted random)
     */
    selectVariant: async (testId: string): Promise<{ promptId: string; versionId: string }> => {
      const test = await getABTestById(testId);
      if (!test) {
        throw new Error(`A/B test not found: ${testId}`);
      }
      if (test.status !== 'running') {
        throw new Error(`A/B test is not running: ${test.status}`);
      }
      return selectVariant(test);
    },

    /**
     * Determine winner of an A/B test
     */
    determineWinner: async (testId: string): Promise<number | null> => {
      return await determineWinner(testId);
    }
  };
}

// Export types
export type { Prompt, PromptVersion, LogEntry, EvalRun, ABTest, ModelType };
export { ModelType } from '../types';

// Default export
export default FluxClient;

