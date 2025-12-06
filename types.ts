export enum Role {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export enum ModelType {
  GEMINI_FLASH = 'gemini-2.5-flash',
  GEMINI_PRO = 'gemini-3-pro-preview',
  GPT_4 = 'gpt-4-turbo', // For UI mockup
  CLAUDE_3 = 'claude-3-opus', // For UI mockup
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

export interface GitHubConfig {
  connected: boolean;
  repoUrl?: string;
  branch?: string;
  filePath?: string;
  lastSyncedAt?: string;
}

export interface Prompt {
  id: string;
  name: string;
  description: string;
  tags: string[];
  activeVersionId: string;
  updatedAt: string;
  versions: PromptVersion[];
  github?: GitHubConfig;
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
}

export interface EvalResultItem {
  input: Record<string, string>;
  output: string;
  expectedOutput?: string;
  score: number;
  gradeReason?: string;
}

export interface EvalRun {
  id: string;
  name: string;
  date: string;
  promptVersionId: string;
  score: number; // 0-100
  status: 'passed' | 'failed' | 'running';
  sampleSize: number;
  results?: EvalResultItem[];
}
