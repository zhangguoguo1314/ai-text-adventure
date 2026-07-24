'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

/* ============================================================
 * 社区广场页面（增强版）
 * 对标 UU 平台的社区广场功能
 * 暗色主题
 * 功能：动态信息流 / 发布动态 / 点赞 / 评论 / 关注 / 话题筛选 / 排序
 * API：GET /api/community/posts, POST /api/community/posts
 * ============================================================ */

// ===== 类型定义 =====
interface PostUser {
  id: number;
  nickname: string;
  avatar: string | null;
  level: number;
  bio?: string | null;
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  user: PostUser;
}

interface Post {
  id: number;
  content: string;
  images: string; // JSON 字符串
  likeCount: number;
  commentCount: number;
  createdAt: string;
  liked: boolean;
  followed?: boolean;
  tags?: string[]; // 话题标签（可能来自字段或从内容提取）
  user: PostUser;
}

type SortType = 'latest' | 'hot' | 'following';

const SORT_LABELS: Record<SortType, string> = {
  latest: '最新',
  hot: '最热',
  following: '关注',
};

// ===== 工具函数 =====
function parseImages(raw: string): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function extractTags(content: string): string[] {
  const set = new Set<string>();
  const re = /#([^\s#<>]{1,20})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    set.add(m[1]);
  }
 return Array.from(set);
}

function getTags(post: Post): string[] {
  if (Array.isArray(post.tags) && post.tags.length) return post.tags;
  return extractTags(post.content);
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  if (Number.isNaN(date)) return '';
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return new Date(dateStr).toLocaleDateString();
}

