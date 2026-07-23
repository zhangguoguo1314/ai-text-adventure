'use client';

import { useState } from 'react';

interface PostUser {
  id: number;
  nickname: string;
  avatar: string | null;
  level: number;
}

interface PostCardProps {
  post: {
    id: number;
    content: string;
    images: string;
    likeCount: number;
    commentCount: number;
    createdAt: string;
    liked: boolean;
    user: PostUser;
  };
  onLike?: (id: number) => void;
  onComment?: (id: number) => void;
}

export default function PostCard({ post, onLike, onComment }: PostCardProps) {
  const images: string[] = (() => {
    try {
      return JSON.parse(post.images || '[]');
    } catch {
      return [];
    }
  })();

  const timeAgo = (dateStr: string) => {
    const now = Date.now();
    const date = new Date(dateStr).getTime();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}天前`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-violet-200 flex items-center justify-center text-sm font-bold text-violet-700 shrink-0">
          {post.user?.nickname?.[0] || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">{post.user?.nickname || '匿名'}</span>
            <span className="text-xs text-gray-400">Lv.{post.user?.level || 1}</span>
            <span className="text-xs text-gray-400 ml-auto">{timeAgo(post.createdAt)}</span>
          </div>
          <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{post.content}</p>

          {/* Images Grid */}
          {images.length > 0 && (
            <div className={`grid gap-2 mt-3 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt=""
                  className="rounded-lg max-h-48 w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 mt-3 pt-2 border-t border-gray-50">
            <button
              onClick={() => onLike?.(post.id)}
              className={`flex items-center gap-1 text-xs transition-colors ${
                post.liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
              }`}
            >
              <svg className="w-4 h-4" fill={post.liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {post.likeCount > 0 && post.likeCount}
            </button>
            <button
              onClick={() => onComment?.(post.id)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-violet-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {post.commentCount > 0 && post.commentCount}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
