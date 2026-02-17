export interface LLMConfig {
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
}

export interface ModelOption {
  id: string;
  label: string;
}

export interface ModelRun {
  modelId: string;
  label: string;
  status: 'idle' | 'running' | 'complete' | 'error';
  output: string;
  tokenCount: number;
  latencyMs: number;
  error?: string;
}

export interface JudgeAnalysis {
  status: 'idle' | 'running' | 'complete' | 'error';
  output: string;
  winnerModelId: string | null;
  scores: Record<string, number>;
  reasoning: string;
  error?: string;
}

export interface RunSession {
  prompt: string;
  models: ModelRun[];
  judge: JudgeAnalysis;
  startedAt: number;
}
