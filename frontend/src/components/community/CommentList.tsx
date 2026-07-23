'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    nickname: string;
    avatar: string | null;
    level: number;
  };
}

interface CommentListProps {
  postId: number;
  visible: boolean;
}

export default function CommentList({ postId, visible }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && postId) {
      fetchComments();
    }
  }, [visible, postId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res: any = await api.get(`/posts/${postId}/comments`);
      if (res.success) {
        setComments(res.data.list);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  };

  if (!visible) return null;

  return (
    <div className="mt-3 pl-4 border-l-2 border-violet-200 space-y-2">
      {loading && <p className="text-xs text-gray-400">加载评论...</p>}
      {comments.length === 0 && !loading && (
        <p className="text-xs text-gray-400">暂无评论</p>
      )}
      {comments.map((c) => (
        <div key={c.id} className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
            {c.user?.nickname?.[0] || 'U'}
          </div>
          <div>
            <span className="text-xs font-medium text-gray-700">{c.user?.nickname || '匿名'}</span>
            <p className="text-xs text-gray-600">{c.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
