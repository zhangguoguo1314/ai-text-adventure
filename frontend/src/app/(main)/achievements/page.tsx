'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import PageTransition from '@/components/common/PageTransition';

/* ===== 类型定义 ===== */

interface Progress {
  current: number;
  threshold: number;
  percentage: number;
}

interface AchievementItem {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  reward: number;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: Progress | null;
}

interface AchievementsData {
  list: AchievementItem[];
  total: number;
  unlockedCount: number;
}

/* ===== 分类配置 ===== */

const CATEGORY_ORDER = ['general', 'creator', 'player', 'social'];

const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  general: { label: '通用', icon: '🌟', color: 'var(--accent)' },
  creator: { label: '创作', icon: '✍️', color: 'var(--warning)' },
  player: { label: '游玩', icon: '🎮', color: 'var(--success)' },
  social: { label: '社交', icon: '💬', color: '#ec4899' },
};

export default function AchievementsPage() {
  const { isAuthenticated } = useAuthStore();
  const { updateBalance } = useAppStore();

  const [data, setData] = useState<AchievementsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  const fetchAchievements = useCallback(async () => {
    try {
      const res: any = await api.get('/achievement');
      if (res.success) {
        setData(res.data);
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
      await fetchAchievements();
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, fetchAchievements]);

  // 手动检查并解锁成就
  const handleCheck = async () => {
    setChecking(true);
    setMessage(null);
    try {
      const res: any = await api.post('/achievement/check');
      if (res.success) {
        const unlocked = res.data?.unlocked ?? [];
        if (unlocked.length > 0) {
          const names = unlocked.map((a: any) => `「${a.name}」`).join('、');
          setMessage({
            type: 'success',
            text: `恭喜解锁 ${unlocked.length} 个成就：${names}`,
          });
        } else {
          setMessage({ type: 'info', text: '暂无可解锁的新成就，继续努力吧' });
        }
        // 同步刷新侧边栏余额（解锁奖励会发放 UU币）
        try {
          const bal: any = await api.get('/user/balance');
          if (bal.success && bal.data) {
            updateBalance(bal.data.permanentBalance, bal.data.tempBalance);
          }
        } catch {
          // 忽略余额刷新失败
        }
        await fetchAchievements();
      }
    } catch {
      setMessage({ type: 'info', text: '检查失败，请稍后重试' });
    } finally {
      setChecking(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[var(--ink)] mb-6">成就墙</h1>
        <div className="bg-[var(--bg2)] rounded-xl p-8 text-center card-shadow">
          <p className="text-[var(--muted)]">请先登录后查看成就</p>
        </div>
      </div>
    );
  }

  const list = data?.list ?? [];
  const total = data?.total ?? 0;
  const unlockedCount = data?.unlockedCount ?? 0;
  const overallPercentage = total > 0 ? Math.round((unlockedCount / total) * 100) : 0;

  // 按分类分组
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: list.filter((a) => a.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[var(--ink)]">成就墙</h1>
            <p className="text-sm text-[var(--muted)] mt-1">
              解锁成就，赢取 UU币奖励
            </p>
          </div>
          <button
            onClick={handleCheck}
            disabled={checking}
            className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
          >
            {checking ? '检查中...' : '检查成就'}
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="h-28 bg-[var(--bg3)] rounded-xl animate-pulse" />
            <div className="h-32 bg-[var(--bg3)] rounded-xl animate-pulse" />
            <div className="h-32 bg-[var(--bg3)] rounded-xl animate-pulse" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* 总体进度卡片 */}
            <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl p-6 text-white card-shadow">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm text-violet-100 mb-1">已解锁成就</p>
                  <p className="text-4xl font-bold">
                    {unlockedCount}
                    <span className="text-lg font-normal text-violet-200 ml-1">/ {total}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-3xl font-bold">{overallPercentage}%</p>
                    <p className="text-xs text-violet-200">完成度</p>
                  </div>
                  <svg className="w-14 h-14 text-violet-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
              </div>
              {/* 进度条 */}
              <div className="mt-4 h-2 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${overallPercentage}%` }}
                />
              </div>
            </div>

            {/* 提示信息 */}
            {message && (
              <div
                className={`rounded-lg p-4 text-sm ${
                  message.type === 'success'
                    ? 'bg-[var(--success)]/10 text-[var(--success)]'
                    : 'bg-[var(--bg3)] text-[var(--muted)]'
                }`}
              >
                {message.text}
              </div>
            )}

            {/* 按分类分组展示 */}
            {grouped.map((group) => {
              const meta = CATEGORY_META[group.category] || CATEGORY_META.general;
              const groupUnlocked = group.items.filter((i) => i.unlocked).length;
              return (
                <div key={group.category} className="bg-[var(--bg2)] rounded-xl p-5 card-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-[var(--ink)] flex items-center gap-2">
                      <span className="text-lg">{meta.icon}</span>
                      {meta.label}
                    </h3>
                    <span className="text-xs text-[var(--muted)]">
                      {groupUnlocked} / {group.items.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {group.items.map((ach) => (
                      <AchievementCard key={ach.id} item={ach} accentColor={meta.color} />
                    ))}
                  </div>
                </div>
              );
            })}

            {list.length === 0 && (
              <div className="bg-[var(--bg2)] rounded-xl p-12 text-center card-shadow">
                <p className="text-4xl mb-3">🎖️</p>
                <p className="text-[var(--muted)]">暂无成就数据</p>
              </div>
            )}

            <p className="text-xs text-[var(--muted)] text-center">
              成就会在你达成条件时自动解锁，也可点击「检查成就」手动触发
            </p>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

/* ===== 成就卡片 ===== */

function AchievementCard({ item, accentColor }: { item: AchievementItem; accentColor: string }) {
  const { unlocked, unlockedAt, progress } = item;

  return (
    <div
      className={`relative rounded-lg p-4 border transition-all ${
        unlocked
          ? 'border-[var(--rule)] bg-[var(--bg2)]'
          : 'border-dashed border-[var(--rule)] bg-[var(--bg3)]/50'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* 图标 */}
        <div
          className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
            unlocked ? '' : 'grayscale opacity-40'
          }`}
          style={unlocked ? { background: `${accentColor}1a` } : undefined}
        >
          {item.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-medium truncate ${unlocked ? 'text-[var(--ink)]' : 'text-[var(--muted)]'}`}>
              {item.name}
            </p>
            {unlocked && (
              <svg className="w-4 h-4 text-[var(--success)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <p className="text-xs text-[var(--muted)] mt-0.5 line-clamp-2">{item.description}</p>

          {/* 奖励 */}
          {item.reward > 0 && (
            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-[var(--warning)]/10 text-[var(--warning)] text-xs font-medium">
              +{item.reward} UU币
            </span>
          )}

          {/* 已解锁：解锁时间 */}
          {unlocked && unlockedAt && (
            <p className="text-xs text-[var(--muted)] mt-2">
              解锁于 {formatDate(unlockedAt)}
            </p>
          )}

          {/* 未解锁：进度条 */}
          {!unlocked && progress && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[var(--muted)]">
                  {progress.current} / {progress.threshold}
                </span>
                <span className="text-[var(--muted)]">{progress.percentage}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--bg3)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress.percentage}%`, background: accentColor }}
                />
              </div>
            </div>
          )}

          {/* 未解锁且无进度（如 first_login 类型在未登录当天） */}
          {!unlocked && !progress && (
            <p className="text-xs text-[var(--muted)] mt-2">未解锁</p>
          )}
        </div>
      </div>
    </div>
  );
}
