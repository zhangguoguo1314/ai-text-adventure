'use client';

import { useState, useCallback } from 'react';
import api from '@/lib/api';

/* ===== 类型定义 ===== */

export interface DashboardData {
  totalScripts: number;
  publishedCount: number;
  draftCount: number;
  totalPlayCount: number;
  totalFavCount: number;
  totalComments: number;
  totalRevenue: number;
  monthPlayCount: number;
  monthRevenue: number;
}

export interface ScriptStat {
  id: number;
  title: string;
  status: string;
  category: string;
  playCount: number;
  favCount: number;
  commentCount: number;
  revenue: number;
  trendLabels: string[];
  trend: number[];
}

export interface ChartPoint {
  date: string;
  amount?: number;
  count?: number;
}

export interface AudienceData {
  categoryDistribution: Array<{ category: string; count: number }>;
  hourlyDistribution: Array<{ hour: number; count: number }>;
}

/* ===== Hook ===== */

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export function useAnalytics() {
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

  const fetchDashboard = useCallback(
    () => request<DashboardData>(() => api.get('/analytics/creator/dashboard')),
    [request],
  );

  const fetchScriptsStats = useCallback(
    () => request<ScriptStat[]>(() => api.get('/analytics/creator/scripts-stats')),
    [request],
  );

  const fetchRevenueChart = useCallback(
    (days = 30) =>
      request<ChartPoint[]>(() =>
        api.get('/analytics/creator/revenue-chart', { params: { days } }),
      ),
    [request],
  );

  const fetchPlayChart = useCallback(
    (days = 30) =>
      request<ChartPoint[]>(() =>
        api.get('/analytics/creator/play-chart', { params: { days } }),
      ),
    [request],
  );

  const fetchAudience = useCallback(
    () => request<AudienceData>(() => api.get('/analytics/creator/audience')),
    [request],
  );

  return {
    loading,
    error,
    setError,
    fetchDashboard,
    fetchScriptsStats,
    fetchRevenueChart,
    fetchPlayChart,
    fetchAudience,
  };
}
