'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Settings,
  Zap,
  Plus,
  X,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Trophy,
  Activity,
  Clock,
  Hash,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Send,
  Trash2,
} from 'lucide-react';
import type { LLMConfig, ModelRun, JudgeAnalysis, RunSession } from './types';
import { useModels } from './hooks/useModels';
import { useLLMInference } from './hooks/useLLMInference';
import { useJudge } from './hooks/useJudge';

const MODEL_COLORS = [
  '#3b82f6',
  '#a855f7',
  '#22c55e',
  '#f97316',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
  '#f59e0b',
];

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

function ConfigPanel({
  config,
  onChange,
}: {
  config: LLMConfig;
  onChange: (config: LLMConfig) => void;
}) {
  return (
    <div className="glass-panel rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Settings size={14} style={{ color: 'var(--amber)' }} />
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
          Connection
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs mb-1.5" style={{ color: 'var(--text-secondary)', fontFamily: 'DM Mono, monospace' }}>
            Base URL
          </label>
          <input
            type="text"
            value={config.baseUrl}
            onChange={(e) => onChange({ ...config, baseUrl: e.target.value })}
            placeholder="https://api.openai.com/v1"
            className="w-full px-3 py-2 rounded-lg text-xs outline-none transition-all"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--amber-dim)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
          />
        </div>

        <div>
          <label className="block text-xs mb-1.5" style={{ color: 'var(--text-secondary)', fontFamily: 'DM Mono, monospace' }}>
            API Key
          </label>
          <input
            type="password"
            value={config.apiKey}
            onChange={(e) => onChange({ ...config, apiKey: e.target.value })}
            placeholder="sk-..."
            className="w-full px-3 py-2 rounded-lg text-xs outline-none transition-all"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--amber-dim)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
          />
        </div>
      </div>
    </div>
  );
}

