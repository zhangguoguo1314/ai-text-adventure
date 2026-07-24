'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import PageTransition from '@/components/common/PageTransition';

/* ===== 类型定义 ===== */

interface ScriptRankItem {
  rank: number;
  scriptId: number;
  playCount: number;
  trend: 'up' | 'down' | 'same';
  script: {
    id: number;
    title: string;
    cover: string | null;
    category: string;
    favCount: number;
    author: { id: number; nickname: string; avatar: string | null };
  } | null;
}

interface CreatorRankItem {
  rank: number;
  user: {
    id: number;
    nickname: string;
    avatar: string | null;
    level: number;
    bio: string | null;
  };
  totalScripts: number;
  totalPlays: number;
  totalIncome: number;
}

interface PlayerRankItem {
  rank: number;
  user: {
    id: number;
    nickname: string;
    avatar: string | null;
    level: number;
    bio: string | null;
  };
  playCount: number;
  favoriteCount: number;
}

interface RankingResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

/* ===== 常量 ===== */

type TabType = 'scripts' | 'creators' | 'players';
type PeriodType = 'week' | 'month' | 'total';

const TABS: { label: string; value: TabType }[] = [
  { label: '剧本榜', value: 'scripts' },
  { label: '创作者榜', value: 'creators' },
  { label: '玩家榜', value: 'players' },
];

const PERIODS: { label: string; value: PeriodType }[] = [
  { label: '周榜', value: 'week' },
  { label: '月榜', value: 'month' },
  { label: '总榜', value: 'total' },
];

const CATEGORY_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '冒险', value: 'adventure' },
  { label: '恋爱', value: 'romance' },
  { label: '悬疑', value: 'mystery' },
  { label: '恐怖', value: 'horror' },
  { label: '科幻', value: 'scifi' },
  { label: '奇幻', value: 'fantasy' },
  { label: '校园', value: 'school' },
];

const CATEGORY_LABELS: Record<string, string> = {
  adventure: '冒险',
  romance: '恋爱',
  mystery: '悬疑',
  horror: '恐怖',
  scifi: '科幻',
  fantasy: '奇幻',
  school: '校园',
  campus: '校园',
};

const PAGE_SIZE = 20;

/* ===== 奖牌样式 ===== */

function medalStyle(rank: number): string {
  if (rank === 1) return 'bg-gradient-to-br from-amber-300 to-amber-500 text-white';
  if (rank === 2) return 'bg-gradient-to-br from-slate-300 to-slate-400 text-white';
  if (rank === 3) return 'bg-gradient-to-br from-orange-300 to-orange-500 text-white';
  return 'bg-[var(--bg3)] text-[var(--muted)]';
}

