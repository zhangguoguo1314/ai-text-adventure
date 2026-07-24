'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

export interface GameToast {
  id: string;
  type: 'item' | 'achievement' | 'skill' | 'karma' | 'npc' | 'info';
  emoji: string;
  title: string;
  description?: string;
  timestamp: number;
}

interface GameEventHandlersProps {
  events: GameToast[];
  onDismiss: (id: string) => void;
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: GameToast;
  onDismiss: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));

    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(onDismiss, 300);
    }, 4000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const bgColors: Record<string, string> = {
    item: 'bg-emerald-900/80 border-emerald-700/50',
    achievement: 'bg-amber-900/80 border-amber-700/50',
    skill: 'bg-cyan-900/80 border-cyan-700/50',
    karma: 'bg-purple-900/80 border-purple-700/50',
    npc: 'bg-blue-900/80 border-blue-700/50',
    info: 'bg-slate-800/80 border-slate-700/50',
  };

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg
                  backdrop-blur-sm transition-all duration-300 min-w-[280px] max-w-[360px]
                  ${bgColors[toast.type] || bgColors.info}
                  ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
                  ${isLeaving ? 'translate-x-full opacity-0' : ''}`}
    >
      {/* emoji */}
      <span className="text-xl flex-shrink-0 mt-0.5">{toast.emoji}</span>

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-slate-400 mt-0.5 truncate">{toast.description}</p>
        )}
      </div>

      {/* 关闭 */}
      <button
        onClick={() => {
          setIsLeaving(true);
          setTimeout(onDismiss, 300);
        }}
        className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function GameEventHandlers({
  events,
  onDismiss,
}: GameEventHandlersProps) {
  if (events.length === 0) return null;

  return (
    <div className="fixed left-4 top-20 z-[100] flex flex-col gap-2 pointer-events-auto">
      {events.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  );
}
