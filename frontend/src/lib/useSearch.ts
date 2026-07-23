'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import api from './api';

const HISTORY_KEY = 'search_history';
const MAX_HISTORY = 20;

export interface SearchScriptItem {
  id: number;
  title: string;
  cover: string | null;
  desc: string | null;
  category: string;
  playCount: number;
  favCount: number;
  createdAt: string;
  author: {
    id: number;
    nickname: string;
    avatar: string | null;
  };
}

export interface SearchResult {
  success: boolean;
  data: {
    items: SearchScriptItem[];
    total: number;
    page: number;
    limit: number;
  };
}

export interface SuggestItem {
  id: number;
  title: string;
  category: string;
  playCount: number;
  favCount: number;
  cover: string | null;
  desc: string | null;
}

export function useLocalStorageHistory() {
  const getHistory = useCallback((): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  const addHistory = useCallback((keyword: string) => {
    if (!keyword.trim()) return;
    const history = getHistory();
    const filtered = history.filter((k) => k !== keyword);
    filtered.unshift(keyword);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered.slice(0, MAX_HISTORY)));
  }, [getHistory]);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  return { getHistory, addHistory, clearHistory };
}

export function useSearch() {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<SearchScriptItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<'hot' | 'newest' | 'recommended'>('recommended');
  const [loading, setLoading] = useState(false);
  const [suggestList, setSuggestList] = useState<SuggestItem[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [hotKeywords, setHotKeywords] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const suggestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { getHistory, addHistory, clearHistory } = useLocalStorageHistory();

  // 搜索剧本
  const search = useCallback(
    async (params?: {
      keyword?: string;
      category?: string;
      sort?: 'hot' | 'newest' | 'recommended';
      page?: number;
    }) => {
      const kw = params?.keyword !== undefined ? params.keyword : keyword;
      const cat = params?.category !== undefined ? params.category : category;
      const s = params?.sort !== undefined ? params.sort : sort;
      const p = params?.page !== undefined ? params.page : page;

      setLoading(true);

      // 取消上一次未完成的请求
      if (abortRef.current) {
        abortRef.current.abort();
      }
      abortRef.current = new AbortController();

      try {
        const query: Record<string, string | number> = {
          page: p,
          limit,
          sort: s,
        };
        if (kw) query.keyword = kw;
        if (cat) query.category = cat;

        const res: SearchResult = await api.get('/search/scripts', {
          params: query,
          signal: abortRef.current.signal,
        });

        if (res.success) {
          setResults(res.data.items);
          setTotal(res.data.total);
          setPage(res.data.page);
          if (kw) {
            addHistory(kw);
          }
        }
      } catch (err: any) {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          console.error('搜索失败:', err);
        }
      } finally {
        setLoading(false);
      }
    },
    [keyword, category, sort, page, limit, addHistory],
  );

  // 搜索建议（防抖 300ms）
  const fetchSuggest = useCallback(
    (input: string) => {
      if (suggestTimerRef.current) {
        clearTimeout(suggestTimerRef.current);
      }

      if (!input.trim()) {
        setSuggestList([]);
        return;
      }

      setSuggestLoading(true);
      suggestTimerRef.current = setTimeout(async () => {
        try {
          const res = await api.get('/search/suggest', {
            params: { keyword: input },
          });
          if ((res as any).success) {
            setSuggestList((res as any).data);
          }
        } catch {
          // ignore
        } finally {
          setSuggestLoading(false);
        }
      }, 300);
    },
    [],
  );

  // 获取热门关键词
  const fetchHotKeywords = useCallback(async () => {
    try {
      const res = await api.get('/search/hot-keywords');
      if ((res as any).success) {
        setHotKeywords((res as any).data);
      }
    } catch {
      // ignore
    }
  }, []);

  // 获取搜索历史
  const getSearchHistory = useCallback(() => {
    return getHistory();
  }, [getHistory]);

  // 清除搜索历史
  const handleClearHistory = useCallback(() => {
    clearHistory();
  }, [clearHistory]);

  // 页码变更
  const changePage = useCallback(
    (newPage: number) => {
      setPage(newPage);
      search({ page: newPage });
    },
    [search],
  );

  // 分类变更
  const changeCategory = useCallback(
    (newCategory: string) => {
      setCategory(newCategory);
      setPage(1);
      search({ category: newCategory, page: 1 });
    },
    [search],
  );

  // 排序变更
  const changeSort = useCallback(
    (newSort: 'hot' | 'newest' | 'recommended') => {
      setSort(newSort);
      setPage(1);
      search({ sort: newSort, page: 1 });
    },
    [search],
  );

  // 关键词变更
  const changeKeyword = useCallback(
    (newKeyword: string) => {
      setKeyword(newKeyword);
      setPage(1);
      search({ keyword: newKeyword, page: 1 });
    },
    [search],
  );

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (suggestTimerRef.current) {
        clearTimeout(suggestTimerRef.current);
      }
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  return {
    keyword,
    setKeyword,
    results,
    total,
    page,
    limit,
    category,
    sort,
    loading,
    suggestList,
    suggestLoading,
    hotKeywords,
    search,
    fetchSuggest,
    fetchHotKeywords,
    getSearchHistory,
    handleClearHistory,
    changePage,
    changeCategory,
    changeSort,
    changeKeyword,
  };
}
