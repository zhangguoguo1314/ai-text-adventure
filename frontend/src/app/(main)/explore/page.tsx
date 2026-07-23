'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SearchResults from '@/components/search/SearchResults';
import SearchModal from '@/components/search/SearchModal';
import { useSearch } from '@/lib/useSearch';

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialKeyword = searchParams.get('keyword') || '';

  const {
    keyword,
    results,
    total,
    page,
    limit,
    category,
    sort,
    loading,
    hotKeywords,
    search,
    fetchHotKeywords,
    changePage,
    changeCategory,
    changeSort,
    changeKeyword,
  } = useSearch();

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(initialKeyword);

  // 初始化搜索
  useEffect(() => {
    fetchHotKeywords();
    if (initialKeyword) {
      changeKeyword(initialKeyword);
      setSearchInput(initialKeyword);
    } else {
      search();
    }
    // 只在初始加载时执行
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 执行搜索
  const handleSearch = useCallback(() => {
    const kw = searchInput.trim();
    changeKeyword(kw);
    if (kw) {
      router.push(`/explore?keyword=${encodeURIComponent(kw)}`, { scroll: false });
    } else {
      router.push('/explore', { scroll: false });
    }
  }, [searchInput, changeKeyword, router]);

  // 从搜索弹窗跳转
  const handleModalSearch = useCallback((kw: string) => {
    setSearchInput(kw);
    setSearchModalOpen(false);
    changeKeyword(kw);
    if (kw) {
      router.push(`/explore?keyword=${encodeURIComponent(kw)}`, { scroll: false });
    }
  }, [changeKeyword, router]);

  // 点击热门标签
  const handleHotTagClick = useCallback((kw: string) => {
    setSearchInput(kw);
    changeKeyword(kw);
    router.push(`/explore?keyword=${encodeURIComponent(kw)}`, { scroll: false });
  }, [changeKeyword, router]);

  return (
    <div className="max-w-6xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--ink)]">探索</h1>
        <p className="text-sm text-[var(--muted)] mt-1">发现精彩的 AI 文字冒险剧本</p>
      </div>

      {/* 搜索栏 */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
            placeholder="搜索剧本、关键词..."
            className="w-full h-10 pl-4 pr-12 rounded-full bg-[var(--bg2)] border border-[var(--rule)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-shadow"
          />
          <button
            onClick={handleSearch}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-violet-600 hover:bg-violet-700 flex items-center justify-center text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
        <button
          onClick={() => setSearchModalOpen(true)}
          className="hidden sm:flex items-center gap-1.5 px-3 h-10 rounded-full bg-[var(--bg3)] text-sm text-[var(--muted)] hover:text-[var(--ink)] transition-colors border border-[var(--rule)]"
        >
          <kbd className="px-1 py-0.5 rounded bg-[var(--bg2)] border border-[var(--rule)] text-[10px]">
            {typeof navigator !== 'undefined' && /Mac/i.test(navigator.userAgent) ? '\u2318' : 'Ctrl'}
          </kbd>
          K
        </button>
      </div>

      {/* 当前搜索提示 */}
      {keyword && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-[var(--muted)]">
            搜索：<span className="font-medium text-[var(--ink)]">{keyword}</span>
          </span>
          <button
            onClick={() => {
              setSearchInput('');
              changeKeyword('');
              router.push('/explore', { scroll: false });
            }}
            className="p-0.5 rounded-full hover:bg-[var(--bg3)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex gap-6">
        {/* 主内容区 */}
        <div className="flex-1 min-w-0">
          <SearchResults
            results={results}
            total={total}
            page={page}
            limit={limit}
            loading={loading}
            category={category}
            sort={sort}
            keyword={keyword}
            onChangePage={changePage}
            onChangeCategory={changeCategory}
            onChangeSort={changeSort}
          />
        </div>

        {/* 侧边栏 - 仅桌面端显示 */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          {/* 热门标签 */}
          <div className="bg-[var(--bg2)] rounded-xl p-4 card-shadow mb-4">
            <h3 className="text-sm font-semibold text-[var(--ink)] mb-3">热门标签</h3>
            <div className="flex flex-wrap gap-2">
              {hotKeywords.map((kw) => (
                <button
                  key={kw}
                  onClick={() => handleHotTagClick(kw)}
                  className="px-3 py-1 rounded-full text-xs bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 text-violet-700 dark:text-violet-300 hover:from-violet-100 hover:to-purple-100 dark:hover:from-violet-900/30 dark:hover:to-purple-900/30 transition-colors"
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>

          {/* 推荐剧本 */}
          <div className="bg-[var(--bg2)] rounded-xl p-4 card-shadow">
            <h3 className="text-sm font-semibold text-[var(--ink)] mb-3">推荐剧本</h3>
            <div className="space-y-3">
              {results.slice(0, 5).map((item) => (
                <a
                  key={item.id}
                  href={`/game/${item.id}`}
                  className="block group"
                >
                  <p className="text-sm font-medium text-[var(--ink)] group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate">
                    {item.title}
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    {item.playCount} 次游玩 · {item.favCount} 收藏
                  </p>
                </a>
              ))}
              {results.length === 0 && (
                <p className="text-sm text-[var(--muted)]">暂无推荐</p>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* 搜索弹窗 */}
      <SearchModal
        open={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSearch={handleModalSearch}
      />
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <div className="h-8 w-24 bg-[var(--bg3)] rounded animate-pulse" />
            <div className="h-4 w-48 bg-[var(--bg3)] rounded animate-pulse mt-2" />
          </div>
          <div className="h-10 max-w-xl bg-[var(--bg3)] rounded-full animate-pulse mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[var(--bg3)] rounded-xl h-64 animate-pulse" />
            ))}
          </div>
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
