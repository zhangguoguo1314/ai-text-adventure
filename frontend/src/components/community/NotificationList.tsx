'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface Notification {
  id: number;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationListProps {
  onCount?: (count: number) => void;
}

export default function NotificationList({ onCount }: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/notifications');
      if (res.success) {
        setNotifications(res.data.list);
        onCount?.(res.data.unreadCount || 0);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      onCount?.(0);
    } catch {
      // ignore
    }
  };

  const timeAgo = (dateStr: string) => {
    const now = Date.now();
    const date = new Date(dateStr).getTime();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    return `${Math.floor(hours / 24)}天前`;
  };

  return (
    <div>
      {notifications.length > 0 && notifications.some((n) => !n.isRead) && (
        <button
          onClick={markAllRead}
          className="text-xs text-violet-600 hover:text-violet-700 mb-3"
        >
          全部已读
        </button>
      )}
      <div className="space-y-2">
        {notifications.length === 0 && !loading && (
          <p className="text-center py-8 text-gray-400">暂无通知</p>
        )}
        {loading && <p className="text-center py-4 text-gray-400 text-sm">加载中...</p>}
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`p-3 rounded-lg border ${
              n.isRead ? 'border-gray-100 bg-gray-50' : 'border-violet-200 bg-violet-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${n.isRead ? 'text-gray-500' : 'text-violet-700'}`}>
                {n.title}
              </span>
              <span className="text-xs text-gray-400 ml-auto">{timeAgo(n.createdAt)}</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">{n.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
