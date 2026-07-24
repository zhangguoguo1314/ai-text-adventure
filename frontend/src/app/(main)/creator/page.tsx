'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import api from '@/lib/api';
import { formatNumber, formatDate } from '@/lib/utils';
import PageTransition from '@/components/common/PageTransition';

/* ===== 类型定义 ===== */

interface LevelProgress {
  current: number;
  target: number;
  percentage: number;
}

interface CreatorLevel {
  level: number;
  title: string;
  isVerified: boolean;
  totalPlays: number;
  totalIncome: number;
  totalScripts: number;
  avgRating: number;
  progress: LevelProgress | null;
  nextLevel: { level: number; title: string } | null;
}

interface LevelConfigItem {
  level: number;
  title: string;
  threshold: number;
  icon: string;
  color: string;
  benefits: string[];
}

interface IncomeRecord {
  id: number;
  scriptId: number;
  scriptTitle: string;
  amount: number;
  playCount: number;
  date: string;
}

interface IncomeData {
  list: IncomeRecord[];
  total: number;
  page: number;
  totalPages: number;
  totalAmount: number;
}

interface RankingItem {
  rank: number;
  userId: number;
  nickname: string;
  avatar: string | null;
  level: number;
  totalPlays: number;
  totalIncome: number;
  totalScripts: number;
}

/* ===== 常量 ===== */

type RangeType = 'week' | 'month' | 'total';

const PAGE_SIZE = 10;

const RANGES: { label: string; value: RangeType }[] = [
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '全部', value: 'total' },
];

// 等级体系兜底配置（5个等级）
const LEVELS_FALLBACK: LevelConfigItem[] = [
  {
    level: 1,
    title: '新人',
    threshold: 0,
    icon: '🌱',
    color: '#22c55e',
    benefits: ['创作入门', '基础分成比例', '社区展示'],
  },
  {
    level: 2,
    title: '潜力',
    threshold: 1000,
    icon: '🚀',
    color: '#3b82f6',
    benefits: ['分成比例提升', '首页推荐位', '数据分析'],
  },
  {
    level: 3,
    title: '人气',
    threshold: 10000,
    icon: '⭐',
    color: '#f59e0b',
    benefits: ['高比例分成', '专属客服', '活动优先'],
  },
  {
    level: 4,
    title: '明星',
    threshold: 100000,
    icon: '🌟',
    color: '#ec4899',
    benefits: ['最高分成比例', '星河头像框', '官方认证标识', '定制皮肤'],
  },
  {
    level: 5,
    title: '传奇',
    threshold: 1000000,
    icon: '👑',
    color: '#7c3aed',
    benefits: ['传奇专属头衔', '全站置顶推荐', '分成特权', '线下活动邀请'],
  },
];

function medalStyle(rank: number): string {
  if (rank === 1) return 'bg-gradient-to-br from-amber-300 to-amber-500 text-white';
  if (rank === 2) return 'bg-gradient-to-br from-slate-300 to-slate-400 text-white';
  if (rank === 3) return 'bg-gradient-to-br from-orange-300 to-orange-500 text-white';
  return 'bg-[var(--bg3)] text-[var(--muted)]';
}

/* ===== 主页面 ===== */

