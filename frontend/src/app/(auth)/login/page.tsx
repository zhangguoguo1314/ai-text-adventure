'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const [loginType, setLoginType] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (loginType === 'phone') {
        await login(phone, password);
      } else {
        // 邮箱登录走同样的接口，后端兼容
        await login(email, password);
      }
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-[var(--ink)] mb-6">登录</h1>

        {/* Tab 切换 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setLoginType('phone')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              loginType === 'phone'
                ? 'bg-violet-600 text-white'
                : 'bg-violet-50 text-violet-600 hover:bg-violet-100'
            }`}
          >
            手机号登录
          </button>
          <button
            onClick={() => setLoginType('email')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              loginType === 'email'
                ? 'bg-violet-600 text-white'
                : 'bg-violet-50 text-violet-600 hover:bg-violet-100'
            }`}
          >
            邮箱登录
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {loginType === 'phone' ? (
            <input
              type="tel"
              placeholder="手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full h-11 px-4 rounded-lg border border-[var(--rule)] bg-[var(--bg)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          ) : (
            <input
              type="email"
              placeholder="邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-11 px-4 rounded-lg border border-[var(--rule)] bg-[var(--bg)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          )}

          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
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
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--muted)] mt-6">
          还没有账号？{' '}
          <a href="/register" className="text-violet-600 hover:text-violet-700 font-medium">
            立即注册
          </a>
        </p>
      </div>
    </div>
  );
}
