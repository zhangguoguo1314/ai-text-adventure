'use client';

import { useState, useCallback } from 'react';
import api from '@/lib/api';

export interface ApiConfig {
  id: number;
  provider: string;
  baseUrl: string;
  maskedKey: string;
  model: string;
  status: string;
  priority: number;
  createdAt: string;
}

export function useCustomApi() {
  const [configs, setConfigs] = useState<ApiConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    id: number;
    success: boolean;
    message: string;
  } | null>(null);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/user/custom-ai');
      setConfigs(res.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const addConfig = useCallback(
    async (data: {
      provider: string;
      baseUrl: string;
      apiKey: string;
      model: string;
    }) => {
      const res: any = await api.post('/user/custom-ai', data);
      await fetchConfigs();
      return res.data as ApiConfig;
    },
    [fetchConfigs],
  );

  const updateConfig = useCallback(
    async (
      id: number,
      data: {
        provider?: string;
        baseUrl?: string;
        apiKey?: string;
        model?: string;
      },
    ) => {
      const res: any = await api.put(`/user/custom-ai/${id}`, data);
      await fetchConfigs();
      return res.data as ApiConfig;
    },
    [fetchConfigs],
  );

  const deleteConfig = useCallback(
    async (id: number) => {
      await api.delete(`/user/custom-ai/${id}`);
      await fetchConfigs();
    },
    [fetchConfigs],
  );

  const testConnection = useCallback(async (id: number) => {
    setTestResult(null);
    try {
      const res: any = await api.post(`/user/custom-ai/${id}/test`);
      const result = { id, success: res.success, message: res.message };
      setTestResult(result);
      if (res.success) await fetchConfigs();
      return result;
    } catch {
      const result = { id, success: false, message: '请求失败' };
      setTestResult(result);
      return result;
    }
  }, [fetchConfigs]);

  const setDefault = useCallback(
    async (id: number) => {
      await api.put(`/user/custom-ai/${id}/default`);
      await fetchConfigs();
    },
    [fetchConfigs],
  );

  return {
    configs,
    loading,
    testResult,
    fetchConfigs,
    addConfig,
    updateConfig,
    deleteConfig,
    testConnection,
    setDefault,
  };
}
