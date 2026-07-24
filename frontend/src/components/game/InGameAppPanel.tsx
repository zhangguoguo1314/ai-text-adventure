'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '@/lib/api';

/* ============================================================
 * 内置游戏 APP 面板组件
 * 对标 UU 平台剧本内的自定义软件功能（如校园助手、直播小助手等）
 * 以底部工具栏形式展示 APP 图标，点击打开功能面板（底部抽屉）
 * 根据 appType 渲染不同内容，APP 数据存储在 config JSON 中
 * 暗色主题，移动端友好
 * ============================================================ */

// ===== 类型定义 =====
type AppType = 'utility' | 'social' | 'shop' | 'ranking' | 'quest' | 'custom';

interface InGameApp {
  id: number;
  scriptId: number;
  name: string;
  appType: AppType;
  icon: string; // emoji 或图片 URL
  description: string;
  config: string; // JSON 字符串，存储 APP 数据
  sortOrder: number;
  isActive: boolean;
}

interface InGameAppPanelProps {
  scriptId: number;
  sessionId: string;
}

// ===== 各 appType 对应的图标与配色 =====
const APP_TYPE_META: Record<AppType, { emoji: string; ring: string; chip: string }> = {
  utility: { emoji: '🛠️', ring: 'hover:ring-cyan-400/60', chip: 'bg-cyan-900/50 text-cyan-300 border-cyan-700/50' },
  social: { emoji: '💬', ring: 'hover:ring-pink-400/60', chip: 'bg-pink-900/50 text-pink-300 border-pink-700/50' },
  shop: { emoji: '🛒', ring: 'hover:ring-amber-400/60', chip: 'bg-amber-900/50 text-amber-300 border-amber-700/50' },
  ranking: { emoji: '🏆', ring: 'hover:ring-yellow-400/60', chip: 'bg-yellow-900/50 text-yellow-300 border-yellow-700/50' },
  quest: { emoji: '📜', ring: 'hover:ring-emerald-400/60', chip: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50' },
  custom: { emoji: '✨', ring: 'hover:ring-violet-400/60', chip: 'bg-violet-900/50 text-violet-300 border-violet-700/50' },
};

const APP_TYPE_LABEL: Record<AppType, string> = {
  utility: '工具',
  social: '社交',
  shop: '商店',
  ranking: '排行',
  quest: '任务',
  custom: '自定义',
};

// ===== 安全解析 config JSON =====
function parseConfig<T = unknown>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// ===== 工具函数 =====
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

function Avatar({ name, avatar, size = 'md' }: { name: string; avatar?: string | null; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-9 h-9 text-sm';
  if (avatar) {
    return <img src={avatar} alt="" className={`${dim} rounded-full object-cover shrink-0`} />;
  }
  return (
    <div className={`${dim} rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-200 shrink-0`}>
      {(name || 'U')[0]}
    </div>
  );
}

/* ============================================================
 * 主组件
 * ============================================================ */
export default function InGameAppPanel({ scriptId, sessionId }: InGameAppPanelProps) {
  const [apps, setApps] = useState<InGameApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAppId, setActiveAppId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await api.get(`/scripts/${scriptId}/in-game-apps/active`);
      if (res.success) {
        const list: InGameApp[] = res.data?.apps || res.data?.list || res.data || [];
        setApps(list);
      } else {
        setApps([]);
      }
    } catch {
      setError('内置应用加载失败');
      setApps([]);
    } finally {
      setLoading(false);
    }
  }, [scriptId]);

  useEffect(() => {
    if (scriptId) fetchApps();
  }, [scriptId, fetchApps]);

  const activeApp = useMemo(
    () => apps.find((a) => a.id === activeAppId) || null,
    [apps, activeAppId],
  );

  const closePanel = useCallback(() => setActiveAppId(null), []);

  // 阻止背景滚动
  useEffect(() => {
    if (activeAppId !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeAppId]);

  // ESC 关闭
  useEffect(() => {
    if (activeAppId === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeAppId, closePanel]);

  if (loading && apps.length === 0) {
    return (
      <div className="flex items-center justify-center py-4 text-slate-500 text-xs">
        <span className="animate-pulse">应用加载中...</span>
      </div>
    );
  }

  // 没有任何应用时，静默不渲染工具栏
  if (!loading && apps.length === 0 && !error) return null;

  return (
    <>
      {/* 底部工具栏 */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-md">
        <div className="flex items-center gap-1.5 overflow-x-auto px-3 py-2 rounded-2xl
                        bg-slate-900/95 backdrop-blur-md border border-slate-700/60 shadow-2xl
                        no-scrollbar">
          {/* 应用入口 */}
          {apps.map((app) => {
            const meta = APP_TYPE_META[app.appType] || APP_TYPE_META.custom;
            const isActive = activeAppId === app.id;
            return (
              <button
                key={app.id}
                onClick={() => setActiveAppId(app.id)}
                title={app.name}
                className={`group relative flex flex-col items-center justify-center gap-0.5 shrink-0
                            w-14 h-14 rounded-xl border transition-all
                            ${isActive
                              ? 'bg-slate-700/80 border-violet-500/60 ring-2 ring-violet-500/40'
                              : 'bg-slate-800/60 border-slate-700/40 hover:bg-slate-700/60 ' + meta.ring}
                            ${meta.ring}`}
              >
                <span className="text-xl leading-none">
                  {app.icon ? (
                    /^https?:\/\//.test(app.icon)
                      ? <img src={app.icon} alt="" className="w-6 h-6 object-contain" />
                      : app.icon
                  ) : meta.emoji}
                </span>
                <span className="text-[9px] text-slate-400 group-hover:text-slate-200 truncate max-w-[3.2rem] leading-tight">
                  {app.name}
                </span>
              </button>
            );
          })}

          {/* 刷新 / 错误提示 */}
          {error && (
            <button
              onClick={fetchApps}
              className="shrink-0 px-2 h-14 rounded-xl bg-slate-800/60 border border-red-800/50 text-red-400 text-[10px] hover:bg-slate-700/60"
            >
              重试
            </button>
          )}
        </div>
      </div>

      {/* 功能面板（底部抽屉） */}
      {activeApp && (
        <AppDrawer app={activeApp} sessionId={sessionId} onClose={closePanel} />
      )}
    </>
  );
}

/* ============================================================
 * 底部抽屉容器
 * ============================================================ */
function AppDrawer({ app, sessionId, onClose }: { app: InGameApp; sessionId: string; onClose: () => void }) {
  const meta = APP_TYPE_META[app.appType] || APP_TYPE_META.custom;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      {/* 抽屉主体 */}
      <div className="relative w-full sm:max-w-lg max-h-[85vh] flex flex-col
                      bg-slate-900 sm:rounded-2xl rounded-t-2xl border-t sm:border border-slate-700/60
                      shadow-2xl animate-slide-in-right
                      sm:m-4">
        {/* 顶部抓手（移动端） */}
        <div className="sm:hidden flex justify-center pt-2">
          <span className="w-10 h-1 rounded-full bg-slate-700" />
        </div>

        {/* 头部 */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/50">
          <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700/50 text-xl">
            {app.icon && /^https?:\/\//.test(app.icon)
              ? <img src={app.icon} alt="" className="w-6 h-6 object-contain" />
              : app.icon || meta.emoji}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white truncate">{app.name}</h3>
              <span className={`px-1.5 py-0.5 rounded text-[10px] border ${meta.chip}`}>
                {APP_TYPE_LABEL[app.appType]}
              </span>
            </div>
            {app.description && (
              <p className="text-xs text-slate-400 truncate">{app.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="关闭"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-4">
          <AppContent app={app} sessionId={sessionId} />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * 根据 appType 分发渲染
 * ============================================================ */
function AppContent({ app, sessionId }: { app: InGameApp; sessionId: string }) {
  switch (app.appType) {
    case 'utility':
      return <UtilityContent app={app} sessionId={sessionId} />;
    case 'social':
      return <SocialContent app={app} sessionId={sessionId} />;
    case 'shop':
      return <ShopContent app={app} sessionId={sessionId} />;
    case 'ranking':
      return <RankingContent app={app} />;
    case 'quest':
      return <QuestContent app={app} sessionId={sessionId} />;
    case 'custom':
    default:
      return <CustomContent app={app} />;
  }
}

/* -------------------- utility：工具（排行榜/考试安排等） -------------------- */
interface UtilityConfig {
  title?: string;
  category?: 'ranking' | 'schedule' | 'info' | string;
  entries?: Array<{ name: string; value: string | number; unit?: string; max?: number }>;
  schedule?: Array<{ time: string; event: string; location?: string; note?: string }>;
  notices?: Array<{ title: string; content: string; level?: 'info' | 'warn' | 'danger' }>;
}

function UtilityContent({ app }: { app: InGameApp; sessionId: string }) {
  const config = parseConfig<UtilityConfig>(app.config, {});
  const category = config.category || (config.schedule ? 'schedule' : config.notices ? 'info' : 'ranking');

  return (
    <div className="space-y-4">
      {config.title && <h4 className="text-sm font-semibold text-slate-200">{config.title}</h4>}

      {/* 属性排行榜 */}
      {category === 'ranking' && (
        <div className="space-y-2">
          {(config.entries || []).length === 0 && <EmptyHint text="暂无排行数据" />}
          {(config.entries || []).map((entry, i) => {
            const max = typeof entry.max === 'number' ? entry.max : 100;
            const pct = Math.min(100, Math.max(0, (Number(entry.value) / max) * 100));
            return (
              <div key={i} className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/40">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-200 font-medium">{entry.name}</span>
                  <span className="text-slate-400">
                    {entry.value}{entry.unit ? ` ${entry.unit}` : ''}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 考试/日程安排 */}
      {category === 'schedule' && (
        <div className="space-y-2">
          {(config.schedule || []).length === 0 && <EmptyHint text="暂无日程安排" />}
          {(config.schedule || []).map((s, i) => (
            <div key={i} className="flex gap-3 p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/40">
              <div className="shrink-0 w-16 text-center">
                <span className="block text-xs text-cyan-300 font-mono">{s.time}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200">{s.event}</p>
                {s.location && <p className="text-xs text-slate-500 mt-0.5">📍 {s.location}</p>}
                {s.note && <p className="text-xs text-slate-500 mt-0.5">{s.note}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 信息公告 */}
      {category === 'info' && (
        <div className="space-y-2">
          {(config.notices || []).length === 0 && <EmptyHint text="暂无公告" />}
          {(config.notices || []).map((n, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg border ${
                n.level === 'danger'
                  ? 'bg-red-900/30 border-red-700/50'
                  : n.level === 'warn'
                  ? 'bg-amber-900/30 border-amber-700/50'
                  : 'bg-slate-800/40 border-slate-700/40'
              }`}
            >
              <p className="text-sm font-medium text-slate-100">{n.title}</p>
              <p className="text-xs text-slate-400 mt-1 whitespace-pre-wrap">{n.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------- social：社交（表白墙/私信等） -------------------- */
interface SocialPost {
  id: number | string;
  author: string;
  avatar?: string | null;
  content: string;
  likes?: number;
  liked?: boolean;
  createdAt?: string;
  anonymous?: boolean;
}
interface SocialConfig {
  title?: string;
  category?: 'confession_wall' | 'messages' | 'forum' | string;
  posts?: SocialPost[];
  messages?: Array<{ id: number; from: string; avatar?: string | null; content: string; time: string }>;
}

function SocialContent({ app, sessionId }: { app: InGameApp; sessionId: string }) {
  const config = parseConfig<SocialConfig>(app.config, {});
  const category = config.category || 'confession_wall';
  const [posts, setPosts] = useState<SocialPost[]>(config.posts || []);
  const [draft, setDraft] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [sending, setSending] = useState(false);

  const handlePublish = async () => {
    if (!draft.trim()) return;
    setSending(true);
    const newPost: SocialPost = {
      id: Date.now(),
      author: anonymous ? '匿名' : '我',
      content: draft.trim(),
      likes: 0,
      liked: false,
      createdAt: new Date().toISOString(),
      anonymous,
    };
    // 乐观更新；如后端支持则同步
    try {
      const res: any = await api.post(`/scripts/${app.scriptId}/in-game-apps/${app.id}/action`, {
        sessionId,
        action: 'publish',
        payload: { content: newPost.content, anonymous: newPost.anonymous },
      });
      if (res.success && res.data?.post) {
        setPosts((prev) => [{ ...res.data.post }, ...prev]);
      } else {
        setPosts((prev) => [newPost, ...prev]);
      }
    } catch {
      setPosts((prev) => [newPost, ...prev]);
    } finally {
      setDraft('');
      setSending(false);
    }
  };

  const toggleLike = (id: number | string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, liked: !p.liked, likes: (p.likes || 0) + (p.liked ? -1 : 1) } : p,
      ),
    );
  };

  // 私信列表
  if (category === 'messages') {
    const messages = config.messages || [];
    return (
      <div className="space-y-2">
        {messages.length === 0 && <EmptyHint text="暂无私信" />}
        {messages.map((m) => (
          <div key={m.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/40">
            <Avatar name={m.from} avatar={m.avatar} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-200">{m.from}</span>
                <span className="text-[10px] text-slate-500">{timeAgo(m.time)}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{m.content}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 表白墙 / 论坛
  return (
    <div className="space-y-3">
      {/* 发布框 */}
      <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={category === 'confession_wall' ? '写下你的表白...' : '说点什么...'}
          rows={2}
          maxLength={200}
          className="w-full resize-none bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
        />
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/50">
          <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="w-3.5 h-3.5 accent-violet-500"
            />
            匿名
          </label>
          <button
            onClick={handlePublish}
            disabled={sending || !draft.trim()}
            className="px-3 py-1 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-500 disabled:opacity-40 transition-colors"
          >
            {sending ? '发布中...' : '发布'}
          </button>
        </div>
      </div>

      {/* 列表 */}
      <div className="space-y-2">
        {posts.length === 0 && <EmptyHint text={category === 'confession_wall' ? '还没有人表白，来做第一个吧' : '暂无动态'} />}
        {posts.map((p) => (
          <div key={p.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <div className="flex items-center gap-2 mb-1.5">
              <Avatar name={p.author} avatar={p.avatar} size="sm" />
              <span className="text-xs font-medium text-slate-200">{p.author}</span>
              {p.createdAt && <span className="text-[10px] text-slate-500 ml-auto">{timeAgo(p.createdAt)}</span>}
            </div>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{p.content}</p>
            <button
              onClick={() => toggleLike(p.id)}
              className={`mt-2 flex items-center gap-1 text-xs transition-colors ${
                p.liked ? 'text-pink-400' : 'text-slate-500 hover:text-pink-400'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill={p.liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {p.likes || 0}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------- shop：商店 -------------------- */
interface ShopItem {
  id: number | string;
  name: string;
  price: number;
  icon?: string;
  description?: string;
  stock?: number;
}
interface ShopConfig {
  title?: string;
  currency?: string;
  balance?: number;
  items?: ShopItem[];
}

function ShopContent({ app, sessionId }: { app: InGameApp; sessionId: string }) {
  const config = parseConfig<ShopConfig>(app.config, {});
  const currency = config.currency || '金币';
  const [balance, setBalance] = useState<number>(config.balance ?? 0);
  const [purchased, setPurchased] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<string | null>(null);

  const items = config.items || [];

  const handleBuy = async (item: ShopItem) => {
    if (balance < item.price) {
      setToast(`${currency}不足`);
      setTimeout(() => setToast(null), 1500);
      return;
    }
    // 乐观扣款
    setBalance((b) => b - item.price);
    setPurchased((prev) => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
    setToast(`已购买「${item.name}」`);
    setTimeout(() => setToast(null), 1500);
    try {
      await api.post(`/scripts/${app.scriptId}/in-game-apps/${app.id}/action`, {
        sessionId,
        action: 'buy',
        payload: { itemId: item.id, price: item.price },
      });
    } catch {
      // 忽略后端错误，保留乐观结果
    }
  };

  return (
    <div className="space-y-3">
      {/* 余额 */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-900/40 to-slate-800/40 border border-amber-700/40">
        <span className="text-xs text-slate-400">我的{currency}</span>
        <span className="text-lg font-bold text-amber-300">{balance.toLocaleString()}</span>
      </div>

      {items.length === 0 && <EmptyHint text="商店暂未上架商品" />}

      <div className="grid grid-cols-2 gap-2.5">
        {items.map((item) => {
          const count = purchased[item.id] || 0;
          const soldOut = typeof item.stock === 'number' && item.stock <= 0;
          return (
            <div key={item.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 flex flex-col">
              <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center rounded-lg bg-slate-800 border border-slate-700/50 text-2xl">
                {item.icon || '🎁'}
              </div>
              <p className="text-sm text-slate-200 text-center truncate">{item.name}</p>
              {item.description && (
                <p className="text-[10px] text-slate-500 text-center mt-0.5 line-clamp-2">{item.description}</p>
              )}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/40">
                <span className="text-xs font-bold text-amber-300">{item.price} {currency}</span>
                {count > 0 && <span className="text-[10px] text-emerald-400">x{count}</span>}
              </div>
              <button
                onClick={() => handleBuy(item)}
                disabled={soldOut}
                className="mt-2 w-full py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40
                           bg-amber-600/80 text-white hover:bg-amber-500"
              >
                {soldOut ? '已售罄' : '购买'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-lg bg-slate-700 text-slate-100 text-xs shadow-xl animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}

/* -------------------- ranking：排行信息 -------------------- */
interface RankingConfig {
  title?: string;
  unit?: string;
  entries?: Array<{ rank?: number; name: string; score: number; avatar?: string | null; tag?: string }>;
}

function RankingContent({ app }: { app: InGameApp }) {
  const config = parseConfig<RankingConfig>(app.config, {});
  const entries = (config.entries || []).slice().sort((a, b) => b.score - a.score);
  const unit = config.unit || '';
  const podium = ['🥇', '🥈', '🥉'];
  const topColors = ['text-yellow-300', 'text-slate-300', 'text-amber-600'];

  return (
    <div className="space-y-2">
      {config.title && <h4 className="text-sm font-semibold text-slate-200 mb-2">{config.title}</h4>}
      {entries.length === 0 && <EmptyHint text="暂无排行数据" />}
      {entries.map((entry, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors
            ${i < 3 ? 'bg-slate-800/70 border-slate-600/50' : 'bg-slate-800/30 border-slate-700/30'}`}
        >
          <span className={`w-7 text-center text-lg font-bold ${i < 3 ? topColors[i] : 'text-slate-500'}`}>
            {i < 3 ? podium[i] : i + 1}
          </span>
          <Avatar name={entry.name} avatar={entry.avatar} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-200 truncate">{entry.name}</p>
            {entry.tag && <span className="text-[10px] text-slate-500">{entry.tag}</span>}
          </div>
          <span className="text-sm font-bold text-slate-100">
            {entry.score.toLocaleString()}
            {unit && <span className="text-[10px] text-slate-500 ml-0.5">{unit}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

/* -------------------- quest：任务列表 -------------------- */
interface QuestItem {
  id: number | string;
  title: string;
  description?: string;
  status?: 'active' | 'completed' | 'locked' | string;
  reward?: string;
  progress?: number;
  progressMax?: number;
}
interface QuestConfig {
  title?: string;
  quests?: QuestItem[];
}

function QuestContent({ app, sessionId }: { app: InGameApp; sessionId: string }) {
  const config = parseConfig<QuestConfig>(app.config, {});
  const [quests, setQuests] = useState<QuestItem[]>(config.quests || []);

  const toggleComplete = async (q: QuestItem) => {
    if (q.status === 'locked') return;
    const next = q.status === 'completed' ? 'active' : 'completed';
    setQuests((prev) => prev.map((x) => (x.id === q.id ? { ...x, status: next } : x)));
    try {
      await api.post(`/scripts/${app.scriptId}/in-game-apps/${app.id}/action`, {
        sessionId,
        action: 'quest',
        payload: { questId: q.id, status: next },
      });
    } catch {
      // 忽略
    }
  };

  return (
    <div className="space-y-2.5">
      {config.title && <h4 className="text-sm font-semibold text-slate-200 mb-1">{config.title}</h4>}
      {quests.length === 0 && <EmptyHint text="暂无任务" />}
      {quests.map((q) => {
        const status = q.status || 'active';
        const isDone = status === 'completed';
        const isLocked = status === 'locked';
        const pct = q.progressMax ? Math.min(100, ((q.progress || 0) / q.progressMax) * 100) : 0;
        return (
          <div
            key={q.id}
            className={`p-3 rounded-xl border transition-colors ${
              isDone
                ? 'bg-emerald-900/20 border-emerald-700/40'
                : isLocked
                ? 'bg-slate-800/20 border-slate-700/30 opacity-60'
                : 'bg-slate-800/40 border-slate-700/40'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <button
                onClick={() => toggleComplete(q)}
                disabled={isLocked}
                aria-label="切换完成状态"
                className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                  isDone
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : isLocked
                    ? 'bg-slate-700 border-slate-600'
                    : 'border-slate-500 hover:border-emerald-400'
                }`}
              >
                {isDone && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {isLocked && <span className="text-[10px]">🔒</span>}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isDone ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
                  {q.title}
                </p>
                {q.description && <p className="text-xs text-slate-500 mt-0.5">{q.description}</p>}
                {q.progressMax && (
                  <div className="mt-1.5">
                    <div className="h-1 rounded-full bg-slate-700/60 overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-500">{q.progress || 0}/{q.progressMax}</span>
                  </div>
                )}
                {q.reward && (
                  <span className="inline-block mt-1.5 px-1.5 py-0.5 rounded text-[10px] bg-amber-900/40 text-amber-300 border border-amber-700/40">
                    🎁 {q.reward}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------- custom：自定义内容 -------------------- */
interface CustomConfig {
  title?: string;
  html?: string;
  content?: string;
  sections?: Array<{ heading: string; body: string }>;
  list?: Array<string>;
}

function CustomContent({ app }: { app: InGameApp }) {
  const config = parseConfig<CustomConfig>(app.config, {});

  return (
    <div className="space-y-4">
      {config.title && <h4 className="text-sm font-semibold text-slate-200">{config.title}</h4>}

      {/* 自定义段落 */}
      {config.content && (
        <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
          <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{config.content}</p>
        </div>
      )}

      {/* 分节内容 */}
      {config.sections?.map((s, i) => (
        <div key={i} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
          <p className="text-sm font-semibold text-violet-300 mb-1">{s.heading}</p>
          <p className="text-sm text-slate-400 whitespace-pre-wrap">{s.body}</p>
        </div>
      ))}

      {/* 列表 */}
      {config.list && config.list.length > 0 && (
        <ul className="space-y-1.5">
          {config.list.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
              <span className="text-violet-400 mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}

      {/* 富文本（受限渲染，仅展示纯文本以避免 XSS） */}
      {config.html && !config.content && (
        <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-sm text-slate-400">
          {config.html.replace(/<[^>]+>/g, ' ')}
        </div>
      )}

      {!config.content && !config.sections && !config.list && !config.html && (
        <EmptyHint text="该应用暂无内容" />
      )}
    </div>
  );
}

/* -------------------- 通用空状态 -------------------- */
function EmptyHint({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-slate-500">
      <span className="text-3xl mb-2 opacity-60">📭</span>
      <p className="text-xs">{text}</p>
    </div>
  );
}
