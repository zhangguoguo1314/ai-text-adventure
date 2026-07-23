'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { SearchScriptItem } from '@/lib/useSearch';
import { formatNumber, truncateText } from '@/lib/utils';

const CATEGORY_OPTIONS = [
  { label: '全部', value: '' },
  { label: '冒险', value: 'adventure' },
  { label: '恋爱', value: 'romance' },
  { label: '悬疑', value: 'mystery' },
  { label: '恐怖', value: 'horror' },
  { label: '科幻', value: 'scifi' },
  { label: '奇幻', value: 'fantasy' },
  { label: '校园', value: 'school' },
];

const SORT_OPTIONS = [
  { label: '推荐', value: 'recommended' as const },
  { label: '最热', value: 'hot' as const },
  { label: '最新', value: 'newest' as const },
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

interface SearchResultsProps {
  results: SearchScriptItem[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  category: string;
  sort: 'hot' | 'newest' | 'recommended';
  keyword?: string;
  onChangePage: (page: number) => void;
  onChangeCategory: (category: string) => void;
  onChangeSort: (sort: 'hot' | 'newest' | 'recommended') => void;
}

export default function SearchResults({
  results,
  total,
  page,
  limit,
  loading,
  category,
  sort,
  keyword,
  onChangePage,
  onChangeCategory,
  onChangeSort,
}: SearchResultsProps) {
  const totalPages = useMemo(
    () => Math.ceil(total / limit),
    [total, limit],
  );

  // 分页按钮范围
  const pageRange = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [page, totalPages]);

  // 空状态
  if (!loading && results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <svg
          className="w-16 h-16 text-[var(--muted)] mb-4 opacity-50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <p className="text-lg text-[var(--muted)] mb-1">
          {keyword ? `没有找到与 "${keyword}" 相关的剧本` : '暂无剧本'}
        </p>
        <p className="text-sm text-[var(--muted)] opacity-70">
          试试其他关键词或分类
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* 筛选栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        {/* 分类标签横向滚动 */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChangeCategory(opt.value)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                category === opt.value
                  ? 'bg-violet-600 text-white'
                  : 'bg-[var(--bg3)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-violet-100 dark:hover:bg-violet-900/30'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* 排序切换 */}
        <div className="flex items-center gap-1 bg-[var(--bg3)] rounded-lg p-1 flex-shrink-0">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChangeSort(opt.value)}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                sort === opt.value
                  ? 'bg-[var(--bg2)] text-violet-700 dark:text-violet-300 shadow-sm font-medium'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 结果统计 */}
      <p className="text-sm text-[var(--muted)] mb-4">
        共 <span className="font-medium text-[var(--ink)]">{total}</span> 个剧本
      </p>

      {/* 加载状态 */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-[var(--bg2)] rounded-xl overflow-hidden card-shadow animate-pulse"
            >
              <div className="w-full h-40 bg-[var(--bg3)]" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-[var(--bg3)] rounded w-3/4" />
                <div className="h-3 bg-[var(--bg3)] rounded w-full" />
                <div className="h-3 bg-[var(--bg3)] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ScriptCard 网格布局 */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((item) => (
            <Link
              key={item.id}
              href={`/game/${item.id}`}
              className="block"
            >
              <div className="bg-[var(--bg2)] rounded-xl overflow-hidden card-shadow hover:shadow-lg transition-shadow group">
                {/* 封面 */}
                <div className="w-full h-40 bg-gradient-to-br from-violet-200 to-purple-300 dark:from-violet-800 dark:to-purple-900 relative overflow-hidden">
                  {item.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.cover}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl opacity-50">
                        {CATEGORY_LABELS[item.category] === '冒险' ? '⚔️' :
                         CATEGORY_LABELS[item.category] === '恋爱' ? '💕' :
                         CATEGORY_LABELS[item.category] === '悬疑' ? '🔍' :
                         CATEGORY_LABELS[item.category] === '恐怖' ? '👻' :
                         CATEGORY_LABELS[item.category] === '科幻' ? '🚀' :
                         CATEGORY_LABELS[item.category] === '奇幻' ? '🧙' : '📚'}
                      </span>
                    </div>
                  )}
                  {/* 分类标签 */}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/40 text-white text-xs backdrop-blur-sm">
                    {CATEGORY_LABELS[item.category] || item.category}
                  </span>
                </div>

                {/* 信息 */}
                <div className="p-4">
                  <h3 className="text-base font-semibold text-[var(--ink)] group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-[var(--muted)] line-clamp-2">
                    {truncateText(item.desc || '')}
                  </p>
                  <div className="flex items-center justify-between mt-3 text-xs text-[var(--muted)]">
                    <span>{item.author?.nickname || '未知作者'}</span>
                    <span>{formatNumber(item.playCount)} 次游玩</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-8">
          {/* 上一页 */}
          <button
            onClick={() => onChangePage(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[var(--bg2)] hover:bg-[var(--bg3)] text-[var(--ink)]"
          >
            上一页
          </button>

          {/* 页码 */}
          {pageRange.map((p) => (
            <button
              key={p}
              onClick={() => onChangePage(p)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? 'bg-violet-600 text-white'
                  : 'bg-[var(--bg2)] hover:bg-[var(--bg3)] text-[var(--ink)]'
              }`}
            >
              {p}
            </button>
          ))}

          {/* 下一页 */}
          <button
            onClick={() => onChangePage(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[var(--bg2)] hover:bg-[var(--bg3)] text-[var(--ink)]"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
