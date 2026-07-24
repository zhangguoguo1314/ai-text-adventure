'use client';

import { useState, useCallback } from 'react';
import api from '@/lib/api';
import type { ScriptTemplate } from '@/types';

/* ===== 类型定义 ===== */

export type TemplateSort = 'hot' | 'newest' | 'rating';

export interface TemplateListParams {
  category?: string;
  sort?: TemplateSort;
  page?: number;
  limit?: number;
  keyword?: string;
}

interface TemplateListResult {
  items: ScriptTemplate[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/* ===== Hook ===== */

export function useTemplates() {
  const [list, setList] = useState<ScriptTemplate[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(
    async <T,>(fn: () => Promise<ApiResponse<T>>): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fn();
        if (res.success) {
          return (res.data ?? null) as T | null;
        }
        setError(res.message || '请求失败');
        return null;
      } catch {
        setError('网络错误，请稍后重试');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchList = useCallback(
    async (params: TemplateListParams) => {
      const data = await request<TemplateListResult>(() =>
        api.get('/templates', { params }),
      );
      if (data) {
        setList(data.items);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setPage(data.page);
      }
      return data;
    },
    [request],
  );

  const fetchDetail = useCallback(
    (id: number) =>
      request<ScriptTemplate>(() => api.get(`/templates/${id}`)),
    [request],
  );

  const apply = useCallback(
    (id: number) =>
      request<{ scriptId: number; title: string }>(() =>
        api.post(`/templates/${id}/apply`),
      ),
    [request],
  );

  const create = useCallback(
    (payload: {
      scriptId: number;
      name: string;
      description?: string;
      category?: string;
      coverEmoji?: string;
    }) => request<ScriptTemplate>(() => api.post('/templates', payload)),
    [request],
  );

  const rate = useCallback(
    (id: number, rating: number) =>
      request<{ rating: number; ratingCount: number }>(() =>
        api.post(`/templates/${id}/rate`, { rating }),
      ),
    [request],
  );

  const remove = useCallback(
    (id: number) => request<{ message: string }>(() => api.delete(`/templates/${id}`)),
    [request],
  );

  return {
    list,
    total,
    totalPages,
    page,
    loading,
    error,
    setError,
    fetchList,
    fetchDetail,
    apply,
    create,
    rate,
    remove,
  };
}

/* ===== 分类与排序元数据（供 UI 复用） ===== */

export const TEMPLATE_CATEGORIES: Array<{
  key: string;
  label: string;
  emoji: string;
}> = [
  { key: 'all', label: '全部', emoji: '🌟' },
  { key: 'adventure', label: '冒险', emoji: '🧭' },
  { key: 'romance', label: '恋爱', emoji: '💕' },
  { key: 'mystery', label: '悬疑', emoji: '🔍' },
  { key: 'horror', label: '恐怖', emoji: '👻' },
  { key: 'scifi', label: '科幻', emoji: '🚀' },
  { key: 'fantasy', label: '奇幻', emoji: '⚔️' },
  { key: 'school', label: '校园', emoji: '🎒' },
  { key: 'wuxia', label: '武侠', emoji: '🗡️' },
];

export const TEMPLATE_SORTS: Array<{ key: TemplateSort; label: string }> = [
  { key: 'hot', label: '热门' },
  { key: 'newest', label: '最新' },
  { key: 'rating', label: '评分' },
];

export function getCategoryLabel(key: string): string {
  return TEMPLATE_CATEGORIES.find((c) => c.key === key)?.label || key;
}
