'use client';

import { useState, useCallback } from 'react';
import OpenAI from 'openai';
import type { LLMConfig, ModelOption } from '../types';
import { normalizeBaseUrl } from '../utils/normalizeBaseUrl';

interface UseModelsReturn {
  models: ModelOption[];
  loading: boolean;
  error: string | null;
  fetchModels: () => Promise<void>;
}

export function useModels(config: LLMConfig): UseModelsReturn {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
    if (!config.baseUrl || !config.apiKey) {
      setError('Base URL and API key are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = new OpenAI({
        baseURL: normalizeBaseUrl(config.baseUrl),
        apiKey: config.apiKey,
        dangerouslyAllowBrowser: true,
      });

      const response = await client.models.list();
      const fetched: ModelOption[] = response.data.map((model) => ({
        id: model.id,
        label: model.id,
      }));

      setModels(fetched);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch models';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [config.baseUrl, config.apiKey]);

  return { models, loading, error, fetchModels };
}
