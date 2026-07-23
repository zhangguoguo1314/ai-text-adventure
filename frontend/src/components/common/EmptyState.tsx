'use client';

import { type ReactNode } from 'react';

interface EmptyStateProps {
  /** 图标（SVG 元素或 ReactNode） */
  icon?: ReactNode;
  /** 标题 */
  title?: string;
  /** 描述文字 */
  description?: string;
  /** 操作按钮 */
  action?: ReactNode;
}

const DefaultIcon = () => (
  <svg
    className="w-16 h-16 text-[var(--muted)] opacity-40"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
    />
  </svg>
);

export default function EmptyState({
  icon,
  title = '暂无内容',
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="mb-4">{icon || <DefaultIcon />}</div>
      {title && (
        <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-sm text-[var(--muted)] max-w-sm">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
