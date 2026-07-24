'use client';

import { useState } from 'react';

interface KarmaIndicatorProps {
  value: number; // -100 到 100
}

const KARMA_LABELS: Record<string, { label: string; color: string }> = {
  evil: { label: '邪恶', color: 'text-red-400' },
  chaotic: { label: '混乱', color: 'text-orange-400' },
  neutral: { label: '中立', color: 'text-slate-400' },
  good: { label: '善良', color: 'text-emerald-400' },
  pure: { label: '纯洁', color: 'text-cyan-300' },
};

function getKarmaLevel(value: number) {
  if (value <= -60) return 'evil';
  if (value <= -20) return 'chaotic';
  if (value <= 20) return 'neutral';
  if (value <= 60) return 'good';
  return 'pure';
}

export default function KarmaIndicator({ value }: KarmaIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const clampedValue = Math.max(-100, Math.min(100, value));
  const percentage = ((clampedValue + 100) / 200) * 100;
  const level = getKarmaLevel(clampedValue);
  const { label, color } = KARMA_LABELS[level];

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* 指示条 */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-slate-500">善恶</span>
        <div className="w-24 h-2 rounded-full overflow-hidden bg-slate-800 border border-slate-700/50">
          <div className="relative w-full h-full">
            {/* 渐变背景 */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'linear-gradient(to right, #ef4444, #f59e0b, #6b7280, #22c55e, #06b6d4)',
              }}
            />
            {/* 当前值标记 */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-slate-900 shadow-lg transition-all duration-500"
              style={{ left: `${percentage}%`, marginLeft: '-6px' }}
            />
          </div>
        </div>
      </div>

      {/* 悬停提示 */}
      {showTooltip && (
        <div
          className="absolute top-full mt-2 right-0 px-3 py-2 rounded-lg bg-slate-800/95 
                     border border-slate-700 shadow-xl z-50 whitespace-nowrap
                     animate-fade-in"
        >
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${color}`}>{label}</span>
            <span className="text-sm text-slate-400">
              {clampedValue > 0 ? '+' : ''}{clampedValue}
            </span>
          </div>
          <div className="absolute -top-1 right-4 w-2 h-2 bg-slate-800 border-l border-t border-slate-700 rotate-45" />
        </div>
      )}
    </div>
  );
}