export default function CreatorPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { updateBalance } = useAppStore();

  const [level, setLevel] = useState<CreatorLevel | null>(null);
  const [levels, setLevels] = useState<LevelConfigItem[]>([]);
  const [incomeData, setIncomeData] = useState<IncomeData | null>(null);
  const [ranking, setRanking] = useState<RankingItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [incomeLoading, setIncomeLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [range, setRange] = useState<RangeType>('week');
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchLevel = useCallback(async () => {
    try {
      const res: any = await api.get('/creator/level');
      if (res.success) {
        setLevel(res.data);
      }
    } catch {
      // 忽略
    }
  }, []);

  const fetchLevels = useCallback(async () => {
    try {
      const res: any = await api.get('/creator/levels');
      if (res.success) {
        setLevels(res.data.levels ?? res.data ?? []);
      }
    } catch {
      // 忽略
    }
  }, []);

  const fetchIncome = useCallback(async (r: RangeType, p: number) => {
    setIncomeLoading(true);
    try {
      const res: any = await api.get('/creator/income', {
        params: { range: r, page: p, pageSize: PAGE_SIZE },
      });
      if (res.success) {
        setIncomeData(res.data);
      }
    } catch {
      // 忽略
    } finally {
      setIncomeLoading(false);
    }
  }, []);

  const fetchRanking = useCallback(async () => {
    try {
      const res: any = await api.get('/creator/ranking');
      if (res.success) {
        setRanking(res.data.list ?? res.data ?? []);
      }
    } catch {
      // 忽略
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      await Promise.all([fetchLevel(), fetchLevels(), fetchIncome('week', 1), fetchRanking()]);
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleRangeChange = (r: RangeType) => {
    setRange(r);
    setPage(1);
    fetchIncome(r, 1);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchIncome(range, p);
  };

  // 手动刷新等级统计
  const handleRefresh = async () => {
    setRefreshing(true);
    setMessage(null);
    try {
      const res: any = await api.post('/creator/level/refresh');
      if (res.success) {
        setMessage({ type: 'success', text: res.message || '等级统计已刷新' });
        if (res.data) setLevel(res.data);
        else await fetchLevel();
        // 同步刷新侧边栏余额
        try {
          const bal: any = await api.get('/user/balance');
          if (bal.success && bal.data) {
            updateBalance(bal.data.permanentBalance, bal.data.tempBalance);
          }
        } catch {
          // 忽略余额刷新失败
        }
      } else {
        setMessage({ type: 'error', text: res.message || '刷新失败，请稍后重试' });
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || '刷新失败，请稍后重试',
      });
    } finally {
      setRefreshing(false);
    }
  };

  // 未登录
  if (!isAuthenticated) {
    return (
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-[var(--ink)] mb-6">创作者中心</h1>
        <div className="bg-[var(--bg2)] rounded-xl p-8 text-center card-shadow">
          <p className="text-[var(--muted)] mb-4">请先登录后查看创作者中心</p>
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

  const levelConfigs = levels.length ? levels : LEVELS_FALLBACK;
  const currentLevelConfig = levelConfigs.find((l) => l.level === level?.level);
  const incomes = incomeData?.list ?? [];

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto">
        {/* 标题 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--ink)]">创作者中心</h1>
            <p className="text-sm text-[var(--muted)] mt-1">管理你的创作者等级、收益与分成</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-lg border border-[var(--rule)] bg-[var(--bg2)] text-sm font-medium text-[var(--ink)] hover:bg-[var(--bg3)] disabled:opacity-50 transition-colors flex-shrink-0"
          >
            <svg
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {refreshing ? '刷新中...' : '刷新统计'}
          </button>
        </div>

        {message && (
          <div
            className={`mb-4 px-4 py-2.5 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="h-56 bg-[var(--bg3)] rounded-xl animate-pulse" />
            <div className="h-40 bg-[var(--bg3)] rounded-xl animate-pulse" />
            <div className="h-64 bg-[var(--bg3)] rounded-xl animate-pulse" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* 创作者等级展示卡片 */}
            <div
              className="rounded-xl p-6 card-shadow text-white relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${currentLevelConfig?.color || '#7c3aed'} 0%, #6d28d9 100%)`,
              }}
            >
              {/* 装饰光斑 */}
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-16 -left-8 w-40 h-40 rounded-full bg-white/5 blur-2xl" />

              <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
                {/* 头像 + 星河框 */}
                <div className="flex-shrink-0">
                  <div
                    className={`relative w-20 h-20 rounded-full p-[3px] ${
                      level?.isVerified
                        ? 'bg-gradient-to-br from-amber-300 via-fuchsia-400 to-violet-500'
                        : 'bg-white/20'
                    }`}
                  >
                    <div className="w-full h-full rounded-full bg-[var(--bg2)] overflow-hidden flex items-center justify-center text-2xl font-bold text-[var(--accent)]">
                      {user?.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.avatar}
                          alt={user.nickname}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user?.nickname?.[0] || 'U'
                      )}
                    </div>
                    {level?.isVerified && (
                      <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center border-2 border-[var(--bg2)]">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </span>
                    )}
                  </div>
                </div>

                {/* 等级信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-lg font-bold truncate">{user?.nickname}</span>
                    {level?.isVerified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-xs font-medium">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        星河创作者
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-sm font-bold">
                      <span>{currentLevelConfig?.icon || '🌱'}</span>
                      Lv.{level?.level ?? 1} · {level?.title || '新人'}
                    </span>
                  </div>

                  {/* 等级进度条 */}
                  {level?.progress ? (
                    <div className="max-w-md">
                      <div className="flex items-center justify-between text-xs text-white/80 mb-1">
                        <span>
                          {formatNumber(level.progress.current)} / {formatNumber(level.progress.target)} 总游玩
                        </span>
                        <span className="font-bold">{level.progress.percentage}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-white transition-all duration-500"
                          style={{ width: `${Math.min(100, level.progress.percentage)}%` }}
                        />
                      </div>
                      {level.nextLevel && (
                        <p className="text-xs text-white/70 mt-1.5">
                          距离下一等级「{level.nextLevel.title}」还需{' '}
                          {formatNumber(Math.max(0, level.progress.target - level.progress.current))} 次游玩
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-white/80">
                      已达到最高等级，你是真正的传奇创作者
                    </p>
                  )}
                </div>
              </div>

              {/* 数据统计 */}
              <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/20">
                <div>
                  <p className="text-xs text-white/70 mb-0.5">总游玩数</p>
                  <p className="text-xl font-bold tabular-nums">{formatNumber(level?.totalPlays ?? 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-white/70 mb-0.5">总收入</p>
                  <p className="text-xl font-bold tabular-nums">
                    {formatNumber(level?.totalIncome ?? 0)}
                    <span className="text-xs font-normal text-white/70 ml-1">UU</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/70 mb-0.5">剧本数</p>
                  <p className="text-xl font-bold tabular-nums">{level?.totalScripts ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs text-white/70 mb-0.5">平均评分</p>
                  <p className="text-xl font-bold tabular-nums inline-flex items-center gap-1">
                    {(level?.avgRating ?? 0).toFixed(1)}
                    <svg className="w-4 h-4 text-amber-300" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </p>
                </div>
              </div>
            </div>

            {/* 等级体系说明 */}
            <div className="bg-[var(--bg2)] rounded-xl p-6 card-shadow">
              <h3 className="font-semibold text-[var(--ink)] mb-4">等级体系</h3>
              <div className="space-y-3">
                {levelConfigs.map((lv) => {
                  const isCurrent = lv.level === level?.level;
                  const isPassed = (level?.level ?? 0) >= lv.level;
                  return (
                    <div
                      key={lv.level}
                      className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                        isCurrent
                          ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                          : isPassed
                            ? 'border-[var(--rule)] bg-[var(--bg3)]/50'
                            : 'border-[var(--rule)] bg-[var(--bg)]/30'
                      }`}
                    >
                      <div
                        className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-xl font-bold"
                        style={{ backgroundColor: `${lv.color}20`, color: lv.color }}
                      >
                        {lv.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-medium text-[var(--ink)]">
                            Lv.{lv.level} · {lv.title}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] text-xs font-medium">
                              当前
                            </span>
                          )}
                          {isPassed && !isCurrent && (
                            <span className="px-2 py-0.5 rounded-full bg-[var(--success)]/20 text-[var(--success)] text-xs font-medium">
                              已达成
                            </span>
                          )}
                          <span className="text-xs text-[var(--muted)] ml-auto">
                            门槛：{formatNumber(lv.threshold)} 次游玩
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                          {lv.benefits.map((b, i) => (
                            <span key={i} className="text-xs text-[var(--muted)] inline-flex items-center gap-1">
                              <svg
                                className="w-3 h-3 text-[var(--success)] flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-[var(--muted)] mt-3">
                等级根据累计总游玩数自动评定，星河头像框为 Lv.4 及以上创作者专属标识。
              </p>
            </div>

            {/* 收益记录 */}
            <div className="bg-[var(--bg2)] rounded-xl p-6 card-shadow">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 className="font-semibold text-[var(--ink)]">收益记录</h3>
                <div className="flex gap-1 bg-[var(--bg3)] border border-[var(--rule)] rounded-lg p-1">
                  {RANGES.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => handleRangeChange(r.value)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        range === r.value
                          ? 'bg-[var(--accent)] text-white'
                          : 'text-[var(--muted)] hover:text-[var(--ink)]'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 区间汇总 */}
              {incomeData && (
                <div className="flex items-center gap-2 mb-4 px-4 py-2.5 rounded-lg bg-[var(--bg3)] text-sm">
                  <span className="text-[var(--muted)]">{RANGES.find((r) => r.value === range)?.label}收益合计</span>
                  <span className="font-bold text-[var(--warning)] tabular-nums">
                    {formatNumber(incomeData.totalAmount)}
                  </span>
                  <span className="text-[var(--muted)]">UU · 共 {incomeData.total} 条</span>
                </div>
              )}

              {incomeLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-14 bg-[var(--bg3)] rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : incomes.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-4xl mb-3">💰</p>
                  <p className="text-sm text-[var(--muted)] mb-1">暂无收益记录</p>
                  <p className="text-xs text-[var(--muted)]">
                    <Link href="/create" className="text-[var(--accent)] hover:underline">
                      去创作
                    </Link>
                    你的第一部剧本，开启收益之旅
                  </p>
                </div>
              ) : (
                <>
                  {/* 桌面端表格 */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[var(--muted)] border-b border-[var(--rule)]">
                          <th className="pb-2 font-medium">剧本</th>
                          <th className="pb-2 font-medium text-right">游玩次数</th>
                          <th className="pb-2 font-medium text-right">收益</th>
                          <th className="pb-2 font-medium text-right">日期</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incomes.map((inc) => (
                          <tr key={inc.id} className="border-b border-[var(--rule)] last:border-0">
                            <td className="py-3 pr-3">
                              <Link
                                href={`/game/${inc.scriptId}`}
                                className="text-[var(--ink)] hover:text-[var(--accent)] truncate block max-w-[220px]"
                                title={inc.scriptTitle}
                              >
                                {inc.scriptTitle}
                              </Link>
                            </td>
                            <td className="py-3 pr-3 text-right tabular-nums text-[var(--ink)]">
                              {formatNumber(inc.playCount)}
                            </td>
                            <td className="py-3 pr-3 text-right tabular-nums text-[var(--success)] font-medium">
                              +{formatNumber(inc.amount)}
                            </td>
                            <td className="py-3 text-right text-[var(--muted)] whitespace-nowrap">
                              {formatDate(inc.date)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 移动端卡片列表 */}
                  <div className="sm:hidden space-y-3">
                    {incomes.map((inc) => (
                      <div key={inc.id} className="p-3 rounded-lg bg-[var(--bg3)]">
                        <div className="flex items-center justify-between mb-1.5">
                          <Link
                            href={`/game/${inc.scriptId}`}
                            className="text-sm font-medium text-[var(--ink)] hover:text-[var(--accent)] truncate block max-w-[60%]"
                            title={inc.scriptTitle}
                          >
                            {inc.scriptTitle}
                          </Link>
                          <span className="text-sm font-medium text-[var(--success)] tabular-nums">
                            +{formatNumber(inc.amount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                          <span>游玩 {formatNumber(inc.playCount)} 次</span>
                          <span>{formatDate(inc.date)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 分页 */}
                  {incomeData && incomeData.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page <= 1}
                        className="px-3 py-1.5 rounded-lg border border-[var(--rule)] text-sm text-[var(--ink)] hover:bg-[var(--bg3)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        上一页
                      </button>
                      <span className="text-sm text-[var(--muted)]">
                        {page} / {incomeData.totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page >= incomeData.totalPages}
                        className="px-3 py-1.5 rounded-lg border border-[var(--rule)] text-sm text-[var(--ink)] hover:bg-[var(--bg3)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        下一页
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 创作者排行榜入口 */}
            <div className="bg-[var(--bg2)] rounded-xl p-6 card-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[var(--ink)]">创作者排行榜</h3>
                <Link
                  href="/ranking"
                  className="text-xs text-[var(--accent)] hover:underline inline-flex items-center gap-0.5"
                >
                  查看完整榜单
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {ranking.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-4xl mb-3">🏆</p>
                  <p className="text-sm text-[var(--muted)]">暂无排行榜数据，努力创作抢占榜首吧</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {ranking.slice(0, 5).map((item) => (
                    <div
                      key={item.userId}
                      className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-[var(--bg3)] transition-colors"
                    >
                      <div
                        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${medalStyle(item.rank)}`}
                      >
                        {item.rank}
                      </div>
                      <div className="w-9 h-9 rounded-full bg-[var(--accent)]/20 flex items-center justify-center text-sm font-bold text-[var(--accent)] overflow-hidden flex-shrink-0">
                        {item.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.avatar} alt={item.nickname} className="w-full h-full object-cover" />
                        ) : (
                          item.nickname?.[0] || 'U'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--ink)] truncate">{item.nickname}</p>
                        <p className="text-xs text-[var(--muted)]">
                          Lv.{item.level} · {item.totalScripts} 个剧本
                        </p>
                      </div>
                      <div className="hidden sm:block text-right">
                        <p className="text-sm font-medium text-[var(--warning)] tabular-nums">
                          {formatNumber(item.totalIncome)}
                        </p>
                        <p className="text-xs text-[var(--muted)]">UU 收入</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-[var(--accent)] tabular-nums">
                          {formatNumber(item.totalPlays)}
                        </p>
                        <p className="text-xs text-[var(--muted)]">次游玩</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