function trendIcon(trend: 'up' | 'down' | 'same') {
  if (trend === 'up') {
    return (
      <span className="inline-flex items-center text-[var(--success)] text-xs font-medium">
        <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
        上升
      </span>
    );
  }
  if (trend === 'down') {
    return (
      <span className="inline-flex items-center text-[var(--danger)] text-xs font-medium">
        <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
        下降
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-[var(--muted)] text-xs font-medium">
      <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
      </svg>
      持平
    </span>
  );
}

/* ===== 头像组件 ===== */

function Avatar({ src, name, size = 'md' }: { src: string | null; name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-16 h-16 text-2xl' : size === 'sm' ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base';
  return (
    <div
      className={`${sizeClass} rounded-full bg-[var(--accent)]/20 flex items-center justify-center font-bold text-[var(--accent)] overflow-hidden flex-shrink-0`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        name?.[0] || 'U'
      )}
    </div>
  );
}

/* ===== 主页面 ===== */

export default function RankingPage() {
  const [tab, setTab] = useState<TabType>('scripts');
  const [period, setPeriod] = useState<PeriodType>('week');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);

  const [scriptData, setScriptData] = useState<RankingResponse<ScriptRankItem> | null>(null);
  const [creatorData, setCreatorData] = useState<RankingResponse<CreatorRankItem> | null>(null);
  const [playerData, setPlayerData] = useState<RankingResponse<PlayerRankItem> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchScripts = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/ranking/scripts', {
        params: { period, category, page, limit: PAGE_SIZE },
      });
      setScriptData(res);
    } catch {
      setScriptData({ items: [], total: 0, page: 1, limit: PAGE_SIZE });
    } finally {
      setLoading(false);
    }
  }, [period, category, page]);

  const fetchCreators = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/ranking/creators', {
        params: { period, page, limit: PAGE_SIZE },
      });
      setCreatorData(res);
    } catch {
      setCreatorData({ items: [], total: 0, page: 1, limit: PAGE_SIZE });
    } finally {
      setLoading(false);
    }
  }, [period, page]);

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/ranking/players', {
        params: { period, page, limit: PAGE_SIZE },
      });
      setPlayerData(res);
    } catch {
      setPlayerData({ items: [], total: 0, page: 1, limit: PAGE_SIZE });
    } finally {
      setLoading(false);
    }
  }, [period, page]);

  useEffect(() => {
    if (tab === 'scripts') fetchScripts();
    else if (tab === 'creators') fetchCreators();
    else fetchPlayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, period, category, page]);

  // 切换 tab / period / category 时重置页码
  const handleTabChange = (t: TabType) => {
    setTab(t);
    setPage(1);
  };
  const handlePeriodChange = (p: PeriodType) => {
    setPeriod(p);
    setPage(1);
  };
  const handleCategoryChange = (c: string) => {
    setCategory(c);
    setPage(1);
  };

  const currentData =
    tab === 'scripts'
      ? scriptData
      : tab === 'creators'
        ? creatorData
        : playerData;

  const totalPages = currentData ? Math.ceil(currentData.total / currentData.limit) : 1;
  const items = currentData?.items ?? [];

  // Top3 与列表分拆（仅首页展示 Top3 领奖台）
  const showPodium = page === 1 && items.length >= 1;
  const podiumItems = showPodium ? items.slice(0, 3) : [];
  const listItems = showPodium ? items.slice(3) : items;
  const listStartRank = showPodium ? 4 : (page - 1) * PAGE_SIZE + 1;

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--ink)]">排行榜</h1>
          <p className="text-sm text-[var(--muted)] mt-1">看看谁是当下最热门的剧本、创作者与玩家</p>
        </div>

        {/* Tab 切换 */}
        <div className="flex gap-1 mb-4 bg-[var(--bg3)] rounded-lg p-1 w-fit">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => handleTabChange(t.value)}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === t.value
                  ? 'bg-[var(--bg2)] text-[var(--accent)] shadow-sm'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 筛选栏 */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* 时间筛选 */}
          <div className="flex gap-1 bg-[var(--bg2)] border border-[var(--rule)] rounded-lg p-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => handlePeriodChange(p.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  period === p.value
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* 分类筛选（仅剧本榜） */}
          {tab === 'scripts' && (
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="h-9 px-3 rounded-lg border border-[var(--rule)] bg-[var(--bg2)] text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent2)]"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          <span className="text-xs text-[var(--muted)] ml-auto">
            共 {currentData?.total ?? 0} 条
          </span>
        </div>

        {/* 内容区 */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 bg-[var(--bg3)] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-[var(--bg2)] rounded-xl p-12 text-center card-shadow">
            <p className="text-4xl mb-3">🏆</p>
            <p className="text-[var(--muted)]">暂无排行榜数据，快去抢占榜首吧</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top3 领奖台 */}
            {podiumItems.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {podiumItems.map((item) => {
                  const rank = (item as any).rank;
                  const medal = medalStyle(rank);
                  // 居中高个子：第1名居中且更高
                  const isTop = rank === 1;
                  return (
                    <div
                      key={rank}
                      className={`bg-[var(--bg2)] rounded-xl p-5 card-shadow flex flex-col items-center text-center ${
                        isTop ? 'sm:order-2 sm:scale-105' : rank === 2 ? 'sm:order-1' : 'sm:order-3'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-3 ${medal}`}>
                        {rank}
                      </div>
                      {tab === 'scripts' ? (
                        <ScriptPodiumCard item={item as ScriptRankItem} />
                      ) : (
                        <UserPodiumCard
                          item={item as CreatorRankItem | PlayerRankItem}
                          tab={tab}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 列表 */}
            {listItems.length > 0 && (
              <div className="bg-[var(--bg2)] rounded-xl card-shadow overflow-hidden">
                {listItems.map((item, index) => {
                  const rank = listStartRank + index;
                  return (
                    <div
                      key={(item as any).rank ?? rank}
                      className="flex items-center gap-4 px-4 py-3 border-b border-[var(--rule)] last:border-0 hover:bg-[var(--bg3)] transition-colors"
                    >
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${medalStyle(rank)}`}
                      >
                        {rank}
                      </div>

                      {tab === 'scripts' && (
                        <ScriptRow item={item as ScriptRankItem} />
                      )}
                      {tab === 'creators' && (
                        <CreatorRow item={item as CreatorRankItem} />
                      )}
                      {tab === 'players' && (
                        <PlayerRow item={item as PlayerRankItem} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg border border-[var(--rule)] text-sm text-[var(--ink)] hover:bg-[var(--bg3)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  上一页
                </button>
                <span className="text-sm text-[var(--muted)]">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg border border-[var(--rule)] text-sm text-[var(--ink)] hover:bg-[var(--bg3)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  下一页
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
}

/* ===== 剧本卡片（领奖台） ===== */

function ScriptPodiumCard({ item }: { item: ScriptRankItem }) {
  if (!item.script) return <span className="text-sm text-[var(--muted)]">剧本信息缺失</span>;
  return (
    <Link href={`/game/${item.script.id}`} className="flex flex-col items-center">
      <div className="w-20 h-20 rounded-lg bg-[var(--bg3)] overflow-hidden mb-2 flex items-center justify-center text-3xl">
        {item.script.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.script.cover} alt={item.script.title} className="w-full h-full object-cover" />
        ) : (
          '🎮'
        )}
      </div>
      <p className="font-semibold text-[var(--ink)] text-sm line-clamp-1">{item.script.title}</p>
      <p className="text-xs text-[var(--muted)] mt-0.5">{item.script.author.nickname}</p>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-lg font-bold text-[var(--accent)]">{formatNumber(item.playCount)}</span>
        <span className="text-xs text-[var(--muted)]">次游玩</span>
      </div>
      <div className="mt-1">{trendIcon(item.trend)}</div>
    </Link>
  );
}

/* ===== 用户卡片（领奖台） ===== */

function UserPodiumCard({ item, tab }: { item: CreatorRankItem | PlayerRankItem; tab: TabType }) {
  const u = item.user;
  return (
    <Link href={`/profile`} className="flex flex-col items-center">
      <Avatar src={u.avatar} name={u.nickname} size="lg" />
      <p className="font-semibold text-[var(--ink)] text-sm mt-2 line-clamp-1">{u.nickname}</p>
      <p className="text-xs text-[var(--muted)] mt-0.5">Lv.{u.level}</p>
      {tab === 'creators' && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-lg font-bold text-[var(--accent)]">{formatNumber((item as CreatorRankItem).totalPlays)}</span>
          <span className="text-xs text-[var(--muted)]">次游玩</span>
        </div>
      )}
      {tab === 'players' && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-lg font-bold text-[var(--accent)]">{formatNumber((item as PlayerRankItem).playCount)}</span>
          <span className="text-xs text-[var(--muted)]">次游玩</span>
        </div>
      )}
    </Link>
  );
}

/* ===== 列表行 ===== */

function ScriptRow({ item }: { item: ScriptRankItem }) {
  const s = item.script;
  return (
    <>
      <Link href={s ? `/game/${s.id}` : '#'} className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-12 h-12 rounded-lg bg-[var(--bg3)] overflow-hidden flex-shrink-0 flex items-center justify-center text-xl">
          {s?.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.cover} alt={s.title} className="w-full h-full object-cover" />
          ) : (
            '🎮'
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--ink)] truncate">{s?.title || '未知剧本'}</p>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            {s ? `${CATEGORY_LABELS[s.category] || s.category} · ${s.author.nickname}` : ''}
          </p>
        </div>
      </Link>
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="hidden sm:block">{trendIcon(item.trend)}</div>
        <div className="text-right">
          <p className="text-base font-bold text-[var(--accent)]">{formatNumber(item.playCount)}</p>
          <p className="text-xs text-[var(--muted)]">次游玩</p>
        </div>
      </div>
    </>
  );
}

function CreatorRow({ item }: { item: CreatorRankItem }) {
  const u = item.user;
  return (
    <>
      <Link href="/profile" className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar src={u.avatar} name={u.nickname} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--ink)] truncate">{u.nickname}</p>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Lv.{u.level} · {item.totalScripts} 个剧本
          </p>
        </div>
      </Link>
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="hidden sm:block text-right">
          <p className="text-sm font-medium text-[var(--warning)]">{formatNumber(item.totalIncome)}</p>
          <p className="text-xs text-[var(--muted)]">UU 收入</p>
        </div>
        <div className="text-right">
          <p className="text-base font-bold text-[var(--accent)]">{formatNumber(item.totalPlays)}</p>
          <p className="text-xs text-[var(--muted)]">次游玩</p>
        </div>
      </div>
    </>
  );
}

function PlayerRow({ item }: { item: PlayerRankItem }) {
  const u = item.user;
  return (
    <>
      <Link href="/profile" className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar src={u.avatar} name={u.nickname} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--ink)] truncate">{u.nickname}</p>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Lv.{u.level} · 收藏 {item.favoriteCount}
          </p>
        </div>
      </Link>
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="hidden sm:block text-right">
          <p className="text-sm font-medium text-[var(--muted)]">{item.favoriteCount}</p>
          <p className="text-xs text-[var(--muted)]">收藏</p>
        </div>
        <div className="text-right">
          <p className="text-base font-bold text-[var(--accent)]">{formatNumber(item.playCount)}</p>
          <p className="text-xs text-[var(--muted)]">次游玩</p>
        </div>
      </div>
    </>
  );
}
