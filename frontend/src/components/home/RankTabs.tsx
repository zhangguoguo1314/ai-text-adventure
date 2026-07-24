'use client';

import { useTranslations } from 'next-intl';

const tabs = [
  { key: 'category' },
  { key: 'new' },
  { key: 'daily' },
  { key: 'weekly' },
  { key: 'monthly' },
  { key: 'author' },
];

interface RankTabsProps {
  activeTab: string;
  onTabChange: (key: string) => void;
}

export default function RankTabs({ activeTab, onTabChange }: RankTabsProps) {
  const t = useTranslations('home.rankTabs');

  return (
    <div className="flex gap-1 overflow-x-auto pb-2">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === tab.key
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--bg2)] text-[var(--ink)] hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]'
          }`}
        >
          {t(tab.key)}
        </button>
      ))}
    </div>
  );
}
