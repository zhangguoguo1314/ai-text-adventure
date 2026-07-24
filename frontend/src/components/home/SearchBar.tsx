'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import SearchModal from '@/components/search/SearchModal';

export default function SearchBar() {
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [pendingKeyword, setPendingKeyword] = useState('');
  const t = useTranslations('home');

  const handleOpenSearch = () => {
    setSearchModalOpen(true);
  };

  const handleSearch = (keyword: string) => {
    setPendingKeyword(keyword);
    // 如果有关键词，跳转到探索页面
    if (keyword) {
      window.location.href = `/explore?keyword=${encodeURIComponent(keyword)}`;
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpenSearch}
        className="w-full max-w-xl mx-auto"
      >
        <div className="relative flex items-center h-11 pl-4 pr-12 rounded-full bg-white border border-[var(--rule)] text-left transition-shadow hover:shadow-md group">
          <span className="text-[var(--muted)] text-sm flex-1">
            {t('searchPlaceholder')}
          </span>
          <div className="flex items-center gap-2">
            {/* 快捷键提示 */
            }
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-[var(--bg3)] text-[10px] text-[var(--muted)] border border-[var(--rule)]">
              <span className="text-[10px]">
                {typeof navigator !== 'undefined' && /Mac/i.test(navigator.userAgent) ? '\u2318' : 'Ctrl'}
              </span>
              K
            </kbd>
            <div className="w-9 h-9 rounded-full bg-violet-600 group-hover:bg-violet-700 flex items-center justify-center text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </button>

      <SearchModal
        open={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSearch={handleSearch}
      />
    </>
  );
}