function ModelSelector({
  selectedModels,
  availableModels,
  judgeModel,
  loadingModels,
  onFetchModels,
  onAddModel,
  onRemoveModel,
  onSetJudge,
}: {
  selectedModels: string[];
  availableModels: { id: string; label: string }[];
  judgeModel: string;
  loadingModels: boolean;
  onFetchModels: () => void;
  onAddModel: (modelId: string) => void;
  onRemoveModel: (modelId: string) => void;
  onSetJudge: (modelId: string) => void;
}) {
  const [customModel, setCustomModel] = useState('');

  const handleAddCustom = () => {
    const trimmed = customModel.trim();
    if (trimmed && !selectedModels.includes(trimmed)) {
      onAddModel(trimmed);
      setCustomModel('');
    }
  };

  return (
    <div className="glass-panel rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={14} style={{ color: 'var(--amber)' }} />
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
            Models
          </span>
        </div>
        <button
          onClick={onFetchModels}
          disabled={loadingModels}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
          }}
        >
          {loadingModels ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <RefreshCw size={12} />
          )}
          Fetch
        </button>
      </div>

      {availableModels.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
            Available from endpoint:
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {availableModels.map((model) => {
              const isSelected = selectedModels.includes(model.id);
              return (
                <button
                  key={model.id}
                  onClick={() => (isSelected ? onRemoveModel(model.id) : onAddModel(model.id))}
                  className="px-2.5 py-1 rounded-md text-xs transition-all"
                  style={{
                    background: isSelected ? 'rgba(240, 165, 0, 0.15)' : 'var(--bg-surface)',
                    border: `1px solid ${isSelected ? 'var(--amber-dim)' : 'var(--border-subtle)'}`,
                    color: isSelected ? 'var(--amber)' : 'var(--text-secondary)',
                    fontFamily: 'DM Mono, monospace',
                  }}
                >
                  {model.id}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={customModel}
          onChange={(e) => setCustomModel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
          placeholder="Custom model name..."
          className="flex-1 px-3 py-2 rounded-lg text-xs outline-none transition-all"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--amber-dim)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
        />
        <button
          onClick={handleAddCustom}
          className="px-3 py-2 rounded-lg transition-all"
          style={{
            background: 'var(--amber-glow)',
            border: '1px solid var(--amber-dim)',
            color: 'var(--amber)',
          }}
        >
          <Plus size={14} />
        </button>
      </div>

      {selectedModels.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
            Selected for evaluation:
          </p>
          <div className="space-y-1.5">
            {selectedModels.map((modelId, index) => (
              <div
                key={modelId}
                className="flex items-center justify-between px-3 py-2 rounded-lg"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: MODEL_COLORS[index % MODEL_COLORS.length] }}
                  />
                  <span className="text-xs" style={{ color: 'var(--text-primary)', fontFamily: 'DM Mono, monospace' }}>
                    {modelId}
                  </span>
                </div>
                <button
                  onClick={() => onRemoveModel(modelId)}
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedModels.length > 0 && (
        <div>
          <label className="block text-xs mb-1.5" style={{ color: 'var(--text-secondary)', fontFamily: 'DM Mono, monospace' }}>
            Judge Model
          </label>
          <select
            value={judgeModel}
            onChange={(e) => onSetJudge(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-xs outline-none"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">Select judge model...</option>
            {[...selectedModels, ...availableModels.map((m) => m.id).filter((id) => !selectedModels.includes(id))].map(
              (modelId) => (
                <option key={modelId} value={modelId}>
                  {modelId}
                </option>
              )
            )}
          </select>
        </div>
      )}
    </div>
  );
}

function ModelOutputCard({
  run,
  color,
  isWinner,
  score,
}: {
  run: ModelRun;
  color: string;
  isWinner: boolean;
  score?: number;
}) {
  const [expanded, setExpanded] = useState(true);

  const statusIcon = {
    idle: <span className="w-2 h-2 rounded-full" style={{ background: 'var(--text-muted)' }} />,
    running: <Loader2 size={12} className="animate-spin" style={{ color }} />,
    complete: <CheckCircle2 size={12} style={{ color: 'var(--green-signal)' }} />,
    error: <AlertCircle size={12} style={{ color: 'var(--red-signal)' }} />,
  }[run.status];

  return (
    <div
      className={cn('rounded-xl overflow-hidden transition-all duration-500', isWinner && 'model-card-winner')}
      style={{
        background: 'var(--bg-panel)',
        border: `1px solid ${isWinner ? 'var(--amber)' : 'var(--border-subtle)'}`,
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
        onClick={() => setExpanded((prev) => !prev)}
      >
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
          <span className="text-xs font-medium" style={{ fontFamily: 'DM Mono, monospace', color: 'var(--text-primary)' }}>
            {run.modelId}
          </span>
          {isWinner && (
            <span
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
              style={{ background: 'rgba(240, 165, 0, 0.15)', color: 'var(--amber)', border: '1px solid var(--amber-dim)' }}
            >
              <Trophy size={10} />
              WINNER
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {statusIcon}
          {run.status === 'complete' && (
            <>
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
                <Clock size={10} />
                {run.latencyMs}ms
              </span>
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
                <Hash size={10} />
                {run.tokenCount}
              </span>
            </>
          )}
          {score !== undefined && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded"
              style={{
                fontFamily: 'DM Mono, monospace',
                color: isWinner ? 'var(--amber)' : 'var(--text-secondary)',
                background: isWinner ? 'rgba(240, 165, 0, 0.1)' : 'var(--bg-surface)',
              }}
            >
              {score}
            </span>
          )}
          {expanded ? <ChevronUp size={12} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />}
        </div>
      </div>

      {score !== undefined && (
        <div className="h-0.5" style={{ background: 'var(--border-subtle)' }}>
          <div
            className="h-full transition-all duration-1000"
            style={{
              width: `${score}%`,
              background: isWinner
                ? 'linear-gradient(90deg, var(--amber-dim), var(--amber))'
                : `linear-gradient(90deg, ${color}88, ${color})`,
              boxShadow: isWinner ? '0 0 8px rgba(240, 165, 0, 0.4)' : 'none',
            }}
          />
        </div>
      )}

      {expanded && (
        <div className="px-4 py-4">
          {run.status === 'idle' && (
            <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
              Awaiting execution...
            </p>
          )}
          {run.status === 'error' && (
            <p className="text-xs" style={{ color: 'var(--red-signal)', fontFamily: 'DM Mono, monospace' }}>
              {run.error}
            </p>
          )}
          {(run.status === 'running' || run.status === 'complete') && (
            <p
              className={cn('text-sm leading-relaxed whitespace-pre-wrap', run.status === 'running' && 'typing-cursor')}
              style={{ color: 'var(--text-primary)' }}
            >
              {run.output}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function JudgePanel({ analysis }: { analysis: JudgeAnalysis }) {
  if (analysis.status === 'idle') return null;

  return (
    <div
      className="rounded-xl overflow-hidden animate-fade-up"
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--amber-dim)',
        boxShadow: '0 0 40px rgba(240, 165, 0, 0.08)',
      }}
    >
      <div
        className="flex items-center gap-3 px-5 py-3.5"
        style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(240, 165, 0, 0.05)' }}
      >
        <Zap size={14} style={{ color: 'var(--amber)' }} />
        <span className="text-xs font-semibold tracking-widest uppercase amber-glow-text">
          Judge Analysis
        </span>
        {analysis.status === 'running' && (
          <Loader2 size={12} className="animate-spin ml-auto" style={{ color: 'var(--amber)' }} />
        )}
      </div>

      <div className="px-5 py-4">
        {(analysis.status === 'running' || analysis.status === 'complete') && (
          <p
            className={cn('text-sm leading-relaxed whitespace-pre-wrap', analysis.status === 'running' && 'typing-cursor')}
            style={{ color: 'var(--text-primary)' }}
          >
            {analysis.output}
          </p>
        )}
        {analysis.status === 'error' && (
          <p className="text-xs" style={{ color: 'var(--red-signal)', fontFamily: 'DM Mono, monospace' }}>
            {analysis.error}
          </p>
        )}

        {analysis.status === 'complete' && analysis.reasoning && (
          <div
            className="mt-4 px-4 py-3 rounded-lg"
            style={{ background: 'rgba(240, 165, 0, 0.06)', border: '1px solid rgba(240, 165, 0, 0.2)' }}
          >
            <p className="text-xs" style={{ color: 'var(--amber)', fontFamily: 'DM Mono, monospace' }}>
              {analysis.reasoning}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LLMJudgePage() {
  const [config, setConfig] = useState<LLMConfig>({
    baseUrl: '',
    apiKey: '',
    defaultModel: '',
  });

  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [judgeModel, setJudgeModel] = useState('');
  const [prompt, setPrompt] = useState('');
  const [session, setSession] = useState<RunSession | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const { models: availableModels, loading: loadingModels, fetchModels } = useModels(config);
  const { runInference } = useLLMInference(config);
  const { runJudge } = useJudge(config);

  const sessionRef = useRef<RunSession | null>(null);

  const updateModelRun = useCallback((modelId: string, updater: (run: ModelRun) => ModelRun) => {
    setSession((prev) => {
      if (!prev) return prev;
      const updated: RunSession = {
        ...prev,
        models: prev.models.map((run) => (run.modelId === modelId ? updater(run) : run)),
      };
      sessionRef.current = updated;
      return updated;
    });
  }, []);

  const updateJudge = useCallback((updater: (judge: JudgeAnalysis) => JudgeAnalysis) => {
    setSession((prev) => {
      if (!prev) return prev;
      const updated: RunSession = { ...prev, judge: updater(prev.judge) };
      sessionRef.current = updated;
      return updated;
    });
  }, []);

  const handleRun = useCallback(async () => {
    if (!prompt.trim() || selectedModels.length === 0 || !judgeModel) return;

    const initialSession: RunSession = {
      prompt: prompt.trim(),
      startedAt: Date.now(),
      models: selectedModels.map((modelId) => ({
        modelId,
        label: modelId,
        status: 'idle',
        output: '',
        tokenCount: 0,
        latencyMs: 0,
      })),
      judge: {
        status: 'idle',
        output: '',
        winnerModelId: null,
        scores: {},
        reasoning: '',
      },
    };

    sessionRef.current = initialSession;
    setSession(initialSession);
    setIsRunning(true);

    const modelPromises = selectedModels.map((modelId) => {
      updateModelRun(modelId, (run) => ({ ...run, status: 'running' }));

      return runInference({
        model: modelId,
        prompt: prompt.trim(),
        onToken: (token) => {
          updateModelRun(modelId, (run) => ({ ...run, output: run.output + token }));
        },
        onComplete: (totalTokens, latencyMs) => {
          updateModelRun(modelId, (run) => ({
            ...run,
            status: 'complete',
            tokenCount: totalTokens,
            latencyMs,
          }));
        },
        onError: (error) => {
          updateModelRun(modelId, (run) => ({ ...run, status: 'error', error }));
        },
      });
    });

    await Promise.allSettled(modelPromises);

    const completedRuns = sessionRef.current?.models ?? [];

    updateJudge((judge) => ({ ...judge, status: 'running' }));

    await runJudge({
      originalPrompt: prompt.trim(),
      modelRuns: completedRuns,
      judgeModel,
      onToken: (token) => {
        updateJudge((judge) => ({ ...judge, output: judge.output + token }));
      },
      onComplete: (winnerModelId, scores, reasoning, cleanedOutput) => {
        updateJudge((judge) => ({
          ...judge,
          status: 'complete',
          output: cleanedOutput,
          winnerModelId,
          scores,
          reasoning,
        }));
      },
      onError: (error) => {
        updateJudge((judge) => ({ ...judge, status: 'error', error }));
      },
    });

    setIsRunning(false);
  }, [prompt, selectedModels, judgeModel, runInference, runJudge, updateModelRun, updateJudge]);

  const canRun = prompt.trim().length > 0 && selectedModels.length > 0 && !!judgeModel && !isRunning;

  return (
    <div className="min-h-screen grid-bg" style={{ background: 'var(--bg-void)' }}>
      <div className="relative z-10">
        <header
          className="sticky top-0 z-50 px-8 py-4 flex items-center justify-between"
          style={{
            background: 'rgba(8, 11, 16, 0.92)',
            borderBottom: '1px solid var(--border-subtle)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(240, 165, 0, 0.15)', border: '1px solid var(--amber-dim)' }}
              >
                <Zap size={16} style={{ color: 'var(--amber)' }} />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-wide" style={{ color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}>
                  LLM JUDGE
                </h1>
                <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
                  Multi-model evaluation engine
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {session && (
              <button
                onClick={() => { setSession(null); sessionRef.current = null; }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                <Trash2 size={12} />
                Clear
              </button>
            )}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                fontFamily: 'DM Mono, monospace',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: config.baseUrl && config.apiKey ? 'var(--green-signal)' : 'var(--text-muted)' }}
              />
              {config.baseUrl && config.apiKey ? 'Connected' : 'Not configured'}
            </div>
          </div>
        </header>

        <div className="flex h-[calc(100vh-65px)]">
          <aside
            className="w-80 flex-shrink-0 overflow-y-auto p-4 space-y-3"
            style={{ borderRight: '1px solid var(--border-subtle)', background: 'rgba(13, 17, 23, 0.6)' }}
          >
            <ConfigPanel config={config} onChange={setConfig} />
            <ModelSelector
              selectedModels={selectedModels}
              availableModels={availableModels}
              judgeModel={judgeModel}
              loadingModels={loadingModels}
              onFetchModels={fetchModels}
              onAddModel={(modelId) => {
                if (!selectedModels.includes(modelId)) {
                  setSelectedModels((prev) => [...prev, modelId]);
                }
              }}
              onRemoveModel={(modelId) => {
                setSelectedModels((prev) => prev.filter((id) => id !== modelId));
                if (judgeModel === modelId) setJudgeModel('');
              }}
              onSetJudge={setJudgeModel}
            />
          </aside>

          <main className="flex-1 flex flex-col overflow-hidden">
            <div
              className="p-4 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(13, 17, 23, 0.8)' }}
            >
              <div className="flex gap-3">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canRun) handleRun();
                  }}
                  placeholder="Enter your evaluation prompt... (⌘+Enter to run)"
                  rows={3}
                  className="flex-1 px-4 py-3 rounded-xl text-sm resize-none outline-none transition-all"
                  style={{
                    background: 'var(--bg-panel)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    lineHeight: '1.6',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--amber-dim)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                />
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleRun}
                    disabled={!canRun}
                    className="px-5 py-3 rounded-xl flex items-center gap-2 text-sm font-semibold transition-all"
                    style={{
                      background: canRun ? 'var(--amber)' : 'var(--bg-elevated)',
                      color: canRun ? '#080b10' : 'var(--text-muted)',
                      border: `1px solid ${canRun ? 'var(--amber)' : 'var(--border-subtle)'}`,
                      cursor: canRun ? 'pointer' : 'not-allowed',
                      boxShadow: canRun ? '0 0 20px rgba(240, 165, 0, 0.3)' : 'none',
                    }}
                  >
                    {isRunning ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    {isRunning ? 'Running' : 'Run'}
                  </button>
                  {selectedModels.length > 0 && (
                    <div className="text-center text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
                      {selectedModels.length} model{selectedModels.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
              {selectedModels.length === 0 && (
                <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
                  ← Add models in the sidebar to begin evaluation
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {!session && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                      style={{ background: 'rgba(240, 165, 0, 0.08)', border: '1px solid rgba(240, 165, 0, 0.2)' }}
                    >
                      <Zap size={28} style={{ color: 'var(--amber-dim)' }} />
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Configure connection, select models, enter a prompt
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
                      All models run in parallel — judge evaluates last
                    </p>
                  </div>
                </div>
              )}

              {session && (
                <>
                  <div
                    className="px-4 py-3 rounded-lg"
                    style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}
                  >
                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
                      PROMPT
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {session.prompt}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 items-start">
                    {session.models.map((run, index) => (
                      <ModelOutputCard
                        key={run.modelId}
                        run={run}
                        color={MODEL_COLORS[index % MODEL_COLORS.length]}
                        isWinner={session.judge.winnerModelId === run.modelId}
                        score={session.judge.scores[run.modelId]}
                      />
                    ))}
                  </div>

                  <JudgePanel analysis={session.judge} />
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
