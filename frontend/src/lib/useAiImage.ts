'use client';

import { useState, useCallback } from 'react';
import api from '@/lib/api';

interface AiImageResult {
  success: boolean;
  url: string;
  message?: string;
}

export interface AiImageData {
  name?: string;
  personality?: string;
  style?: string;
  description?: string;
  title?: string;
  desc?: string;
  category?: string;
  mood?: string;
}

/** 从 catch 到的错误对象中提取可读消息 */
function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const e = err as { response?: { data?: { message?: string } }; message?: string };
    if (e.response?.data?.message) return e.response.data.message;
    if (e.message) return e.message;
  }
  return fallback;
}

/**
 * AI 图片生成 Hook
 * 管理 loading 与 error 状态，提供头像 / 场景 / 封面三种生成方法。
 */
export function useAiImage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const reset = useCallback(() => {
    setImageUrl(null);
    setError(null);
  }, []);

  const run = useCallback(
    async (
      endpoint: string,
      body: Record<string, unknown>,
      fallbackMsg: string,
    ): Promise<string | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = (await api.post(endpoint, body)) as AiImageResult;
        if (result?.success && result.url) {
          setImageUrl(result.url);
          return result.url;
        }
        throw new Error(result?.message || '生成失败');
      } catch (err) {
        setError(extractErrorMessage(err, fallbackMsg));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const generateAvatar = useCallback(
    (name: string, personality: string, style?: string) =>
      run('/ai-image/generate-avatar', { name, personality, style }, '生成头像失败'),
    [run],
  );

  const generateScene = useCallback(
    (description: string, mood?: string) =>
      run('/ai-image/generate-scene', { description, mood }, '生成场景插图失败'),
    [run],
  );

  const generateCover = useCallback(
    (title: string, desc: string, category: string) =>
      run('/ai-image/generate-cover', { title, desc, category }, '生成封面失败'),
    [run],
  );

  return {
    loading,
    error,
    imageUrl,
    setImageUrl,
    reset,
    generateAvatar,
    generateScene,
    generateCover,
  };
}
