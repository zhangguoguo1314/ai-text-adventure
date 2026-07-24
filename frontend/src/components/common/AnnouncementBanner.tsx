'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { useRealtime } from '@/providers/SocketProvider';

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: string; // normal | urgent
  createdAt: string;
}

/** 本地存储已关闭公告的 key 前缀 */
const DISMISS_KEY = 'dismissed_announcement_';

/**
 * 公告横幅组件
 *
 * - 页面顶部显示紧急 / 普通公告
 * - 可关闭（关闭后本地记忆，不再重复弹出同一公告）
 * - 从 WebSocket 实时接收新公告（announcement 事件）
 * - urgent 类型显示红色背景，normal 类型显示蓝色背景
 */
export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** 判断某公告是否已被用户关闭 */
  const isDismissed = useCallback((a: Announcement) => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(DISMISS_KEY + a.id) === '1';
  }, []);

  /** 显示公告（带淡入动画） */
  const showAnnouncement = useCallback(
    (a: Announcement) => {
      if (isDismissed(a)) return;
      setAnnouncement(a);
      setVisible(true);
    },
    [isDismissed],
  );

  // 初次加载：拉取最新一条公告
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res: any = await api.get('/announcements');
        if (cancelled) return;
        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          // 取最新一条未关闭的公告
          const latest = res.data.find(
            (a: Announcement) => !isDismissed(a),
          );
          if (latest) showAnnouncement(latest);
        }
      } catch {
        // 静默失败
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isDismissed, showAnnouncement]);

  // 实时接收新公告
  useRealtime(
    'announcement',
    useCallback(
      (data: any) => {
        showAnnouncement(data as Announcement);
      },
      [showAnnouncement],
    ),
  );

  /** 关闭公告 */
  const handleDismiss = useCallback(() => {
    if (!announcement) return;
    // 先触发退出动画
    setVisible(false);
    if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    enterTimerRef.current = setTimeout(() => {
      setAnnouncement(null);
    }, 250);
    // 本地记忆已关闭
    if (typeof window !== 'undefined') {
      localStorage.setItem(DISMISS_KEY + announcement.id, '1');
    }
  }, [announcement]);

  if (!announcement) return null;

  const isUrgent = announcement.type === 'urgent';

  // 样式：urgent 红色，normal 蓝色
  const bannerClass = isUrgent
    ? 'bg-gradient-to-r from-red-600 to-rose-600'
    : 'bg-gradient-to-r from-blue-600 to-indigo-600';

  return (
    <div
      className={`${bannerClass} text-white transition-all duration-300 ease-out overflow-hidden ${
        visible ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 py-2">
          {/* 图标 */}
          <span className="flex-shrink-0">
            {isUrgent ? (
              <svg
                className="w-5 h-5 animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            ) : (
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
                  d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                />
              </svg>
            )}
          </span>

          {/* 标签 */}
          <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/20 uppercase tracking-wider">
            {isUrgent ? '紧急' : '公告'}
          </span>

          {/* 内容 */}
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => setExpanded((v) => !v)}
          >
            <span className="text-sm font-medium">
              {announcement.title}
            </span>
            {announcement.content && (
              <span
                className={`ml-2 text-xs text-white/80 ${
                  expanded ? '' : 'truncate inline-block max-w-[60vw] align-bottom'
                }`}
              >
                {announcement.content}
              </span>
            )}
          </div>

          {/* 展开/收起指示 */}
          {announcement.content && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex-shrink-0 p-1 rounded hover:bg-white/20 transition-colors"
              aria-label={expanded ? '收起' : '展开'}
            >
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${
                  expanded ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          )}

          {/* 关闭按钮 */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded hover:bg-white/20 transition-colors"
            aria-label="关闭公告"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
