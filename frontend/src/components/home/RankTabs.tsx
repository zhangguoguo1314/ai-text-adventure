'use client';

const tabs = [
  { key: 'category', label: '分类' },
  { key: 'new', label: '新作榜' },
  { key: 'daily', label: '日榜' },
  { key: 'weekly', label: '周榜' },
  { key: 'monthly', label: '月榜' },
  { key: 'author', label: '作者榜' },
];

interface RankTabsProps {
  activeTab: string;
  onTabChange: (key: string) => void;
}

export default function RankTabs({ activeTab, onTabChange }: RankTabsProps) {
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
          {tab.label}
        </button>
      ))}
    </div>
  );
}
