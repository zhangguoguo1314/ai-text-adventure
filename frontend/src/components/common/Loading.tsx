'use client';

interface LoadingProps {
  text?: string;
}

export default function Loading({ text = '加载中...' }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 border-4 border-[var(--accent2)]/30 rounded-full" />
        <div className="absolute inset-0 border-4 border-transparent border-t-[var(--accent)] rounded-full animate-spin" />
      </div>
      <p className="mt-4 text-sm text-[var(--muted)]">{text}</p>
    </div>
  );
}

/* ---------- Skeleton ---------- */

interface SkeletonProps {
  /** 行数 */
  lines?: number;
  /** 是否显示圆形头像占位 */
  avatar?: boolean;
  /** 是否显示标题行（更宽） */
  title?: boolean;
  className?: string;
}

export function Skeleton({
  lines = 3,
  avatar = false,
  title = true,
  className = '',
}: SkeletonProps) {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      <div className="flex items-start gap-3">
        {avatar && (
          <div className="w-10 h-10 rounded-full bg-[var(--bg3)] flex-shrink-0" />
        )}
        <div className="flex-1 space-y-2">
          {title && (
            <div className="h-4 rounded bg-[var(--bg3)] w-3/4" />
          )}
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className="h-3 rounded bg-[var(--bg3)]"
              style={{ width: `${Math.max(40, 100 - i * 15)}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** 卡片骨架屏 */
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-[var(--bg2)] border border-[var(--rule)] p-4 ${className}`}
    >
      <div className="flex gap-4">
        {/* 排名 */}
        <div className="w-8 h-8 rounded-full bg-[var(--bg3)] flex-shrink-0" />
        {/* 封面 */}
        <div className="w-24 h-32 rounded-lg bg-[var(--bg3)] flex-shrink-0" />
        {/* 信息 */}
        <div className="flex-1 space-y-2">
          <div className="h-4 rounded bg-[var(--bg3)] w-2/3" />
          <div className="h-3 rounded bg-[var(--bg3)] w-full" />
          <div className="h-3 rounded bg-[var(--bg3)] w-5/6" />
          <div className="h-3 rounded bg-[var(--bg3)] w-4/6" />
          <div className="flex gap-3 mt-3">
            <div className="h-5 rounded-full bg-[var(--bg3)] w-16" />
            <div className="h-5 rounded-full bg-[var(--bg3)] w-14" />
          </div>
        </div>
      </div>
    </div>
  );
}
