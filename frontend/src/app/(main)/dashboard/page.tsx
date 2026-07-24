'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useAnalytics } from '@/lib/useAnalytics';
import type {
  DashboardData,
  ScriptStat,
  ChartPoint,
  AudienceData,
} from '@/lib/useAnalytics';
import StatCard from '@/components/dashboard/StatCard';
import BarChart from '@/components/dashboard/BarChart';
import LineChart from '@/components/dashboard/LineChart';
import MiniChart from '@/components/dashboard/MiniChart';
import DonutChart from '@/components/dashboard/DonutChart';
import Loading from '@/components/common/Loading';
import PageTransition from '@/components/common/PageTransition';

/* ===== 分类与状态映射 ===== */

const categoryLabels: Record<string, string> = {
  adventure: '冒险',
  romance: '恋爱',
  mystery: '悬疑',
  scifi: '科幻',
  horror: '恐怖',
  fantasy: '奇幻',
  comedy: '搞笑',
  other: '其他',
};

const categoryColors: Record<string, string> = {
  adventure: '#7c3aed',
  romance: '#f43f5e',
  mystery: '#6366f1',
  scifi: '#06b6d4',
  horror: '#ef4444',
  fantasy: '#10b981',
  comedy: '#f59e0b',
  other: '#64748b',
};

const fallbackPalette = [
  '#7c3aed',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#f43f5e',
  '#06b6d4',
  '#6366f1',
  '#64748b',
];

