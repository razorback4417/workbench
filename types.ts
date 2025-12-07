export enum Role {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export enum ModelType {
  GEMINI_2_0_FLASH_EXP = 'gemini-2.0-flash-exp',
  GEMINI_2_0_FLASH_LITE = 'gemini-2.0-flash-lite',
  GEMINI_2_0_FLASH = 'gemini-2.0-flash',
  GEMINI_2_5_FLASH = 'gemini-2.5-flash',
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: Role;
}

export interface PromptVersion {
  id: string;
  version: number;
  template: string;
  variables: string[];
  model: ModelType;
  temperature: number;
  createdAt: string;
  createdBy: string;
  commitMessage?: string;
  status: 'draft' | 'staging' | 'production' | 'archived';
}

export interface FileConfig {
  lastExportedAt?: string;
  lastImportedAt?: string;
}

export interface Prompt {
  id: string;
  name: string;
  description: string;
  tags: string[];
  activeVersionId: string;
  updatedAt: string;
  versions: PromptVersion[];
  fileConfig?: FileConfig;
}

export interface LogEntry {
  id: string;
  promptId: string;
  versionId: string;
  timestamp: string;
  inputs: Record<string, string>;
  output: string;
  latency: number; // ms
  cost: number; // USD
  tokens: number;
  status: 'success' | 'error';
  model: string;
  regressionDetected?: boolean;
  regressionReason?: string;
  qualityScore?: number; // 0-100, AI-evaluated quality
  previousQualityScore?: number; // For comparison
}

export interface EvalResultItem {
  input: Record<string, string>;
  output: string;
  expectedOutput?: string;
  score: number;
  gradeReason?: string;
  suggestions?: string[];
}

export interface EvalRun {
  id: string;
  name: string;
  date: string;
  promptVersionId: string;
  promptId?: string; // Added for deployment
  score: number; // 0-100
  status: 'passed' | 'failed' | 'running';
  sampleSize: number;
  results?: EvalResultItem[];
  improvementSuggestions?: string[]; // AI-generated suggestions
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  variants: Array<{
    promptId: string;
    versionId: string;
    weight: number; // 0-100, percentage of traffic
  }>;
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate: string;
  endDate?: string;
  metrics: {
    totalRequests: number;
    successRate: number;
    avgLatency: number;
    avgCost: number;
    errorRate: number;
  };
  winnerVariantId?: string; // Index of winning variant
}
