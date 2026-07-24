'use client';

import { useEffect, useState } from 'react';

export interface ItemChange {
  id: string;
  name: string;
  emoji: string;
  quantity: number; // 正数=获得，负数=失去
  timestamp: number;
}

interface ItemNotificationProps {
  items: ItemChange[];
  onDismiss: (id: string) => void;
}

function NotificationItem({
  item,
  onDismiss,
}: {
  item: ItemChange;
  onDismiss: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // 滑入动画
    requestAnimationFrame(() => setIsVisible(true));

    // 3秒后滑出
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(onDismiss, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const isGain = item.quantity > 0;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg
                  backdrop-blur-sm transition-all duration-300
                  ${isGain
                    ? 'bg-emerald-900/80 border-emerald-700/50'
                    : 'bg-red-900/80 border-red-700/50'
                  }
                  ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
                  ${isLeaving ? 'translate-x-full opacity-0' : ''}`}
    >
      {/* emoji */}
      <span className="text-xl flex-shrink-0">{item.emoji}</span>

      {/* 文字 */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isGain ? 'text-emerald-300' : 'text-red-300'}`}>
          {isGain ? '+' : ''}{item.quantity} {item.emoji} {item.name}
        </p>
      </div>

      {/* 关闭按钮 */}
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

export default function ItemNotification({ items, onDismiss }: ItemNotificationProps) {
  if (items.length === 0) return null;

  return (
    <div className="fixed right-4 top-20 z-[100] flex flex-col gap-2 w-64 pointer-events-auto">
      {items.map((item) => (
        <NotificationItem
          key={item.id}
          item={item}
          onDismiss={() => onDismiss(item.id)}
        />
      ))}
    </div>
  );
}