const statusMap: Record<string, { label: string; cls: string }> = {
  draft: { label: '草稿', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  reviewing: { label: '审核中', cls: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
  published: { label: '已发布', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  rejected: { label: '已拒绝', cls: 'bg-rose-500/15 text-rose-600 dark:text-rose-400' },
  archived: { label: '已归档', cls: 'bg-slate-500/15 text-slate-500' },
};

/* ===== 工具函数 ===== */

/** YYYY-MM-DD -> MM-DD */
function shortDate(date: string): string {
  const parts = date.split('-');
  if (parts.length !== 3) return date;
  return `${parts[1]}-${parts[2]}`;
}

function formatNumber(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}w`;
  return n.toLocaleString();
}

export default function DashboardPage() {
  const { isAuthenticated } = useAuthStore();
  const {
    loading,
    error,
    fetchDashboard,
    fetchScriptsStats,
    fetchRevenueChart,
    fetchPlayChart,
    fetchAudience,
  } = useAnalytics();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [scriptsStats, setScriptsStats] = useState<ScriptStat[]>([]);
  const [revenueChart, setRevenueChart] = useState<ChartPoint[]>([]);
  const [playChart, setPlayChart] = useState<ChartPoint[]>([]);
  const [audience, setAudience] = useState<AudienceData | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      const [d, s, r, p, a] = await Promise.all([
        fetchDashboard(),
        fetchScriptsStats(),
        fetchRevenueChart(30),
        fetchPlayChart(30),
        fetchAudience(),
      ]);
      if (d) setDashboard(d);
      if (s) setScriptsStats(s);
      if (r) setRevenueChart(r);
      if (p) setPlayChart(p);
      if (a) setAudience(a);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // 未登录
  if (!isAuthenticated) {
    return (
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-[var(--ink)] mb-6">创作仪表盘</h1>
        <div className="bg-[var(--bg2)] rounded-xl p-8 text-center card-shadow">
          <p className="text-[var(--muted)] mb-4">请先登录后查看创作数据</p>
          <Link
            href="/login"
            className="inline-block px-6 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
          >
            去登录
          </Link>
        </div>
      </div>
    );
  }

  // 加载中（首次无数据）
  if (loading && !dashboard) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--ink)]">创作仪表盘</h1>
          <p className="text-sm text-[var(--muted)] mt-1">追踪你的剧本表现与收益</p>
        </div>
        <Loading text="正在加载创作数据..." />
      </div>
    );
  }

  // 图表数据转换
  const revenueBars = revenueChart.map((p) => ({
    label: shortDate(p.date),
    value: p.amount ?? 0,
  }));
  const playLine = playChart.map((p) => ({
    label: shortDate(p.date),
    value: p.count ?? 0,
  }));

  // 受众：分类分布
  const donutData = (audience?.categoryDistribution ?? []).map((c, i) => ({
    label: categoryLabels[c.category] || c.category,
    value: c.count,
    color: categoryColors[c.category] || fallbackPalette[i % fallbackPalette.length],
  }));

  // 受众：时段分布
  const hourlyBars = (audience?.hourlyDistribution ?? []).map((h) => ({
    label: `${h.hour}`,
    value: h.count,
  }));

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto">
        {/* 标题 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--ink)]">创作仪表盘</h1>
          <p className="text-sm text-[var(--muted)] mt-1">追踪你的剧本表现与收益</p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-2.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm">
            {error}
          </div>
        )}

        {/* 顶部统计卡片 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="总剧本数"
            value={dashboard?.totalScripts ?? 0}
            color="violet"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
          />
          <StatCard
            title="总游玩次数"
            value={formatNumber(dashboard?.totalPlayCount ?? 0)}
            color="blue"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="总收藏数"
            value={formatNumber(dashboard?.totalFavCount ?? 0)}
            color="rose"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            }
          />
          <StatCard
            title="总收入 (UU)"
            value={formatNumber(dashboard?.totalRevenue ?? 0)}
            color="emerald"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* 本月概览 */}
        <div className="bg-[var(--bg2)] rounded-xl p-4 mb-6 card-shadow border border-[var(--rule)] flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
          <span className="text-[var(--muted)]">本月概览</span>
          <span className="text-[var(--ink)]">
            新增游玩 <span className="font-semibold text-blue-500">{formatNumber(dashboard?.monthPlayCount ?? 0)}</span> 次
          </span>
          <span className="text-[var(--ink)]">
            本月收入 <span className="font-semibold text-emerald-500">{formatNumber(dashboard?.monthRevenue ?? 0)}</span> UU
          </span>
          <span className="text-[var(--ink)]">
            已发布 <span className="font-semibold text-violet-500">{dashboard?.publishedCount ?? 0}</span> / 草稿 <span className="font-semibold text-amber-500">{dashboard?.draftCount ?? 0}</span>
          </span>
          <span className="text-[var(--ink)]">
            总评论 <span className="font-semibold text-rose-500">{formatNumber(dashboard?.totalComments ?? 0)}</span>
          </span>
        </div>

        {/* 中间：收入趋势 + 游玩趋势 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-[var(--bg2)] rounded-xl p-5 card-shadow border border-[var(--rule)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[var(--ink)]">收入趋势</h2>
              <span className="text-xs text-[var(--muted)]">最近 30 天 · UU币</span>
            </div>
            {revenueBars.length > 0 ? (
              <BarChart
                data={revenueBars}
                color="var(--success)"
                height={200}
                formatValue={(v) => `${v} UU`}
              />
            ) : (
              <EmptyChart />
            )}
          </div>

          <div className="bg-[var(--bg2)] rounded-xl p-5 card-shadow border border-[var(--rule)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[var(--ink)]">游玩趋势</h2>
              <span className="text-xs text-[var(--muted)]">最近 30 天</span>
            </div>
            {playLine.length > 0 ? (
              <LineChart
                data={playLine}
                color="var(--accent)"
                height={200}
                formatValue={(v) => `${v} 次`}
              />
            ) : (
              <EmptyChart />
            )}
          </div>
        </div>

        {/* 下方：剧本数据表格 */}
        <div className="bg-[var(--bg2)] rounded-xl p-5 card-shadow border border-[var(--rule)] mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[var(--ink)]">我的剧本数据</h2>
            <Link
              href="/my-works"
              className="text-xs text-[var(--accent)] hover:underline"
            >
              管理作品 →
            </Link>
          </div>
          {scriptsStats.length === 0 ? (
            <div className="py-10 text-center text-sm text-[var(--muted)]">
              暂无剧本，<Link href="/create" className="text-[var(--accent)] hover:underline">开始创作</Link> 第一部作品吧
            </div>
          ) : (
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-sm min-w-[680px]">
                <thead>
                  <tr className="text-left text-xs text-[var(--muted)] border-b border-[var(--rule)]">
                    <th className="py-2.5 pr-3 font-medium">剧本</th>
                    <th className="py-2.5 px-3 font-medium">状态</th>
                    <th className="py-2.5 px-3 font-medium text-right">游玩</th>
                    <th className="py-2.5 px-3 font-medium text-right">收藏</th>
                    <th className="py-2.5 px-3 font-medium text-right">评论</th>
                    <th className="py-2.5 px-3 font-medium text-right">收入</th>
                    <th className="py-2.5 pl-3 font-medium">近7天趋势</th>
                  </tr>
                </thead>
                <tbody>
                  {scriptsStats.map((s) => {
                    const st = statusMap[s.status] || { label: s.status, cls: 'bg-slate-500/15 text-slate-500' };
                    return (
                      <tr
                        key={s.id}
                        className="border-b border-[var(--rule)] last:border-0 hover:bg-[var(--bg3)]/40 transition-colors"
                      >
                        <td className="py-3 pr-3">
                          <Link
                            href={`/editor/${s.id}`}
                            className="font-medium text-[var(--ink)] hover:text-[var(--accent)] truncate block max-w-[180px]"
                            title={s.title}
                          >
                            {s.title}
                          </Link>
                          <span className="text-xs text-[var(--muted)]">
                            {categoryLabels[s.category] || s.category}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${st.cls}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-[var(--ink)]">
                          {formatNumber(s.playCount)}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-[var(--ink)]">
                          {formatNumber(s.favCount)}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-[var(--ink)]">
                          {formatNumber(s.commentCount)}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                          {s.revenue}
                        </td>
                        <td className="py-3 pl-3">
                          <MiniChart data={s.trend} color="var(--accent)" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 底部：受众分析 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[var(--bg2)] rounded-xl p-5 card-shadow border border-[var(--rule)]">
            <h2 className="font-semibold text-[var(--ink)] mb-4">游玩分类分布</h2>
            {donutData.length > 0 ? (
              <DonutChart data={donutData} size={170} />
            ) : (
              <EmptyChart />
            )}
          </div>

          <div className="bg-[var(--bg2)] rounded-xl p-5 card-shadow border border-[var(--rule)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[var(--ink)]">游玩时段分布</h2>
              <span className="text-xs text-[var(--muted)]">0 - 23 点</span>
            </div>
            {hourlyBars.some((b) => b.value > 0) ? (
              <BarChart
                data={hourlyBars}
                color="var(--accent2)"
                height={180}
                formatValue={(v) => `${v} 次`}
              />
            ) : (
              <EmptyChart />
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

/* ===== 局部空状态 ===== */

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-[180px] text-sm text-[var(--muted)]">
      暂无数据
    </div>
  );
}
