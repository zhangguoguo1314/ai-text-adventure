'use client';

import { useState, useEffect, useRef } from 'react';

interface AttributeChange {
  key: string;
  oldValue: number;
  newValue: number;
  timestamp: number;
}

interface AttributePanelProps {
  attributes: Record<string, any>;
}

// 属性分类定义
const COMBAT_ATTRS = ['HP', 'MP', '攻击', '防御', '速度', 'attack', 'defense', 'speed', 'hp', 'mp'];
const SOCIAL_ATTRS = ['魅力', '口才', '威望', 'charisma', 'eloquence', 'prestige'];

function getAttrGroup(key: string): 'combat' | 'social' | 'basic' {
  const lower = key.toLowerCase();
  if (COMBAT_ATTRS.some((a) => a.toLowerCase() === lower)) return 'combat';
  if (SOCIAL_ATTRS.some((a) => a.toLowerCase() === lower)) return 'social';
  return 'basic';
}

function getAttrEmoji(key: string): string {
  const lower = key.toLowerCase();
  if (lower === 'hp') return '❤️';
  if (lower === 'mp') return '💧';
  if (['attack', '攻击'].some((a) => a.toLowerCase() === lower)) return '⚔️';
  if (['defense', '防御'].some((a) => a.toLowerCase() === lower)) return '🛡️';
  if (['speed', '速度'].some((a) => a.toLowerCase() === lower)) return '💨';
  if (['charisma', '魅力'].some((a) => a.toLowerCase() === lower)) return '✨';
  if (['eloquence', '口才'].some((a) => a.toLowerCase() === lower)) return '🗣️';
  if (['prestige', '威望'].some((a) => a.toLowerCase() === lower)) return '👑';
  return '📊';
}

const GROUP_LABELS: Record<string, { label: string; emoji: string }> = {
  combat: { label: '战斗属性', emoji: '⚔️' },
  social: { label: '社交属性', emoji: '💬' },
  basic: { label: '基础属性', emoji: '📋' },
};

const GROUP_COLORS: Record<string, string> = {
  combat: 'border-red-700/30',
  social: 'border-blue-700/30',
  basic: 'border-slate-700/30',
};

function AttributeItem({ attrKey, value, change }: { attrKey: string; value: number; change: AttributeChange | null }) {
  const [flashClass, setFlashClass] = useState('');
  const prevChange = useRef<AttributeChange | null>(null);

  useEffect(() => {
    if (change && change !== prevChange.current) {
      prevChange.current = change;
      if (change.newValue > change.oldValue) {
        setFlashClass('animate-attr-flash-green');
      } else if (change.newValue < change.oldValue) {
        setFlashClass('animate-attr-flash-red');
      }
      const timer = setTimeout(() => setFlashClass(''), 1000);
      return () => clearTimeout(timer);
    }
  }, [change]);

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/20
                      ${flashClass}`}>
      <span className="text-lg flex-shrink-0">{getAttrEmoji(attrKey)}</span>
      <div className="flex-1 min-w-0">
        <span className="text-xs text-slate-500">{attrKey}</span>
      </div>
      <span className="text-lg font-bold text-violet-400 tabular-nums">{value}</span>
      {change && change.newValue !== change.oldValue && (
        <span className={`text-xs font-medium tabular-nums
          ${change.newValue > change.oldValue ? 'text-emerald-400' : 'text-red-400'}`}>
          {change.newValue > change.oldValue ? '+' : ''}{change.newValue - change.oldValue}
        </span>
      )}
    </div>
  );
}

export default function AttributePanel({ attributes }: AttributePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [changes, setChanges] = useState<Map<string, AttributeChange>>(new Map());
  const prevAttrs = useRef<Record<string, any>>(attributes);

  // 检测属性变化并产生闪烁效果
  useEffect(() => {
    const newChanges = new Map<string, AttributeChange>();
    for (const [key, value] of Object.entries(attributes)) {
      const oldVal = prevAttrs.current[key];
      if (oldVal !== undefined && typeof oldVal === 'number' && typeof value === 'number' && oldVal !== value) {
        newChanges.set(key, {
          key,
          oldValue: oldVal as number,
          newValue: value as number,
          timestamp: Date.now(),
        });
      }
    }
    if (newChanges.size > 0) {
      setChanges(newChanges);
    }
    prevAttrs.current = { ...attributes };
  }, [attributes]);

  const entries = Object.entries(attributes);
  if (entries.length === 0) return null;

  // 按分组整理
  const grouped: Record<string, [string, any][]> = { combat: [], social: [], basic: [] };
  for (const [key, value] of entries) {
    const group = getAttrGroup(key);
    grouped[group].push([key, value]);
  }

  return (
    <>
      {/* 切换按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-4 top-1/2 -translate-y-1/2 z-50
                   px-3 py-2 rounded-l-lg bg-slate-800/90 border border-r-0 border-slate-700
                   text-slate-400 hover:text-violet-400 transition-colors
                   backdrop-blur-sm"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={
              isOpen
                ? 'M13 5l7 7-7 7M5 5l7 7-7 7'
                : 'M11 19l-7-7 7-7m8 14l-7-7 7-7'
            }
          />
        </svg>
      </button>

      {/* 属性面板 */}
      <div
        className={`fixed right-0 top-0 h-full z-40 w-72 bg-slate-900/95 border-l border-slate-700
                    backdrop-blur-sm transition-transform duration-300 ease-in-out overflow-y-auto
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            属性面板
          </h3>

          <div className="space-y-6">
            {(['combat', 'social', 'basic'] as const).map((group) => {
              const items = grouped[group];
              if (items.length === 0) return null;
              const groupConfig = GROUP_LABELS[group];
              return (
                <div key={group}>
                  <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span>{groupConfig.emoji}</span>
                    {groupConfig.label}
                  </h4>
                  <div className={`space-y-2 p-3 rounded-lg border ${GROUP_COLORS[group]}`}>
                    {items.map(([key, value]) => (
                      <AttributeItem
                        key={key}
                        attrKey={key}
                        value={typeof value === 'number' ? value : Number(value) || 0}
                        change={changes.get(key) || null}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 遮罩 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
