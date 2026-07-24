'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import PageTransition from '@/components/common/PageTransition';

/* ===========================================================================
 * 排行榜页面（对标 UU 平台）
 * 分类 / 新作榜 / 日榜 / 周榜 / 月榜 / 作者榜
 * =========================================================================== */

/* ===== 类型定义 ===== */

interface ScriptInfo {
  id: number;
  title: string;
  cover: string | null;
  category: string;
  author?: { id: number; nickname: string; avatar: string | null } | null;
}

/** 剧本排行榜条目（日/周/月榜） */
interface ScriptRankItem {
  rank: number;
  scriptId: number;
  playCount: number;
  trend?: 'up' | 'down' | 'same';
  script: ScriptInfo | null;
}

/** 新作榜条目 */
interface NewScriptRankItem {
  rank: number;
  scriptId: number;
  playCount: number;
  favCount?: number;
  isNew?: boolean;
  publishedAt?: string;
  script: ScriptInfo | null;
}

/** 列表剧本（分类 tab） */
interface ListItem {
  id: number;
  title: string;
  cover: string | null;
  desc?: string | null;
  category: string;
  playCount: number;
  favCount: number;
  author?: { id: number; nickname: string; avatar: string | null } | null;
}

/** 创作者排行榜条目 */
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

interface RankingResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

/* ===== 常量 ===== */

type TabType = 'category' | 'new' | 'daily' | 'week' | 'month' | 'author';

const TABS: { label: string; value: TabType }[] = [
  { label: '分类', value: 'category' },
  { label: '新作榜', value: 'new' },
  { label: '日榜', value: 'daily' },
  { label: '周榜', value: 'week' },
  { label: '月榜', value: 'month' },
  { label: '作者榜', value: 'author' },
];

/** 分类 tab 使用的周期参数映射 */
const PERIOD_MAP: Record<string, string> = {
  daily: 'daily',
  week: 'week',
  month: 'month',
};

const CATEGORY_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '冒险', value: 'adventure' },
  { label: '恋爱', value: 'romance' },
  { label: '悬疑', value: 'mystery' },
  { label: '恐怖', value: 'horror' },
  { label: '科幻', value: 'scifi' },
  { label: '奇幻', value: 'fantasy' },
  { label: '校园', value: 'school' },
  { label: '喜剧', value: 'comedy' },
  { label: '其他', value: 'other' },
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
  comedy: '喜剧',
  other: '其他',
};

const PAGE_SIZE = 20;

/* ===== 工具函数 ===== */

/** 判断封面字段是图片 URL 还是 emoji/文字 */
function isImageUrl(str?: string | null): boolean {
  if (!str) return false;
  return /^(https?:)?\/\//.test(str) || str.startsWith('/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(str);
}

/** 奖牌样式 */
function medalStyle(rank: number): string {
  if (rank === 1) return 'bg-gradient-to-br from-amber-300 to-amber-500 text-white';
  if (rank === 2) return 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-900';
  if (rank === 3) return 'bg-gradient-to-br from-orange-300 to-orange-500 text-white';
  return 'bg-[var(--bg3)] text-[var(--muted)]';
}

/* ===== 封面组件 ===== */

interface CoverProps {
  cover: string | null;
  title: string;
  size?: 'sm' | 'md' | 'lg';
}

function Cover({ cover, title, size = 'md' }: CoverProps) {
  const sizeClass =
    size === 'lg' ? 'w-full aspect-[3/4] text-4xl' : size === 'sm' ? 'w-12 h-16 text-2xl' : 'w-full aspect-[3/4] text-3xl';
  const url = isImageUrl(cover) ? cover : null;
  return (
    <div
      className={`${sizeClass} rounded-lg bg-gradient-to-br from-[var(--accent2)]/30 to-[var(--accent)]/30
        overflow-hidden flex items-center justify-center flex-shrink-0`}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={title} className="w-full h-full object-cover" />
      ) : (
        <span aria-hidden="true">{cover && cover.length <= 4 ? cover : '🎮'}</span>
      )}
    </div>
  );
}

