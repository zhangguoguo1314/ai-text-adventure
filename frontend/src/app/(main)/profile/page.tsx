'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

export default function ProfilePage() {
  const { user, isAuthenticated, logout, fetchMe } = useAuthStore();
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      setNickname(user?.nickname || '');
      setBio(user?.bio || '');
      setInviteCode(user?.inviteCode || '');
      fetchTransactions();
    }
  }, [isAuthenticated, user]);

  const fetchTransactions = async () => {
    try {
      const res: any = await api.get('/user/transactions');
      if (res.success) {
        setTransactions(res.data.list);
      }
    } catch {
      // ignore
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res: any = await api.put('/user/profile', { nickname, bio });
      if (res.success) {
        setMessage({ type: 'success', text: '保存成功' });
        fetchMe();
      } else {
        setMessage({ type: 'error', text: res.message || '保存失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '保存失败' });
    }
    setSaving(false);
  };

  const handleCopyInviteCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setMessage({ type: 'success', text: '邀请码已复制' });
    }
  };

  const typeLabel: Record<string, string> = {
    recharge: '充值',
    spend: '消费',
    redeem: '兑换',
    income: '收入',
  };

  const typeColor: Record<string, string> = {
    recharge: 'text-green-600',
    spend: 'text-red-500',
    redeem: 'text-green-600',
    income: 'text-green-600',
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-[var(--ink)] mb-6">个人设置</h1>
        <div className="bg-white rounded-xl p-8 text-center">
          <p className="text-gray-400">请先登录</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--ink)] mb-6">个人设置</h1>
      <div className="space-y-6">
        {/* User Info Card */}
        <div className="bg-white rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-violet-200 flex items-center justify-center text-2xl font-bold text-violet-700">
              {user?.nickname?.[0] || 'U'}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{user?.nickname || '未设置'}</h2>
              <p className="text-sm text-[var(--muted)]">
                Lv.{user?.level || 1} | {user?.phone || user?.email || '未设置联系方式'}
              </p>
            </div>
          </div>
        </div>

        {/* Edit Profile */}
        <div className="bg-white rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-[var(--ink)]">编辑资料</h3>
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1">昵称</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[var(--rule)] bg-[var(--bg)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1">简介</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-[var(--rule)] bg-[var(--bg)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
            />
          </div>
          {message && (
            <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
              {message.text}
            </p>
          )}
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="px-6 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存修改'}
          </button>
        </div>

        {/* Invite Code */}
        {inviteCode && (
          <div className="bg-white rounded-xl p-6">
            <h3 className="font-semibold text-[var(--ink)] mb-3">我的邀请码</h3>
            <div className="flex items-center gap-3">
              <code className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-violet-700 font-mono text-lg">
                {inviteCode}
              </code>
              <button
                onClick={handleCopyInviteCode}
                className="px-4 py-2 rounded-lg border border-violet-300 text-violet-700 text-sm font-medium hover:bg-violet-50 transition-colors"
              >
                复制
              </button>
            </div>
          </div>
        )}

        {/* Transaction Records */}
        <div className="bg-white rounded-xl p-6">
          <h3 className="font-semibold text-[var(--ink)] mb-3">交易记录</h3>
          {transactions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">暂无交易记录</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm text-gray-700">{t.description}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(t.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`text-sm font-medium ${typeColor[t.type] || 'text-gray-700'}`}>
                    {t.type === 'spend' ? '-' : '+'}{t.amount} UU
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl p-6">
          <button
            onClick={logout}
            className="w-full py-2.5 rounded-lg border border-[var(--danger)] text-[var(--danger)] text-sm font-medium hover:bg-red-50 transition-colors"
          >
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
}
