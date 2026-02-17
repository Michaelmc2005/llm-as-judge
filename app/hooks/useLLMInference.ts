'use client';

import { useCallback } from 'react';
import OpenAI from 'openai';
import type { LLMConfig } from '../types';
import { normalizeBaseUrl } from '../utils/normalizeBaseUrl';

interface InferenceOptions {
  model: string;
  prompt: string;
  systemPrompt?: string;
  onToken: (token: string) => void;
  onComplete: (totalTokens: number, latencyMs: number) => void;
  onError: (error: string) => void;
}

export function useLLMInference(config: LLMConfig) {
  const runInference = useCallback(
    async ({
      model,
      prompt,
      systemPrompt,
      onToken,
      onComplete,
      onError,
    }: InferenceOptions) => {
      const startTime = performance.now();
      let totalTokens = 0;

      try {
        const client = new OpenAI({
          baseURL: normalizeBaseUrl(config.baseUrl),
          apiKey: config.apiKey,
          dangerouslyAllowBrowser: true,
        });

        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

        if (systemPrompt) {
          messages.push({ role: 'system', content: systemPrompt });
        }

        messages.push({ role: 'user', content: prompt });

        const stream = await client.chat.completions.create({
          model,
          messages,
          stream: true,
          max_tokens: 2048,
        });

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            onToken(delta);
            totalTokens += 1;
          }

          if (chunk.usage) {
            totalTokens = chunk.usage.total_tokens ?? totalTokens;
          }
        }

        const latencyMs = Math.round(performance.now() - startTime);
        onComplete(totalTokens, latencyMs);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Inference failed';
        onError(message);
      }
    },
    [config.baseUrl, config.apiKey]
  );

  return { runInference };
}