/* ===== 头像组件 ===== */

function Avatar({ src, name, size = 'md' }: { src: string | null; name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-16 h-16 text-2xl' : size === 'sm' ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base';
  return (
    <div
      className={`${sizeClass} rounded-full bg-[var(--accent)]/20 flex items-center justify-center font-bold
        text-[var(--accent)] overflow-hidden flex-shrink-0`}
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

/* ===== 趋势图标 ===== */

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'same' }) {
  if (trend === 'up') {
    return (
      <span className="inline-flex items-center text-[var(--success)] text-xs font-medium">
        <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
        上升
      </span>
    );
  }
  if (trend === 'down') {
    return (
      <span className="inline-flex items-center text-[var(--danger)] text-xs font-medium">
        <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
        下降
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-[var(--muted)] text-xs font-medium">
      <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
      </svg>
      持平
    </span>
  );
}

/* ===== 剧本卡片 ===== */

interface ScriptCardProps {
  rank?: number;
  title: string;
  cover: string | null;
  category: string;
  authorName?: string;
  playCount: number;
  favCount?: number;
  trend?: 'up' | 'down' | 'same';
  badge?: string;
  href: string;
}

function ScriptCard({ rank, title, cover, category, authorName, playCount, favCount, trend, badge, href }: ScriptCardProps) {
  const hasMedal = rank != null && rank <= 3;
  return (
    <Link
      href={href}
      className={`block bg-[var(--bg2)] rounded-xl overflow-hidden card-shadow transition-all hover:shadow-lg
        hover:-translate-y-0.5 ${hasMedal ? 'ring-1 ring-[var(--accent)]/40' : ''}`}
    >
      {/* 封面 + 排名 */}
      <div className="relative">
        <Cover cover={cover} title={title} size="lg" />
        {rank != null && (
          <div
            className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-md ${medalStyle(
              rank,
            )}`}
          >
            {rank}
          </div>
        )}
        {badge && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold shadow">
            {badge}
          </span>
        )}
      </div>

      {/* 信息 */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-[var(--ink)] truncate">{title}</h3>
        <p className="text-xs text-[var(--muted)] mt-1 truncate">
          {authorName ? `${authorName}` : '匿名作者'}
          {category ? ` · ${CATEGORY_LABELS[category] || category}` : ''}
        </p>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
            <span className="inline-flex items-center gap-0.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatNumber(playCount)}
            </span>
            {favCount != null && (
              <span className="inline-flex items-center gap-0.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {formatNumber(favCount)}
              </span>
            )}
          </div>
          {trend && <TrendIcon trend={trend} />}
        </div>
      </div>
    </Link>
  );
}

/* ===== 作者卡片 ===== */

interface AuthorCardProps {
  rank: number;
  nickname: string;
  avatar: string | null;
  level: number;
  totalScripts: number;
  totalPlays: number;
  totalIncome: number;
}

function AuthorCard({ rank, nickname, avatar, level, totalScripts, totalPlays, totalIncome }: AuthorCardProps) {
  const hasMedal = rank <= 3;
  return (
    <div
      className={`bg-[var(--bg2)] rounded-xl p-4 card-shadow transition-all hover:shadow-lg hover:-translate-y-0.5
        ${hasMedal ? 'ring-1 ring-[var(--accent)]/40' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <Avatar src={avatar} name={nickname} size="lg" />
          <div
            className={`absolute -bottom-1 -left-1 w-6 h-6 rounded-full flex items-center justify-center text-[11px]
              font-bold shadow-md border-2 border-[var(--bg2)] ${medalStyle(rank)}`}
          >
            {rank}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--ink)] truncate">{nickname}</p>
          <p className="text-xs text-[var(--muted)] mt-0.5">Lv.{level} · {totalScripts} 部作品</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4">
        <div className="bg-[var(--bg3)] rounded-lg p-2.5 text-center">
          <p className="text-base font-bold text-[var(--accent)]">{formatNumber(totalPlays)}</p>
          <p className="text-[11px] text-[var(--muted)] mt-0.5">总游玩</p>
        </div>
        <div className="bg-[var(--bg3)] rounded-lg p-2.5 text-center">
          <p className="text-base font-bold text-[var(--warning)]">{formatNumber(totalIncome)}</p>
          <p className="text-[11px] text-[var(--muted)] mt-0.5">总收入</p>
        </div>
      </div>
    </div>
  );
}

/* ===== 骨架屏 ===== */

function CardSkeleton({ isAuthor = false }: { isAuthor?: boolean }) {
  return (
    <div className="bg-[var(--bg2)] rounded-xl overflow-hidden card-shadow">
      {isAuthor ? (
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-[var(--bg3)] animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-2/3 bg-[var(--bg3)] rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-[var(--bg3)] rounded animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="h-14 bg-[var(--bg3)] rounded-lg animate-pulse" />
            <div className="h-14 bg-[var(--bg3)] rounded-lg animate-pulse" />
          </div>
        </div>
      ) : (
        <>
          <div className="aspect-[3/4] bg-[var(--bg3)] animate-pulse" />
          <div className="p-3 space-y-2">
            <div className="h-3.5 w-3/4 bg-[var(--bg3)] rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-[var(--bg3)] rounded animate-pulse" />
            <div className="h-3 w-2/3 bg-[var(--bg3)] rounded animate-pulse" />
          </div>
        </>
      )}
    </div>
  );
}

/* ===== 主页面 ===== */

/** 统一查询返回结构（items 为混合类型，按 tab 在渲染时断言） */
interface RankData {
  items: unknown[];
  total: number;
}

/** 剧本列表接口响应（分类 tab，带 success/data 包裹） */
interface ScriptListResponse {
  success: boolean;
  data: { items: ListItem[]; total: number; page: number; pageSize: number; totalPages: number };
}

/** 类型化 GET 封装：api 响应拦截器已解包 res.data，借助 axios 第二泛型直返业务数据 */
function getJson<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  return api.get<T, T>(url, params ? { params } : undefined);
}

export default function RankingPage() {
  const [tab, setTab] = useState<TabType>('category');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);

  // 统一数据获取：按 tab 分发到不同接口
  const { data, isLoading: loading } = useQuery<RankData>({
    queryKey: ['ranking', tab, category, page],
    queryFn: async (): Promise<RankData> => {
      if (tab === 'category') {
        // 分类：调用剧本列表接口（按游玩次数降序）
        const res = await getJson<ScriptListResponse>('/scripts', {
          category: category !== 'all' ? category : undefined,
          page,
          pageSize: PAGE_SIZE,
          sort: 'playCount',
          order: 'desc',
        });
        return {
          items: res?.success ? res.data?.items ?? [] : [],
          total: res?.success ? res.data?.total ?? 0 : 0,
        };
      }
      if (tab === 'new') {
        // 新作榜
        const res = await getJson<RankingResponse<NewScriptRankItem>>('/ranking/new-scripts', {
          category,
          page,
          limit: PAGE_SIZE,
        });
        return { items: res.items ?? [], total: res.total ?? 0 };
      }
      if (tab === 'author') {
        // 作者榜
        const res = await getJson<RankingResponse<CreatorRankItem>>('/ranking/creators', {
          page,
          limit: PAGE_SIZE,
        });
        return { items: res.items ?? [], total: res.total ?? 0 };
      }
      // 日榜 / 周榜 / 月榜
      const period = PERIOD_MAP[tab];
      const res = await getJson<RankingResponse<ScriptRankItem>>('/ranking/scripts', {
        period,
        category,
        page,
        limit: PAGE_SIZE,
      });
      return { items: res.items ?? [], total: res.total ?? 0 };
    },
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  // 切换 tab / category 时重置页码
  const handleTabChange = (t: TabType) => {
    setTab(t);
    setPage(1);
  };
  const handleCategoryChange = (c: string) => {
    setCategory(c);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const showCategoryFilter = tab !== 'author';
  const isAuthorTab = tab === 'author';

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--ink)]">排行榜</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            分类、新作、日/周/月榜与作者榜，发现最热门的剧本与创作者
          </p>
        </div>

        {/* Tab 切换 */}
        <div className="flex gap-1 mb-4 bg-[var(--bg3)] rounded-xl p-1 w-fit max-w-full overflow-x-auto scrollbar-thin">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => handleTabChange(t.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
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
          {showCategoryFilter && (
            <div className="flex gap-1 flex-wrap">
              {CATEGORY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleCategoryChange(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    category === opt.value
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--bg2)] border border-[var(--rule)] text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
          <span className="text-xs text-[var(--muted)] ml-auto">共 {total} 条</span>
        </div>

        {/* 内容区 */}
        {loading ? (
          <div
            className={`grid gap-4 ${
              isAuthorTab
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            }`}
          >
            {Array.from({ length: isAuthorTab ? 6 : 10 }).map((_, i) => (
              <CardSkeleton key={i} isAuthor={isAuthorTab} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-[var(--bg2)] rounded-xl p-12 text-center card-shadow">
            <p className="text-4xl mb-3">🏆</p>
            <p className="text-[var(--muted)]">暂无排行榜数据，快去抢占榜首吧</p>
          </div>
        ) : isAuthorTab ? (
          /* 作者榜网格 */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((raw) => {
              const item = raw as CreatorRankItem;
              return (
                <AuthorCard
                  key={item.rank}
                  rank={item.rank}
                  nickname={item.user?.nickname || '匿名用户'}
                  avatar={item.user?.avatar || null}
                  level={item.user?.level || 1}
                  totalScripts={item.totalScripts}
                  totalPlays={item.totalPlays}
                  totalIncome={item.totalIncome}
                />
              );
            })}
          </div>
        ) : (
          /* 剧本榜网格 */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {items.map((raw, index) => {
              // 兼容分类列表条目与排行榜条目两种数据结构
              const item = raw as ListItem & Partial<ScriptRankItem & NewScriptRankItem>;
              const isListItem = tab === 'category';
              const script: ScriptInfo | null = isListItem
                ? (item as ListItem)
                : (item.script ?? null);
              const li = item as ListItem;
              const rank = isListItem ? undefined : (item as ScriptRankItem | NewScriptRankItem).rank;
              const playCount = isListItem
                ? li.playCount
                : (item as ScriptRankItem | NewScriptRankItem).playCount;
              const favCount = isListItem
                ? li.favCount
                : (item as NewScriptRankItem).favCount ?? null;
              const trend = !isListItem ? (item as ScriptRankItem).trend : undefined;
              const badge = tab === 'new' ? 'NEW' : undefined;

              if (!script) return null;

              return (
                <ScriptCard
                  key={isListItem ? li.id : (item as ScriptRankItem).rank ?? index}
                  rank={rank}
                  title={script.title}
                  cover={script.cover}
                  category={script.category}
                  authorName={script.author?.nickname}
                  playCount={playCount ?? 0}
                  favCount={favCount ?? undefined}
                  trend={trend}
                  badge={badge}
                  href={`/game/${script.id}`}
                />
              );
            })}
          </div>
        )}

        {/* 分页 */}
        {!loading && items.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-[var(--rule)] text-sm text-[var(--ink)]
                hover:bg-[var(--bg3)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              上一页
            </button>
            <span className="text-sm text-[var(--muted)]">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-[var(--rule)] text-sm text-[var(--ink)]
                hover:bg-[var(--bg3)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
