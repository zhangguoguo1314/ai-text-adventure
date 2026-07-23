'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSearch, SuggestItem, useLocalStorageHistory } from '@/lib/useSearch';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  onSearch?: (keyword: string) => void;
}

export default function SearchModal({ open, onClose, onSearch }: SearchModalProps) {
  const [inputValue, setInputValue] = useState('');
  const [localHistory, setLocalHistory] = useState<string[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [selectedSuggestIndex, setSelectedSuggestIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const {
    hotKeywords,
    suggestList,
    suggestLoading,
    fetchSuggest,
    fetchHotKeywords,
    getSearchHistory,
    handleClearHistory,
  } = useSearch();

  const { addHistory: addLocalStorageHistory } = useLocalStorageHistory();

  // 打开时聚焦输入框、加载热门关键词
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      fetchHotKeywords();
      setLocalHistory(getSearchHistory());
      setInputValue('');
      setShowSuggest(false);
    }
  }, [open]);

  // Ctrl+K / Cmd+K 快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) {
          onClose();
        } else {
          onSearch?.('');
        }
      }
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, onSearch]);

  // 防抖搜索建议
  const handleInputChange = useCallback(
    (value: string) => {
      setInputValue(value);
      setSelectedSuggestIndex(-1);
      if (value.trim()) {
        fetchSuggest(value);
        setShowSuggest(true);
      } else {
        setShowSuggest(false);
      }
    },
    [fetchSuggest],
  );

  // 执行搜索
  const handleSearch = useCallback(
    (keyword?: string) => {
      const kw = (keyword || inputValue).trim();
      if (kw) {
        addLocalStorageHistory(kw);
        onSearch?.(kw);
        onClose();
      }
    },
    [inputValue, onSearch, onClose, addLocalStorageHistory],
  );

  // 点击建议项
  const handleSuggestClick = useCallback(
    (item: SuggestItem) => {
      addLocalStorageHistory(item.title);
      onSearch?.(item.title);
      onClose();
    },
    [onSearch, onClose, addLocalStorageHistory],
  );

  // 键盘导航建议列表
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showSuggest || suggestList.length === 0) {
        if (e.key === 'Enter') {
          handleSearch();
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestIndex((prev) =>
          prev < suggestList.length - 1 ? prev + 1 : 0,
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestIndex((prev) =>
          prev > 0 ? prev - 1 : suggestList.length - 1,
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedSuggestIndex >= 0 && suggestList[selectedSuggestIndex]) {
          handleSuggestClick(suggestList[selectedSuggestIndex]);
        } else {
          handleSearch();
        }
      }
    },
    [showSuggest, suggestList, selectedSuggestIndex, handleSearch, handleSuggestClick],
  );

  // 清除历史
  const handleClear = useCallback(() => {
    handleClearHistory();
    setLocalHistory([]);
  }, [handleClearHistory]);

  // 点击弹窗外部关闭
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose],
  );

  if (!open) return null;

  const hasContent = inputValue.trim() || localHistory.length > 0 || hotKeywords.length > 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh]"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/40 animate-[fadeIn_0.2s_ease-out]" />

      {/* 弹窗主体 */}
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl mx-4 bg-[var(--bg2)] rounded-2xl shadow-2xl overflow-hidden animate-[slideDown_0.25s_ease-out]"
      >
        {/* 搜索输入框 */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--rule)]">
          <svg
            className="w-5 h-5 text-[var(--muted)] flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索剧本、关键词..."
            className="flex-1 bg-transparent text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none text-base"
          />
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--bg3)] text-xs text-[var(--muted)] border border-[var(--rule)]">
            <span className="text-xs">ESC</span>
          </kbd>
        </div>

        {/* 内容区域 */}
        {hasContent && (
          <div className="max-h-[60vh] overflow-y-auto p-4">
            {/* 搜索建议下拉 */}
              {showSuggest && (inputValue.trim() || suggestLoading) && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-[var(--muted)] mb-2 px-1">
                    搜索建议
                  </p>
                  {suggestLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : suggestList.length > 0 ? (
                    <div className="space-y-1">
                      {suggestList.map((item, index) => (
                        <button
                          key={item.id}
                          onClick={() => handleSuggestClick(item)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                            index === selectedSuggestIndex
                              ? 'bg-violet-50 dark:bg-violet-900/30'
                              : 'hover:bg-[var(--bg3)]'
                          }`}
                        >
                          <svg
                            className="w-4 h-4 text-[var(--muted)] flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[var(--ink)] truncate">
                              {item.title}
                            </p>
                            <p className="text-xs text-[var(--muted)]">
                              {item.playCount} 次游玩
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-xs flex-shrink-0">
                            {item.category}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--muted)] text-center py-4">
                      没有找到相关建议
                    </p>
                  )}
                </div>
              )}

              {/* 搜索历史 */}
              {!inputValue.trim() && localHistory.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <p className="text-xs font-medium text-[var(--muted)]">
                      搜索历史
                    </p>
                    <button
                      onClick={handleClear}
                      className="text-xs text-[var(--muted)] hover:text-[var(--danger)] transition-colors"
                    >
                      清空
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {localHistory.map((kw) => (
                      <button
                        key={kw}
                        onClick={() => handleSearch(kw)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg3)] text-sm text-[var(--ink)] hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
                      >
                        <svg
                          className="w-3 h-3 text-[var(--muted)]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {kw}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 热门搜索 */}
              {!inputValue.trim() && (
                <div>
                  <p className="text-xs font-medium text-[var(--muted)] mb-2 px-1">
                    热门搜索
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {hotKeywords.map((kw, index) => (
                      <button
                        key={kw}
                        onClick={() => handleSearch(kw)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors
                          bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20
                          text-violet-700 dark:text-violet-300 hover:from-violet-100 hover:to-purple-100 dark:hover:from-violet-900/30 dark:hover:to-purple-900/30"
                      >
                        <span className="text-xs font-bold text-violet-500 dark:text-violet-400">
                          {index + 1}
                        </span>
                        {kw}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 搜索结果网格 */}
              {inputValue.trim() && !showSuggest && (
                <SearchResultGrid keyword={inputValue} />
              )}
            </div>
          )}

        {/* 底部提示 */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--rule)] text-xs text-[var(--muted)]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg3)] border border-[var(--rule)] text-xs">
                <span className="text-[10px]">
                  {typeof navigator !== 'undefined' && /Mac/i.test(navigator.userAgent) ? '\u2318' : 'Ctrl'}
                </span>
                K
              </kbd>
              打开搜索
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg3)] border border-[var(--rule)] text-xs">
                ESC
              </kbd>
              关闭
            </span>
          </div>
          <Link
            href="/explore"
            onClick={onClose}
            className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
          >
            前往探索页
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-16px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/** 搜索弹窗内的快速结果网格 */
function SearchResultGrid({ keyword }: { keyword: string }) {
  const { results, loading, search } = useSearch();

  useEffect(() => {
    if (keyword) {
      search({ keyword, sort: 'recommended' });
    }
  }, [keyword]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-sm text-[var(--muted)]">搜索中...</span>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[var(--muted)]">没有找到与 &ldquo;{keyword}&rdquo; 相关的剧本</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-[var(--muted)] mb-2 px-1">
        搜索结果
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {results.slice(0, 6).map((item) => (
          <Link
            key={item.id}
            href={`/game/${item.id}`}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg3)] transition-colors group"
          >
            <div className="w-12 h-16 rounded-md bg-gradient-to-br from-violet-200 to-purple-300 dark:from-violet-800 dark:to-purple-900 flex-shrink-0 overflow-hidden">
              {item.cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.cover}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--ink)] group-hover:text-violet-600 dark:group-hover:text-violet-400 truncate">
                {item.title}
              </p>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                {item.author?.nickname || '未知作者'}
              </p>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                {item.playCount} 次游玩
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
