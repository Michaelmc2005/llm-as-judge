'use client';

import { useCallback } from 'react';
import OpenAI from 'openai';
import type { LLMConfig, ModelRun } from '../types';
import { normalizeBaseUrl } from '../utils/normalizeBaseUrl';

interface JudgeOptions {
  originalPrompt: string;
  modelRuns: ModelRun[];
  judgeModel: string;
  onToken: (token: string) => void;
  onComplete: (winnerModelId: string | null, scores: Record<string, number>, reasoning: string) => void;
  onError: (error: string) => void;
}

const JUDGE_SYSTEM_PROMPT = `You are an impartial LLM evaluation judge. Your task is to analyse multiple AI model responses to the same prompt and determine which is best.

Evaluation criteria (weight each 0-10):
- Accuracy & correctness
- Completeness & depth  
- Clarity & structure
- Reasoning quality
- Practical utility

After your analysis, you MUST end your response with a JSON block in exactly this format:
\`\`\`json
{
  "winner": "<model_id>",
  "scores": {
    "<model_id>": <score_0_to_100>
  },
  "brief_reasoning": "<one sentence>"
}
\`\`\`

Be objective. Do not favour verbose responses over concise ones unless depth genuinely improves quality.`;

// ~2 000 chars ≈ ~500 tokens; keeps the combined judge request well within
// typical proxy body limits and LLM context windows.
const MAX_MODEL_OUTPUT_CHARS = 2000;

function truncateOutput(output: string): string {
  if (output.length <= MAX_MODEL_OUTPUT_CHARS) return output;
  return output.slice(0, MAX_MODEL_OUTPUT_CHARS) + '\n…[truncated]';
}

function buildJudgePrompt(originalPrompt: string, modelRuns: ModelRun[]): string {
  const sections = modelRuns
    .filter((run) => run.status === 'complete')
    .map((run) => `=== MODEL: ${run.modelId} ===\n${truncateOutput(run.output)}\n`)
    .join('\n');

  return `ORIGINAL USER PROMPT:\n${originalPrompt}\n\n${sections}\n\nAnalyse the above responses and provide your evaluation.`;
}

export function useJudge(config: LLMConfig) {
  const runJudge = useCallback(
    async ({
      originalPrompt,
      modelRuns,
      judgeModel,
      onToken,
      onComplete,
      onError,
    }: JudgeOptions) => {
      try {
        const client = new OpenAI({
          baseURL: normalizeBaseUrl(config.baseUrl),
          apiKey: config.apiKey,
          dangerouslyAllowBrowser: true,
        });

        const userPrompt = buildJudgePrompt(originalPrompt, modelRuns);
        let fullOutput = '';

        const stream = await client.chat.completions.create({
          model: judgeModel,
          messages: [
            { role: 'system', content: JUDGE_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          stream: true,
          max_tokens: 3000,
        });

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            fullOutput += delta;
            onToken(delta);
          }
        }

        let winnerModelId: string | null = null;
        let scores: Record<string, number> = {};
        let briefReasoning = '';

        const jsonMatch = fullOutput.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            winnerModelId = parsed.winner ?? null;
            scores = parsed.scores ?? {};
            briefReasoning = parsed.brief_reasoning ?? '';
          } catch {
            // JSON parse failed — winner remains null
          }
        }

        onComplete(winnerModelId, scores, briefReasoning);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Judge inference failed';
        onError(message);
      }
    },
    [config.baseUrl, config.apiKey]
  );

  return { runJudge };
}
