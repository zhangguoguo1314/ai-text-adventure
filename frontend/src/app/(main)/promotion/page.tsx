'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import PageTransition from '@/components/common/PageTransition';

/* ===== 类型定义 ===== */

interface RewardRule {
  likes: number;
  coins: number;
}

interface PlatformOption {
  value: string;
  label: string;
  icon: string;
}

interface PromotionInfo {
  title: string;
  description: string;
  rules: RewardRule[];
  platforms: PlatformOption[];
  tags: string[];
  notes: string[];
}

interface PromotionStats {
  totalRewards: number;
  totalCoins: number;
  pendingCount: number;
  approvedCount: number;
}

type RewardStatus = 'pending' | 'approved' | 'rejected';

interface PromotionReward {
  id: number;
  platform: string;
  link: string;
  likes: number;
  coins: number;
  status: RewardStatus;
  rejectReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

interface RewardsData {
  list: PromotionReward[];
  total: number;
  page: number;
  totalPages: number;
}

/* ===== 常量 ===== */

const PAGE_SIZE = 10;

const STATUS_MAP: Record<RewardStatus, { label: string; cls: string; dot: string }> = {
  pending: {
    label: '待审核',
    cls: 'bg-amber-500/15 text-amber-500 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  approved: {
    label: '已通过',
    cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  rejected: {
    label: '已拒绝',
    cls: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
  },
};

const PLATFORM_FALLBACK: Record<string, { label: string; icon: string }> = {
  douyin: { label: '抖音', icon: '🎵' },
  xiaohongshu: { label: '小红书', icon: '📕' },
  bilibili: { label: 'B站', icon: '📺' },
  weibo: { label: '微博', icon: '🌐' },
};

const TAGS_FALLBACK = ['#文游', '#模拟器', '#互动游戏'];

const RULES_FALLBACK: RewardRule[] = [
  { likes: 10, coins: 100 },
  { likes: 100, coins: 1000 },
  { likes: 1000, coins: 10000 },
];

/* ===== 主页面 ===== */

export default function PromotionPage() {
  const { isAuthenticated } = useAuthStore();

  const [info, setInfo] = useState<PromotionInfo | null>(null);
  const [stats, setStats] = useState<PromotionStats | null>(null);
  const [rewardsData, setRewardsData] = useState<RewardsData | null>(null);

  const [loading, setLoading] = useState(true);
  const [rewardsLoading, setRewardsLoading] = useState(false);

  // 提交表单
  const [platform, setPlatform] = useState('');
  const [link, setLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 分页
  const [page, setPage] = useState(1);

  const fetchInfo = useCallback(async () => {
    try {
      const res: any = await api.get('/promotion/info');
      if (res.success) {
        setInfo(res.data);
      }
    } catch {
      // 忽略
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res: any = await api.get('/promotion/my-stats');
      if (res.success) {
        setStats(res.data);
      }
    } catch {
      // 忽略
    }
  }, []);

  const fetchRewards = useCallback(async (p: number) => {
    setRewardsLoading(true);
    try {
      const res: any = await api.get('/promotion/my-rewards', {
        params: { page: p, pageSize: PAGE_SIZE },
      });
      if (res.success) {
        setRewardsData(res.data);
      }
    } catch {
      // 忽略
    } finally {
      setRewardsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      await Promise.all([fetchInfo(), fetchStats(), fetchRewards(1)]);
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // 默认选中第一个平台
  useEffect(() => {
    if (!platform && info?.platforms?.length) {
      setPlatform(info.platforms[0].value);
    }
  }, [info, platform]);

  const handleSubmit = async () => {
    const trimmedLink = link.trim();
    if (!platform) {
      setMessage({ type: 'error', text: '请选择推广平台' });
      return;
    }
    if (!trimmedLink) {
      setMessage({ type: 'error', text: '请输入推广链接' });
      return;
    }
    if (!/^https?:\/\//i.test(trimmedLink)) {
      setMessage({ type: 'error', text: '请输入有效的链接（需以 http:// 或 https:// 开头）' });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const res: any = await api.post('/promotion/submit', {
        platform,
        link: trimmedLink,
      });
      if (res.success) {
        setMessage({ type: 'success', text: res.message || '提交成功，等待审核' });
        setLink('');
        // 刷新统计与列表
        await Promise.all([fetchStats(), fetchRewards(1)]);
        setPage(1);
      } else {
        setMessage({ type: 'error', text: res.message || '提交失败，请稍后重试' });
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || '提交失败，请稍后重试',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchRewards(newPage);
  };

  // 未登录
  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[var(--ink)] mb-6">推广奖励</h1>
        <div className="bg-[var(--bg2)] rounded-xl p-8 text-center card-shadow">
          <p className="text-[var(--muted)]">请先登录后查看推广奖励</p>
        </div>
      </div>
    );
  }

  const platforms = info?.platforms ?? [];
  const rules = info?.rules ?? RULES_FALLBACK;
  const tags = info?.tags ?? TAGS_FALLBACK;
  const rewards = rewardsData?.list ?? [];

  const getPlatformMeta = (value: string) => {
    const p = platforms.find((x) => x.value === value);
    if (p) return { label: p.label, icon: p.icon };
    return PLATFORM_FALLBACK[value] ?? { label: value, icon: '📌' };
  };

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[var(--ink)] mb-6">推广奖励</h1>

        {loading ? (
          <div className="space-y-4">
            <div className="h-48 bg-[var(--bg3)] rounded-xl animate-pulse" />
            <div className="h-24 bg-[var(--bg3)] rounded-xl animate-pulse" />
            <div className="h-64 bg-[var(--bg3)] rounded-xl animate-pulse" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* 顶部：活动说明 Banner */}
            <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl p-6 text-white card-shadow">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
                <span className="text-sm font-medium text-violet-100">推广活动</span>
              </div>
              <h2 className="text-xl font-bold mb-2">
                {info?.title || '发抖音 / 小红书宣传得永久 UU 币'}
              </h2>
              <p className="text-sm text-violet-100 leading-relaxed">
                {info?.description ||
                  '在社交平台发布本站相关内容并打上指定 tag，根据点赞量领取可叠加的永久 UU 币奖励。'}
              </p>
            </div>

            {/* 统计数据 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[var(--bg2)] rounded-xl p-5 card-shadow">
                <p className="text-sm text-[var(--muted)] mb-1">推广总数</p>
                <p className="text-2xl font-bold text-[var(--ink)] tabular-nums">
                  {stats?.totalRewards ?? 0}
                  <span className="text-sm font-normal text-[var(--muted)] ml-1">条</span>
                </p>
              </div>
              <div className="bg-[var(--bg2)] rounded-xl p-5 card-shadow">
                <p className="text-sm text-[var(--muted)] mb-1">累计 UU币</p>
                <p className="text-2xl font-bold text-[var(--warning)] tabular-nums">
                  {stats?.totalCoins ?? 0}
                  <span className="text-sm font-normal text-[var(--muted)] ml-1">UU</span>
                </p>
              </div>
              <div className="bg-[var(--bg2)] rounded-xl p-5 card-shadow">
                <p className="text-sm text-[var(--muted)] mb-1">待审核</p>
                <p className="text-2xl font-bold text-amber-500 tabular-nums">
                  {stats?.pendingCount ?? 0}
                </p>
              </div>
              <div className="bg-[var(--bg2)] rounded-xl p-5 card-shadow">
                <p className="text-sm text-[var(--muted)] mb-1">已通过</p>
                <p className="text-2xl font-bold text-emerald-500 tabular-nums">
                  {stats?.approvedCount ?? 0}
                </p>
              </div>
            </div>

            {/* 奖励规则说明 */}
            <div className="bg-[var(--bg2)] rounded-xl p-6 card-shadow">
              <h3 className="font-semibold text-[var(--ink)] mb-4">奖励规则</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                {rules.map((rule, idx) => (
                  <div
                    key={rule.likes}
                    className="relative rounded-lg p-4 bg-gradient-to-br from-[var(--bg3)] to-[var(--bg3)] border border-[var(--rule)]"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] text-xs font-bold">
                        第 {idx + 1} 档
                      </span>
                      <span className="text-xs text-[var(--muted)]">可叠加</span>
                    </div>
                    <div className="flex items-end gap-1.5">
                      <span className="text-2xl font-bold text-[var(--ink)] tabular-nums">
                        {rule.likes.toLocaleString()}
                      </span>
                      <span className="text-sm text-[var(--muted)] mb-0.5">赞</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[var(--success)]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-lg font-bold tabular-nums">
                        +{rule.coins.toLocaleString()}
                      </span>
                      <span className="text-xs text-[var(--muted)]">UU币</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 支持平台 */}
              <div className="mb-4">
                <p className="text-xs text-[var(--muted)] mb-2">支持平台</p>
                <div className="flex flex-wrap gap-2">
                  {platforms.map((p) => (
                    <span
                      key={p.value}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg3)] text-sm text-[var(--ink)]"
                    >
                      <span>{p.icon}</span>
                      {p.label}
                    </span>
                  ))}
                  {platforms.length === 0 &&
                    Object.entries(PLATFORM_FALLBACK).map(([value, meta]) => (
                      <span
                        key={value}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg3)] text-sm text-[var(--ink)]"
                      >
                        <span>{meta.icon}</span>
                        {meta.label}
                      </span>
                    ))}
                </div>
              </div>

              {/* 打 tag 要求 */}
              <div className="mb-4">
                <p className="text-xs text-[var(--muted)] mb-2">打 tag 要求</p>
                <div className="flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="px-3 py-1.5 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] text-sm font-medium font-mono"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* 注意事项 */}
              {(info?.notes ?? []).length > 0 && (
                <div className="pt-4 border-t border-[var(--rule)]">
                  <p className="text-xs text-[var(--muted)] mb-2">注意事项</p>
                  <ul className="space-y-1.5">
                    {info!.notes.map((n, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[var(--muted)]">
                        <span className="text-[var(--accent)] mt-0.5 flex-shrink-0">•</span>
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 提交推广链接表单 */}
            <div className="bg-[var(--bg2)] rounded-xl p-6 card-shadow">
              <h3 className="font-semibold text-[var(--ink)] mb-4">提交推广链接</h3>
              <div className="space-y-4">
                {/* 平台选择 */}
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-2">推广平台</label>
                  <div className="flex flex-wrap gap-2">
                    {(platforms.length ? platforms : Object.entries(PLATFORM_FALLBACK).map(
                        ([value, meta]) => ({ value, label: meta.label, icon: meta.icon }),
                      )).map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPlatform(p.value)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                          platform === p.value
                            ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                            : 'bg-[var(--bg3)] text-[var(--ink)] border-[var(--rule)] hover:border-[var(--accent2)]'
                        }`}
                      >
                        <span>{p.icon}</span>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 链接输入 */}
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-2">推广链接</label>
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="粘贴你在抖音/小红书/B站/微博发布的内容链接"
                    className="w-full h-11 px-3 rounded-lg border border-[var(--rule)] bg-[var(--bg)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent2)] text-sm"
                  />
                </div>

                {/* 提示信息 */}
                {message && (
                  <div
                    className={`flex items-start gap-2 px-3 py-2 rounded-lg text-sm ${
                      message.type === 'success'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {message.type === 'success' ? (
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    )}
                    <span>{message.text}</span>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full sm:w-auto px-6 h-11 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      提交中...
                    </>
                  ) : (
                    '提交推广链接'
                  )}
                </button>
              </div>
            </div>

            {/* 我的推广奖励列表 */}
            <div className="bg-[var(--bg2)] rounded-xl p-6 card-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[var(--ink)]">我的推广奖励</h3>
                {rewardsData && (
                  <span className="text-xs text-[var(--muted)]">共 {rewardsData.total} 条</span>
                )}
              </div>

              {rewardsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-20 bg-[var(--bg3)] rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : rewards.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-4xl mb-3">📢</p>
                  <p className="text-sm text-[var(--muted)] mb-1">还没有推广记录</p>
                  <p className="text-xs text-[var(--muted)]">提交你的第一条推广链接，开始赚取 UU 币吧</p>
                </div>
              ) : (
                <>
                  {/* 桌面端表格 */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[var(--muted)] border-b border-[var(--rule)]">
                          <th className="pb-2 font-medium">平台</th>
                          <th className="pb-2 font-medium">链接</th>
                          <th className="pb-2 font-medium text-right">点赞</th>
                          <th className="pb-2 font-medium text-right">奖励</th>
                          <th className="pb-2 font-medium">状态</th>
                          <th className="pb-2 font-medium text-right">提交时间</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rewards.map((r) => {
                          const st = STATUS_MAP[r.status];
                          const meta = getPlatformMeta(r.platform);
                          return (
                            <tr key={r.id} className="border-b border-[var(--rule)] last:border-0">
                              <td className="py-3 pr-3">
                                <span className="inline-flex items-center gap-1.5 text-[var(--ink)]">
                                  <span>{meta.icon}</span>
                                  {meta.label}
                                </span>
                              </td>
                              <td className="py-3 pr-3 max-w-[200px]">
                                <a
                                  href={r.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[var(--accent)] hover:underline truncate block"
                                  title={r.link}
                                >
                                  {r.link}
                                </a>
                              </td>
                              <td className="py-3 pr-3 text-right tabular-nums text-[var(--ink)]">
                                {r.likes.toLocaleString()}
                              </td>
                              <td className="py-3 pr-3 text-right tabular-nums text-[var(--warning)] font-medium">
                                {r.coins.toLocaleString()}
                              </td>
                              <td className="py-3 pr-3">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                  {st.label}
                                </span>
                              </td>
                              <td className="py-3 text-right text-[var(--muted)] whitespace-nowrap">
                                {formatDate(r.createdAt)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* 移动端卡片列表 */}
                  <div className="sm:hidden space-y-3">
                    {rewards.map((r) => {
                      const st = STATUS_MAP[r.status];
                      const meta = getPlatformMeta(r.platform);
                      return (
                        <div key={r.id} className="p-3 rounded-lg bg-[var(--bg3)]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--ink)]">
                              <span>{meta.icon}</span>
                              {meta.label}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                              {st.label}
                            </span>
                          </div>
                          <a
                            href={r.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[var(--accent)] hover:underline block truncate mb-2"
                            title={r.link}
                          >
                            {r.link}
                          </a>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[var(--muted)]">
                              {formatDate(r.createdAt)}
                            </span>
                            <span className="flex items-center gap-3">
                              <span className="text-[var(--ink)]">
                                <span className="tabular-nums">{r.likes.toLocaleString()}</span> 赞
                              </span>
                              <span className="text-[var(--warning)] font-medium tabular-nums">
                                +{r.coins.toLocaleString()}
                              </span>
                            </span>
                          </div>
                          {r.status === 'rejected' && r.rejectReason && (
                            <p className="mt-2 text-xs text-rose-500">
                              拒绝原因：{r.rejectReason}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* 分页 */}
                  {rewardsData && rewardsData.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page <= 1}
                        className="px-3 py-1.5 rounded-lg border border-[var(--rule)] text-sm text-[var(--ink)] hover:bg-[var(--bg3)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        上一页
                      </button>
                      <span className="text-sm text-[var(--muted)]">
                        {page} / {rewardsData.totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page >= rewardsData.totalPages}
                        className="px-3 py-1.5 rounded-lg border border-[var(--rule)] text-sm text-[var(--ink)] hover:bg-[var(--bg3)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        下一页
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
