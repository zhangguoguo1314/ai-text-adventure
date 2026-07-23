'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function RegisterPage() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }

    setLoading(true);

    try {
      await register({
        phone,
        verificationCode: code,
        password,
        inviteCode: inviteCode || undefined,
      });
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-[var(--ink)] mb-6">注册</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="tel"
            placeholder="手机号"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full h-11 px-4 rounded-lg border border-[var(--rule)] bg-[var(--bg)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-violet-400"
          />

          <div className="flex gap-3">
            <input
              type="text"
              placeholder="验证码"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="flex-1 h-11 px-4 rounded-lg border border-[var(--rule)] bg-[var(--bg)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            <button
              type="button"
              className="h-11 px-4 rounded-lg bg-violet-100 text-violet-700 hover:bg-violet-200 text-sm font-medium transition-colors whitespace-nowrap"
            >
              获取验证码
            </button>
          </div>

          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full h-11 px-4 rounded-lg border border-[var(--rule)] bg-[var(--bg)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-violet-400"
          />

          <input
            type="password"
            placeholder="确认密码"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full h-11 px-4 rounded-lg border border-[var(--rule)] bg-[var(--bg)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-violet-400"
          />

          <input
            type="text"
            placeholder="邀请码（选填）"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            className="w-full h-11 px-4 rounded-lg border border-[var(--rule)] bg-[var(--bg)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-violet-400"
          />

          {error && (
            <p className="text-sm text-[var(--danger)]">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium transition-colors disabled:opacity-50"
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--muted)] mt-6">
          已有账号？{' '}
          <a href="/login" className="text-violet-600 hover:text-violet-700 font-medium">
            去登录
          </a>
        </p>
      </div>
    </div>
  );
}