// 渲染内容时高亮 #话题
function renderContent(content: string, onTagClick?: (tag: string) => void) {
  if (!content) return null;
  const parts = content.split(/(#[^\s#<>]{1,20})/g);
  return parts.map((part, i) => {
    if (/^#[^\s#<>]{1,20}$/.test(part)) {
      const tag = part.slice(1);
      return (
        <button
          key={i}
          onClick={(e) => {
            e.stopPropagation();
            onTagClick?.(tag);
          }}
          className="text-violet-400 hover:text-violet-300 hover:underline"
        >
          {part}
        </button>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

// ===== 头像 =====
function Avatar({ user, size = 'md' }: { user: PostUser; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-10 h-10 text-sm';
  if (user?.avatar) {
    return <img src={user.avatar} alt="" className={`${dim} rounded-full object-cover shrink-0`} />;
  }
  return (
    <div className={`${dim} rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center font-bold text-white shrink-0`}>
      {user?.nickname?.[0] || 'U'}
    </div>
  );
}

/* ============================================================
 * 页面主体
 * ============================================================ */
export default function PlazaPage() {
  const { isAuthenticated } = useAuthStore();

  const [sort, setSort] = useState<SortType>('latest');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // 收集所有话题标签（去重）
  const allTags = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => getTags(p).forEach((t) => set.add(t)));
    return Array.from(set);
  }, [posts]);

  // 客户端按话题过滤
  const visiblePosts = useMemo(() => {
    if (!activeTag) return posts;
    return posts.filter((p) => getTags(p).includes(activeTag));
  }, [posts, activeTag]);

  const fetchPosts = useCallback(async (p: number, replace: boolean) => {
    setLoading(true);
    try {
      const res: any = await api.get('/community/posts', {
        params: { sort, page: p, pageSize: 20 },
      });
      if (res.success) {
        const list: Post[] = res.data?.list || res.data?.posts || [];
        setPosts((prev) => (replace ? list : [...prev, ...list]));
        setTotalPages(res.data?.totalPages || 1);
      }
    } catch {
      // 忽略
    } finally {
      setLoading(false);
    }
  }, [sort]);

  // 排序/刷新变化时重新加载第一页
  useEffect(() => {
    fetchPosts(1, true);
  }, [sort, refreshKey, fetchPosts]);

  const changeSort = (s: SortType) => {
    setSort(s);
    setPage(1);
  };

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    setPage(1);
  };

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPosts(next, false);
  };

  // 点赞
  const handleLike = async (id: number) => {
    // 乐观更新
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, liked: !p.liked, likeCount: p.likeCount + (p.liked ? -1 : 1) } : p,
      ),
    );
    try {
      const res: any = await api.post(`/community/posts/${id}/like`);
      if (res.success && res.data) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, liked: !!res.data.liked, likeCount: res.data.likeCount ?? p.likeCount } : p,
          ),
        );
      }
    } catch {
      // 回滚由下次刷新保证
    }
  };

  // 关注 / 取关
  const handleFollow = async (userId: number) => {
    setPosts((prev) =>
      prev.map((p) => (p.user.id === userId ? { ...p, followed: !p.followed } : p)),
    );
    try {
      await api.post(`/community/users/${userId}/follow`);
    } catch {
      // 忽略
    }
  };

  // 发布动态成功
  const handleCreated = () => {
    setSort('latest');
    setPage(1);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="max-w-2xl mx-auto pb-10">
      {/* 页头 */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-white">社区广场</h1>
          <p className="text-xs text-slate-400 mt-0.5">分享你的剧本体验，发现更多精彩</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
          title="刷新"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* 排序 */}
      <div className="flex items-center gap-4 mb-4 px-1">
        {(Object.keys(SORT_LABELS) as SortType[]).map((s) => (
          <button
            key={s}
            onClick={() => changeSort(s)}
            className={`text-sm pb-1.5 border-b-2 transition-colors ${
              sort === s
                ? 'border-violet-500 text-violet-300 font-medium'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {SORT_LABELS[s]}
          </button>
        ))}
      </div>

      {/* 发布动态 */}
      {isAuthenticated ? (
        <CreatePostBox onCreated={handleCreated} />
      ) : (
        <div className="mb-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
          <p className="text-sm text-slate-400">登录后即可发布动态、点赞与评论</p>
        </div>
      )}

      {/* 话题标签筛选 */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 no-scrollbar">
          <button
            onClick={() => setActiveTag(null)}
            className={`shrink-0 px-3 py-1 rounded-full text-xs transition-colors ${
              !activeTag
                ? 'bg-violet-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            全部
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs transition-colors ${
                activeTag === tag
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* 动态列表 */}
      <div className="space-y-3">
        {visiblePosts.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <span className="text-4xl mb-3 opacity-50">🌿</span>
            <p className="text-sm">
              {sort === 'following'
                ? '还没有关注任何人，去关注一些创作者吧'
                : activeTag
                ? `没有 #${activeTag} 相关的动态`
                : '暂无动态，快来发布第一条吧'}
            </p>
          </div>
        )}

        {visiblePosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            isAuthenticated={isAuthenticated}
            onLike={handleLike}
            onFollow={handleFollow}
            onTagClick={(tag) => setActiveTag(tag)}
          />
        ))}

        {loading && (
          <div className="text-center py-6 text-slate-500 text-sm">
            <span className="inline-block animate-pulse">加载中...</span>
          </div>
        )}

        {!loading && page < totalPages && (
          <button
            onClick={handleLoadMore}
            className="w-full py-3 rounded-xl border border-slate-700/60 text-slate-300 text-sm hover:bg-slate-800/60 transition-colors"
          >
            加载更多
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================================================
 * 发布动态组件
 * ============================================================ */
function CreatePostBox({ onCreated }: { onCreated: () => void }) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const tags = extractTags(content);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res: any = await api.post('/community/posts', {
        content: content.trim(),
        images,
      });
      if (res.success) {
        setContent('');
        setImages([]);
        setExpanded(false);
        onCreated();
      }
    } catch {
      // 忽略
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = () => {
    const url = window.prompt('请输入图片 URL:');
    if (url) setImages((prev) => [...prev, url.trim()]);
  };

  return (
    <div className="mb-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onFocus={() => setExpanded(true)}
        placeholder="分享你的剧本体验，使用 # 添加话题..."
        rows={expanded ? 3 : 1}
        maxLength={500}
        className="w-full resize-none bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-all"
      />

      {/* 预览标签 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {tags.map((t) => (
            <span key={t} className="px-2 py-0.5 rounded-full text-[11px] bg-violet-900/50 text-violet-300 border border-violet-700/40">
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* 图片预览 */}
      {images.length > 0 && (
        <div className="flex gap-2 flex-wrap mt-2">
          {images.map((img, i) => (
            <div key={i} className="relative w-20 h-20">
              <img src={img} alt="" className="w-full h-full object-cover rounded-lg" />
              <button
                onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-400"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 操作栏 */}
      {expanded && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
          <div className="flex items-center gap-3">
            <button
              onClick={handleAddImage}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-violet-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              图片
            </button>
            <span className="text-[11px] text-slate-600">用 # 添加话题</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-600">{content.length}/500</span>
            <button
              onClick={handleSubmit}
              disabled={loading || !content.trim()}
              className="px-4 py-1.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-40 transition-colors"
            >
              {loading ? '发布中...' : '发布'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
 * 帖子卡片
 * ============================================================ */
interface PostCardProps {
  post: Post;
  isAuthenticated: boolean;
  onLike: (id: number) => void;
  onFollow: (userId: number) => void;
  onTagClick: (tag: string) => void;
}

function PostCard({ post, isAuthenticated, onLike, onFollow, onTagClick }: PostCardProps) {
  const images = parseImages(post.images);
  const tags = getTags(post);
  const [showComments, setShowComments] = useState(false);

  return (
    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-slate-600/60 transition-colors">
      {/* 用户信息 */}
      <div className="flex items-center gap-3">
        <Avatar user={post.user} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-100 truncate">{post.user?.nickname || '匿名'}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-700 text-slate-400">Lv.{post.user?.level || 1}</span>
          </div>
          <span className="text-[11px] text-slate-500">{timeAgo(post.createdAt)}</span>
        </div>

        {/* 关注按钮 */}
        {isAuthenticated && (
          <button
            onClick={() => onFollow(post.user.id)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
              post.followed
                ? 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                : 'bg-violet-600/90 text-white hover:bg-violet-500'
            }`}
          >
            {post.followed ? '已关注' : '+ 关注'}
          </button>
        )}
      </div>

      {/* 内容 */}
      <p className="text-sm text-slate-300 mt-3 whitespace-pre-wrap break-words leading-relaxed">
        {renderContent(post.content, onTagClick)}
      </p>

      {/* 图片网格 */}
      {images.length > 0 && (
        <div className={`grid gap-2 mt-3 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt=""
              loading="lazy"
              className={`rounded-lg w-full object-cover ${
                images.length === 1 ? 'max-h-80' : 'h-40'
              }`}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ))}
        </div>
      )}

      {/* 话题标签 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => onTagClick(t)}
              className="px-2 py-0.5 rounded-full text-[11px] bg-slate-700/60 text-violet-300 hover:bg-slate-700 transition-colors"
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      {/* 操作栏 */}
      <div className="flex items-center gap-5 mt-3 pt-3 border-t border-slate-700/40">
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            post.liked ? 'text-rose-400' : 'text-slate-500 hover:text-rose-400'
          }`}
        >
          <svg className="w-4 h-4" fill={post.liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>{post.likeCount > 0 ? post.likeCount : '点赞'}</span>
        </button>

        <button
          onClick={() => setShowComments((v) => !v)}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            showComments ? 'text-violet-400' : 'text-slate-500 hover:text-violet-400'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{post.commentCount > 0 ? post.commentCount : '评论'}</span>
        </button>
      </div>

      {/* 评论列表 */}
      <CommentSection
        postId={post.id}
        visible={showComments}
        isAuthenticated={isAuthenticated}
        commentCount={post.commentCount}
      />
    </div>
  );
}

/* ============================================================
 * 评论列表（展开）
 * ============================================================ */
function CommentSection({
  postId,
  visible,
  isAuthenticated,
  commentCount,
}: {
  postId: number;
  visible: boolean;
  isAuthenticated: boolean;
  commentCount: number;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get(`/community/posts/${postId}/comments`);
      if (res.success) {
        setComments(res.data?.list || res.data?.comments || []);
      }
    } catch {
      // 忽略
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (visible && postId) fetchComments();
  }, [visible, postId, fetchComments]);

  const handleSubmit = async () => {
    if (!draft.trim()) return;
    setSubmitting(true);
    try {
      const res: any = await api.post(`/community/posts/${postId}/comment`, { content: draft.trim() });
      if (res.success) {
        const newComment: Comment = res.data?.comment || {
          id: Date.now(),
          content: draft.trim(),
          createdAt: new Date().toISOString(),
          user: { id: 0, nickname: '我', avatar: null, level: 1 },
        };
        setComments((prev) => [...prev, newComment]);
        setDraft('');
      }
    } catch {
      // 忽略
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="mt-3 pl-2 border-l-2 border-slate-700/50 space-y-3">
      {/* 评论输入 */}
      {isAuthenticated ? (
        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="写下你的评论..."
            className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900/60 text-sm text-slate-200 placeholder-slate-500 border border-slate-700/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || !draft.trim()}
            className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-500 disabled:opacity-40 transition-colors"
          >
            {submitting ? '...' : '发送'}
          </button>
        </div>
      ) : null}

      {/* 评论列表 */}
      {loading && <p className="text-xs text-slate-500">加载评论...</p>}
      {!loading && comments.length === 0 && commentCount === 0 && (
        <p className="text-xs text-slate-500">暂无评论，快来抢沙发</p>
      )}
      {comments.map((c) => (
        <div key={c.id} className="flex items-start gap-2">
          <Avatar user={c.user} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-200">{c.user?.nickname || '匿名'}</span>
              <span className="text-[10px] text-slate-600">{timeAgo(c.createdAt)}</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 break-words">{c.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
