'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import api from '@/lib/api';
import PageTransition from '@/components/common/PageTransition';

interface MyCodeData {
  inviteCode: string;
  invitedBy: number | null;
  invitedCount: number;
  totalReward: number;
}

interface InvitedUser {
  id: number;
  code: string;
  inviterRewardGranted: boolean;
  inviteeRewardGranted: boolean;
  createdAt: string;
  invitee: {
    id: number;
    nickname: string;
    avatar: string | null;
    level: number;
    createdAt: string;
  };
}

interface RewardRule {
  level: number;
  title: string;
  inviterReward?: number;
  inviteeReward?: number;
  description: string;
}

interface LeaderboardUser {
  userId: number;
  nickname: string;
  avatar: string | null;
  level: number;
  invitedCount: number;
}

const rankMedal = (index: number) => {
  if (index === 0) return 'bg-amber-400 text-white';
  if (index === 1) return 'bg-slate-300 text-slate-800';
  if (index === 2) return 'bg-orange-400 text-white';
  return 'bg-[var(--bg3)] text-[var(--muted)]';
};

export default function InvitePage() {
  const { user, isAuthenticated } = useAuthStore();
  const { updateBalance } = useAppStore();

  const [myCode, setMyCode] = useState<MyCodeData | null>(null);
  const [invitations, setInvitations] = useState<InvitedUser[]>([]);
  const [invPage, setInvPage] = useState(1);
  const [invTotalPages, setInvTotalPages] = useState(1);
  const [rewards, setRewards] = useState<RewardRule[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);

  const [loading, setLoading] = useState(true);
  const [inviteLink, setInviteLink] = useState('');

  // 绑定邀请人
  const [bindCode, setBindCode] = useState('');
  const [binding, setBinding] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 复制提示
  const [copied, setCopied] = useState(false);

  const fetchMyCode = useCallback(async () => {
    try {
      const res: any = await api.get('/invite/my-code');
      if (res.success) {
        setMyCode(res.data);
        // 同步刷新侧边栏余额
        try {
          const bal: any = await api.get('/user/balance');
          if (bal.success && bal.data) {
            updateBalance(bal.data.permanentBalance, bal.data.tempBalance);
          }
        } catch {
          // 忽略余额刷新失败
        }
      }
    } catch {
      // 忽略
    }
  }, [updateBalance]);

  const fetchInvitations = useCallback(async (page: number) => {
    try {
      const res: any = await api.get('/invite/my-invitations', {
        params: { page, pageSize: 10 },
      });
      if (res.success) {
        setInvitations(res.data.list);
        setInvTotalPages(res.data.totalPages);
      }
    } catch {
      // 忽略
    }
  }, []);

  const fetchRewards = useCallback(async () => {
    try {
      const res: any = await api.get('/invite/rewards');
      if (res.success) {
        setRewards(res.data.rules);
      }
    } catch {
      // 忽略
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res: any = await api.get('/invite/leaderboard');
      if (res.success) {
        setLeaderboard(res.data.list);
      }
    } catch {
      // 忽略
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      await Promise.all([
        fetchMyCode(),
        fetchInvitations(1),
        fetchRewards(),
        fetchLeaderboard(),
      ]);
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // 构建邀请链接
  useEffect(() => {
    if (myCode?.inviteCode && typeof window !== 'undefined') {
      setInviteLink(`${window.location.origin}/register?invite=${myCode.inviteCode}`);
    }
  }, [myCode?.inviteCode]);

  const handleCopy = (text: string, label = '已复制') => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopied(true);
    setMessage({ type: 'success', text: label });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBind = async () => {
    const code = bindCode.trim();
    if (!code) {
      setMessage({ type: 'error', text: '请输入邀请码' });
      return;
    }
    setBinding(true);
    setMessage(null);
    try {
      const res: any = await api.post('/invite/bind', { inviteCode: code });
      if (res.success) {
        setMessage({ type: 'success', text: res.message || '绑定成功' });
        setBindCode('');
        await fetchMyCode();
        await fetchLeaderboard();
      } else {
        setMessage({ type: 'error', text: res.message || '绑定失败' });
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || '绑定失败，请检查邀请码是否正确',
      });
    }
    setBinding(false);
  };

  const handlePageChange = (newPage: number) => {
    setInvPage(newPage);
    fetchInvitations(newPage);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[var(--ink)] mb-6">邀请奖励</h1>
        <div className="bg-[var(--bg2)] rounded-xl p-8 text-center card-shadow">
          <p className="text-[var(--muted)]">请先登录后查看邀请奖励</p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[var(--ink)] mb-6">邀请奖励</h1>

        {loading ? (
          <div className="space-y-4">
            <div className="h-40 bg-[var(--bg3)] rounded-xl animate-pulse" />
            <div className="h-24 bg-[var(--bg3)] rounded-xl animate-pulse" />
            <div className="h-48 bg-[var(--bg3)] rounded-xl animate-pulse" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* 顶部卡片：邀请码 + 邀请链接 */}
            <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl p-6 text-white card-shadow">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 100-4h14a2 2 0 100 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
                <span className="text-sm font-medium text-violet-100">我的邀请码</span>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-4xl font-bold tracking-widest font-mono">
                  {myCode?.inviteCode || '--------'}
                </span>
                <button
                  onClick={() => handleCopy(myCode?.inviteCode || '', '邀请码已复制')}
                  className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-sm font-medium transition-colors"
                >
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
              <div>
                <p className="text-xs text-violet-200 mb-1">邀请链接</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 rounded-lg bg-black/20 text-sm truncate">
                    {inviteLink || '加载中...'}
                  </code>
                  <button
                    onClick={() => inviteLink && handleCopy(inviteLink, '邀请链接已复制')}
                    className="px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    复制链接
                  </button>
                </div>
              </div>
            </div>

            {/* 统计数据 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[var(--bg2)] rounded-xl p-5 card-shadow">
                <p className="text-sm text-[var(--muted)] mb-1">已邀请人数</p>
                <p className="text-3xl font-bold text-[var(--ink)]">
                  {myCode?.invitedCount ?? 0}
                  <span className="text-sm font-normal text-[var(--muted)] ml-1">人</span>
                </p>
              </div>
              <div className="bg-[var(--bg2)] rounded-xl p-5 card-shadow">
                <p className="text-sm text-[var(--muted)] mb-1">累计奖励 UU币</p>
                <p className="text-3xl font-bold text-[var(--warning)]">
                  {myCode?.totalReward ?? 0}
                  <span className="text-sm font-normal text-[var(--muted)] ml-1">UU</span>
                </p>
              </div>
            </div>

            {/* 绑定邀请人入口（未绑定时显示） */}
            {myCode && myCode.invitedBy === null && (
              <div className="bg-[var(--bg2)] rounded-xl p-6 card-shadow">
                <h3 className="font-semibold text-[var(--ink)] mb-2">绑定邀请人</h3>
                <p className="text-sm text-[var(--muted)] mb-4">
                  输入朋友的邀请码完成绑定，你和邀请人都将获得 UU币奖励。每位用户仅可绑定一次邀请人。
                </p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={bindCode}
                    onChange={(e) => setBindCode(e.target.value.toUpperCase())}
                    placeholder="请输入邀请码"
                    className="flex-1 h-10 px-3 rounded-lg border border-[var(--rule)] bg-[var(--bg)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent2)] font-mono tracking-wider"
                  />
                  <button
                    onClick={handleBind}
                    disabled={binding}
                    className="px-5 h-10 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {binding ? '绑定中...' : '绑定邀请人'}
                  </button>
                </div>
              </div>
            )}

            {myCode && myCode.invitedBy !== null && (
              <div className="bg-[var(--bg2)] rounded-xl p-4 card-shadow flex items-center gap-3">
                <svg className="w-5 h-5 text-[var(--success)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-[var(--muted)]">您已绑定邀请人，无法再次绑定。</p>
              </div>
            )}

            {message && (
              <p
                className={`text-sm ${
                  message.type === 'success' ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                }`}
              >
                {message.text}
              </p>
            )}

            {/* 邀请规则说明（3级奖励机制） */}
            <div className="bg-[var(--bg2)] rounded-xl p-6 card-shadow">
              <h3 className="font-semibold text-[var(--ink)] mb-4">邀请奖励规则</h3>
              <div className="space-y-3">
                {rewards.map((rule, idx) => (
                  <div
                    key={rule.level}
                    className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg3)]"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-sm font-bold">
                      {rule.level}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-[var(--ink)]">{rule.title}</span>
                        {idx === 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-[var(--warning)]/20 text-[var(--warning)] text-xs font-medium">
                            邀请人 +{rule.inviterReward} · 被邀请人 +{rule.inviteeReward}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--muted)]">{rule.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[var(--muted)] mt-3">
                邀请奖励将发放至永久余额，被邀请人仅可绑定一次邀请人。
              </p>
            </div>

            {/* 邀请排行榜（前10名） */}
            <div className="bg-[var(--bg2)] rounded-xl p-6 card-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[var(--ink)]">邀请排行榜</h3>
                <span className="text-xs text-[var(--muted)]">Top 10</span>
              </div>
              {leaderboard.length === 0 ? (
                <p className="text-sm text-[var(--muted)] text-center py-6">暂无排行榜数据，快去邀请好友抢占榜首吧</p>
              ) : (
                <div className="space-y-2">
                  {leaderboard.slice(0, 10).map((item, index) => (
                    <div
                      key={item.userId}
                      className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-[var(--bg3)] transition-colors"
                    >
                      <div
                        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${rankMedal(
                          index,
                        )}`}
                      >
                        {index + 1}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-[var(--accent)]/20 flex items-center justify-center text-sm font-bold text-[var(--accent)] overflow-hidden">
                        {item.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.avatar}
                            alt={item.nickname}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          item.nickname?.[0] || 'U'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--ink)] truncate">{item.nickname}</p>
                        <p className="text-xs text-[var(--muted)]">Lv.{item.level}</p>
                      </div>
                      <span className="text-sm font-bold text-[var(--accent)]">
                        {item.invitedCount}
                        <span className="text-xs font-normal text-[var(--muted)] ml-0.5">人</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 我邀请的用户列表 */}
            <div className="bg-[var(--bg2)] rounded-xl p-6 card-shadow">
              <h3 className="font-semibold text-[var(--ink)] mb-4">我邀请的用户</h3>
              {invitations.length === 0 ? (
                <p className="text-sm text-[var(--muted)] text-center py-6">
                  还没有邀请到用户，快把邀请码分享给朋友吧
                </p>
              ) : (
                <>
                  {/* 桌面端表格 */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[var(--muted)] border-b border-[var(--rule)]">
                          <th className="pb-2 font-medium">用户</th>
                          <th className="pb-2 font-medium">注册时间</th>
                          <th className="pb-2 font-medium text-right">状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invitations.map((inv) => (
                          <tr key={inv.id} className="border-b border-[var(--rule)] last:border-0">
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-[var(--accent)]/20 flex items-center justify-center text-sm font-bold text-[var(--accent)] overflow-hidden">
                                  {inv.invitee.avatar ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={inv.invitee.avatar}
                                      alt={inv.invitee.nickname}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    inv.invitee.nickname?.[0] || 'U'
                                  )}
                                </div>
                                <span className="text-[var(--ink)]">{inv.invitee.nickname}</span>
                              </div>
                            </td>
                            <td className="py-3 text-[var(--muted)]">
                              {new Date(inv.invitee.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 text-right">
                              <span className="inline-flex px-2 py-0.5 rounded-full bg-[var(--success)]/20 text-[var(--success)] text-xs font-medium">
                                已奖励
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 移动端卡片列表 */}
                  <div className="sm:hidden space-y-3">
                    {invitations.map((inv) => (
                      <div key={inv.id} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg3)]">
                        <div className="w-9 h-9 rounded-full bg-[var(--accent)]/20 flex items-center justify-center text-sm font-bold text-[var(--accent)] overflow-hidden">
                          {inv.invitee.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={inv.invitee.avatar}
                              alt={inv.invitee.nickname}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            inv.invitee.nickname?.[0] || 'U'
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--ink)] truncate">{inv.invitee.nickname}</p>
                          <p className="text-xs text-[var(--muted)]">
                            {new Date(inv.invitee.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-[var(--success)]/20 text-[var(--success)] text-xs font-medium">
                          已奖励
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* 分页 */}
                  {invTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <button
                        onClick={() => handlePageChange(invPage - 1)}
                        disabled={invPage <= 1}
                        className="px-3 py-1.5 rounded-lg border border-[var(--rule)] text-sm text-[var(--ink)] hover:bg-[var(--bg3)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        上一页
                      </button>
                      <span className="text-sm text-[var(--muted)]">
                        {invPage} / {invTotalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(invPage + 1)}
                        disabled={invPage >= invTotalPages}
                        className="px-3 py-1.5 rounded-lg border border-[var(--rule)] text-sm text-[var(--ink)] hover:bg-[var(--bg3)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        下一页
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* 当前用户提示 */}
        {user && (
          <p className="text-xs text-[var(--muted)] text-center mt-6">
            邀请码由系统自动生成，每位用户唯一
          </p>
        )}
      </div>
    </PageTransition>
  );
}
