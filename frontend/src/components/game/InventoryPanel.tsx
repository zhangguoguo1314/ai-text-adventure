'use client';

import { useState, useMemo } from 'react';

export interface InventoryItem {
  id: string;
  name: string;
  emoji: string;
  type: 'weapon' | 'armor' | 'consumable' | 'quest' | 'special';
  quantity: number;
  description: string;
  bonus?: Record<string, number>;
}

interface InventoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onUseItem: (itemId: string) => void;
  onEquipItem: (itemId: string) => void;
  onDropItem: (itemId: string) => void;
}

const TYPE_LABELS: Record<string, string> = {
  all: '全部',
  weapon: '武器',
  armor: '防具',
  consumable: '消耗品',
  quest: '任务',
  special: '特殊',
};

const TYPE_COLORS: Record<string, string> = {
  weapon: 'bg-red-900/50 text-red-300 border-red-700/50',
  armor: 'bg-blue-900/50 text-blue-300 border-blue-700/50',
  consumable: 'bg-green-900/50 text-green-300 border-green-700/50',
  quest: 'bg-amber-900/50 text-amber-300 border-amber-700/50',
  special: 'bg-purple-900/50 text-purple-300 border-purple-700/50',
};

type FilterType = 'all' | 'weapon' | 'armor' | 'consumable' | 'quest' | 'special';

export default function InventoryPanel({
  isOpen,
  onClose,
  items,
  onUseItem,
  onEquipItem,
  onDropItem,
}: InventoryPanelProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    let result = items;
    if (activeFilter !== 'all') {
      result = result.filter((item) => item.type === activeFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (item) => item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q),
      );
    }
    return result;
  }, [items, activeFilter, search]);

  const selectedItem = selectedItemId ? items.find((i) => i.id === selectedItemId) : null;

  if (!isOpen) return null;

  return (
    <>
      {/* 遮罩 */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />

      {/* 面板 */}
      <div className="fixed right-0 top-0 h-full z-50 w-80 bg-slate-900/98 border-l border-slate-700 
                     backdrop-blur-sm overflow-y-auto animate-slide-in-right">
        {/* 头部 */}
        <div className="sticky top-0 bg-slate-900/98 border-b border-slate-700/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🎒</span> 背包
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 搜索 */}
          <div className="relative mb-3">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索物品..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 text-slate-200 
                         placeholder-slate-500 text-sm border border-slate-700/50
                         focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            />
          </div>

          {/* 分类标签 */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {(Object.keys(TYPE_LABELS) as FilterType[]).map((type) => (
              <button
                key={type}
                onClick={() => setActiveFilter(type)}
                className={`px-2.5 py-1 rounded-md text-xs whitespace-nowrap transition-colors
                  ${activeFilter === type
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-300 hover:bg-slate-700'
                  }`}
              >
                {TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        {/* 物品列表 */}
        <div className="p-4">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <span className="text-4xl mb-3">📭</span>
              <p className="text-sm">
                {search ? '没有找到匹配的物品' : '背包是空的'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItemId(selectedItemId === item.id ? null : item.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all
                    ${selectedItemId === item.id
                      ? 'bg-slate-700/50 border-violet-500/50'
                      : 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50 hover:border-slate-600/50'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    {/* emoji 图标 */}
                    <span className="text-2xl flex-shrink-0 w-10 h-10 flex items-center justify-center 
                                     rounded-lg bg-slate-800 border border-slate-700/50">
                      {item.emoji}
                    </span>

                    {/* 名称和数量 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-200 truncate">{item.name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] border ${TYPE_COLORS[item.type] || ''}`}>
                          {TYPE_LABELS[item.type]}
                        </span>
                      </div>
                      {item.quantity > 1 && (
                        <span className="text-xs text-slate-500">x{item.quantity}</span>
                      )}
                    </div>

                    {/* 展开箭头 */}
                    <svg
                      className={`w-4 h-4 text-slate-500 transition-transform flex-shrink-0
                        ${selectedItemId === item.id ? 'rotate-90' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>

                  {/* 展开详情 */}
                  {selectedItemId === item.id && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 animate-fade-in">
                      <p className="text-xs text-slate-400 mb-3">{item.description}</p>

                      {/* 属性加成 */}
                      {item.bonus && Object.keys(item.bonus).length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-1.5">
                          {Object.entries(item.bonus).map(([key, val]) => (
                            <span
                              key={key}
                              className="px-2 py-0.5 rounded text-xs bg-violet-900/50 text-violet-300 border border-violet-700/50"
                            >
                              {key} {val > 0 ? '+' : ''}{val}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 操作按钮 */}
                      <div className="flex gap-2">
                        {(item.type === 'consumable' || item.type === 'quest') && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onUseItem(item.id); }}
                            className="flex-1 px-3 py-1.5 rounded-md bg-emerald-600 text-white text-xs 
                                       hover:bg-emerald-500 transition-colors"
                          >
                            使用
                          </button>
                        )}
                        {(item.type === 'weapon' || item.type === 'armor') && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onEquipItem(item.id); }}
                            className="flex-1 px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs 
                                       hover:bg-blue-500 transition-colors"
                          >
                            装备
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); onDropItem(item.id); }}
                          className="px-3 py-1.5 rounded-md bg-red-900/50 text-red-400 text-xs border border-red-700/50 
                                     hover:bg-red-800/50 transition-colors"
                        >
                          丢弃
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
