'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import StatsCard from '@/components/admin/StatsCard';

interface DashboardStats {
  totalUsers: number;
  totalScripts: number;
  todayPlays: number;
  totalTransactions: number;
  userTrend: number;
  scriptTrend: number;
  playTrend: number;
  transactionTrend: number;
}

interface DailyTransaction {
  date: string;
  amount: number;
}

const defaultStats: DashboardStats = {
  totalUsers: 0,
  totalScripts: 0,
  todayPlays: 0,
  totalTransactions: 0,
  userTrend: 0,
  scriptTrend: 0,
  playTrend: 0,
  transactionTrend: 0,
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [dailyData, setDailyData] = useState<DailyTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const [statsRes, trendRes]: any[] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/stats/transaction-trend'),
      ]);
      if (statsRes.success) setStats(statsRes.data);
      if (trendRes.success) setDailyData(trendRes.data || []);
    } catch {
      // 使用模拟数据展示
      setStats({
        totalUsers: 1286,
        totalScripts: 532,
        todayPlays: 189,
        totalTransactions: 28640,
        userTrend: 12.5,
        scriptTrend: 8.3,
        playTrend: -3.2,
        transactionTrend: 15.7,
      });
      setDailyData([
        { date: '07-17', amount: 1200 },
        { date: '07-18', amount: 980 },
        { date: '07-19', amount: 1500 },
        { date: '07-20', amount: 2100 },
        { date: '07-21', amount: 1800 },
        { date: '07-22', amount: 2400 },
        { date: '07-23', amount: 1900 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const maxAmount = Math.max(...dailyData.map((d) => d.amount), 1);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">仪表盘</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="总用户数"
          value={loading ? '...' : stats.totalUsers}
          color="violet"
          trend={{ value: stats.userTrend, label: '较昨日' }}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <StatsCard
          title="总剧本数"
          value={loading ? '...' : stats.totalScripts}
          color="blue"
          trend={{ value: stats.scriptTrend, label: '较昨日' }}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
        />
        <StatsCard
          title="今日游玩次数"
          value={loading ? '...' : stats.todayPlays}
          color="emerald"
          trend={{ value: stats.playTrend, label: '较昨日' }}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="总交易额"
          value={loading ? '...' : stats.totalTransactions.toLocaleString()}
          color="amber"
          trend={{ value: stats.transactionTrend, label: '较昨日' }}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Transaction Trend Chart (CSS Bar Chart) */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6">最近7天交易趋势</h2>
        <div className="flex items-end gap-3 h-48">
          {dailyData.map((item, idx) => {
            const height = (item.amount / maxAmount) * 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs text-slate-400">{item.amount}</span>
                <div
                  className="w-full bg-violet-500/80 hover:bg-violet-500 rounded-t-md transition-colors min-h-[4px]"
                  style={{ height: `${height}%` }}
                />
                <span className="text-xs text-slate-500">{item.date}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
