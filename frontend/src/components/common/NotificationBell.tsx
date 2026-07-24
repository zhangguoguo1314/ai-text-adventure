'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import api from '@/lib/api';
import { useRealtime, useSocket } from '@/providers/SocketProvider';
import { useAuthStore } from '@/store/authStore';

interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

/** 通知类型 -> 图标 + 颜色 */
const typeMeta: Record<
  string,
  { icon: React.ReactNode; color: string; label: string }
> = {
  like: {
    label: '点赞',
    color: 'text-rose-500',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    ),
  },
  comment: {
    label: '评论',
    color: 'text-blue-500',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  follow: {
    label: '关注',
    color: 'text-emerald-500',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  system: {
    label: '系统',
    color: 'text-violet-500',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

function getTypeMeta(type: string) {
  return (
    typeMeta[type] || {
      ...typeMeta.system,
      label: '通知',
    }
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

interface NotificationBellProps {
  /** 适配深色侧边栏（紫色背景）时的浅色样式，默认 true */
  onDark?: boolean;
}

/**
 * 通知铃铛组件
 *
 * - 铃铛图标 + 未读数量红点
 * - 点击展开通知下拉面板（滑入 + 淡入动画）
 * - 实时接收新通知（WebSocket notification 事件）
 * - 标记全部已读
 * - 通知类型图标（点赞 / 评论 / 关注 / 系统）
 * - 下拉面板内滚动查看历史通知
 */
export default function NotificationBell({
  onDark = true,
}: NotificationBellProps) {
  const { isAuthenticated } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [mounted, setMounted] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  /** 拉取通知列表 */
  const fetchNotifications = useCallback(
    async (resetPage = false) => {
      if (!isAuthenticated) return;
      const targetPage = resetPage ? 1 : page;
      setLoading(true);
      try {
        const res: any = await api.get('/notifications', {
          params: { page: targetPage, pageSize: 15 },
        });
        if (res?.success) {
          const list = res.data.list as Notification[];
          setNotifications((prev) =>
            resetPage ? list : [...prev, ...list],
          );
          setUnreadCount(res.data.unreadCount || 0);
          setHasMore(list.length >= 15);
          if (!resetPage) setPage(targetPage + 1);
          else setPage(2);
        }
      } catch {
        // 静默失败
      }
      setLoading(false);
    },
    [isAuthenticated, page],
  );

  // 初次加载（仅未读数 + 首页）
  useEffect(() => {
    if (isAuthenticated) {
      setNotifications([]);
      setPage(1);
      fetchNotifications(true);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // 断线重连后拉取离线期间的通知
  const { connected } = useSocket();
  const hasConnectedBeforeRef = useRef(false);
  useEffect(() => {
    if (connected) {
      // 仅在「曾经连接过又断开」后的重连场景刷新，避免首次连接重复拉取
      if (hasConnectedBeforeRef.current) {
        fetchNotifications(true);
      }
      hasConnectedBeforeRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  // 实时接收新通知
  useRealtime('notification', useCallback((data: any) => {
    const n = data as Notification;
    setNotifications((prev) =>
      prev.some((x) => x.id === n.id) ? prev : [n, ...prev],
    );
    setUnreadCount((c) => c + 1);
  }, []));

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  /** 标记全部已读 */
  const markAllRead = useCallback(async () => {
    try {
      await api.put('/notifications/read');
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true })),
      );
      setUnreadCount(0);
    } catch {
      // 静默失败
    }
  }, []);

  /** 加载更多 */
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchNotifications(false);
    }
  }, [fetchNotifications, loading, hasMore]);

  // 计算面板位置（基于按钮位置，使用 portal 渲染到 body）
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const panelWidth = 360;
      const left = Math.min(
        rect.left,
        window.innerWidth - panelWidth - 16,
      );
      setPanelStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        left: Math.max(16, left),
        width: panelWidth,
        zIndex: 100,
      });
    }
  }, [open]);

  if (!isAuthenticated) return null;

  const iconColor = onDark ? 'text-violet-200' : 'text-[var(--ink)]';
  const hoverBg = onDark ? 'hover:bg-violet-800' : 'hover:bg-[var(--bg3)]';

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="通知"
        className={`relative p-1.5 rounded-lg transition-colors ${iconColor} ${hoverBg}`}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {/* 未读红点 */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 bg-[var(--danger)] text-white text-[10px] font-bold rounded-full animate-fade-in">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {/* 在线状态指示（连接中呼吸点） */}
      </button>

      {/* 下拉面板：通过 portal 渲染，避免被侧边栏 overflow 裁剪 */}
      {mounted &&
        open &&
        createPortal(
          <div ref={panelRef} style={panelStyle}>
            <div className="rounded-xl border border-[var(--rule)] bg-[var(--bg2)] shadow-xl overflow-hidden animate-fade-in">
              {/* 头部 */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--rule)]">
                <span className="text-sm font-semibold text-[var(--ink)]">
                  通知
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                  >
                    全部已读
                  </button>
                )}
              </div>

              {/* 通知列表（滚动） */}
              <div
                ref={listRef}
                className="max-h-[60vh] overflow-y-auto"
              >
                {notifications.length === 0 && !loading && (
                  <div className="py-12 text-center">
                    <svg
                      className="w-10 h-10 mx-auto mb-2 text-[var(--muted)] opacity-40"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    <p className="text-sm text-[var(--muted)]">
                      暂无通知
                    </p>
                  </div>
                )}

                {notifications.map((n) => {
                  const meta = getTypeMeta(n.type);
                  return (
                    <div
                      key={n.id}
                      className={`flex gap-3 px-4 py-3 border-b border-[var(--rule)] last:border-b-0 transition-colors hover:bg-[var(--bg3)] ${
                        !n.isRead ? 'bg-[var(--accent)]/5' : ''
                      }`}
                    >
                      {/* 类型图标 */}
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[var(--bg3)] ${meta.color}`}
                      >
                        {meta.icon}
                      </div>
                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-[var(--ink)] truncate">
                            {n.title}
                          </span>
                          {!n.isRead && (
                            <span className="flex-shrink-0 w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />
                          )}
                          <span className="ml-auto flex-shrink-0 text-[10px] text-[var(--muted)]">
                            {timeAgo(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--muted)] mt-0.5 line-clamp-2">
                          {n.content}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* 加载更多 */}
                {hasMore && notifications.length > 0 && (
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="w-full py-2.5 text-xs text-[var(--accent)] hover:bg-[var(--bg3)] transition-colors disabled:opacity-50"
                  >
                    {loading ? '加载中...' : '加载更多'}
                  </button>
                )}
                {!hasMore && notifications.length > 0 && (
                  <div className="py-3 text-center text-xs text-[var(--muted)]">
                    没有更多了
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
