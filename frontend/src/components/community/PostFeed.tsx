'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import PostCard from './PostCard';

interface Post {
  id: number;
  content: string;
  images: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  liked: boolean;
  user: {
    id: number;
    nickname: string;
    avatar: string | null;
    level: number;
  };
}

interface PostFeedProps {
  sort: 'latest' | 'hot' | 'following';
  refreshKey?: number;
}

export default function PostFeed({ sort, refreshKey }: PostFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchPosts = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res: any = await api.get('/posts', { params: { sort, page: p, pageSize: 20 } });
      if (res.success) {
        if (p === 1) {
          setPosts(res.data.list);
        } else {
          setPosts((prev) => [...prev, ...res.data.list]);
        }
        setTotalPages(res.data.totalPages || 1);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, [sort]);

  useEffect(() => {
    setPage(1);
    fetchPosts(1);
  }, [sort, refreshKey, fetchPosts]);

  const handleLike = async (id: number) => {
    try {
      const res: any = await api.post(`/posts/${id}/like`);
      if (res.success) {
        setPosts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, liked: res.data.liked, likeCount: p.likeCount + (res.data.liked ? 1 : -1) } : p)),
        );
      }
    } catch {
      // ignore
    }
  };

  const handleComment = (id: number) => {
    // Navigate to comment or open comment panel
    const content = prompt('请输入评论内容:');
    if (content) {
      api.post(`/posts/${id}/comment`, { content }).then((res: any) => {
        if (res.success) {
          setPosts((prev) =>
            prev.map((p) => (p.id === id ? { ...p, commentCount: p.commentCount + 1 } : p)),
          );
        }
      });
    }
  };

  return (
    <div className="space-y-4">
      {posts.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-400">
          {sort === 'following' ? '还没有关注任何人，去关注一些创作者吧' : '暂无动态'}
        </div>
      )}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onLike={handleLike} onComment={handleComment} />
      ))}
      {loading && (
        <div className="text-center py-4 text-gray-400 text-sm">加载中...</div>
      )}
      {page < totalPages && !loading && (
        <button
          onClick={() => { setPage(page + 1); fetchPosts(page + 1); }}
          className="w-full py-3 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
        >
          加载更多
        </button>
      )}
    </div>
  );
}
