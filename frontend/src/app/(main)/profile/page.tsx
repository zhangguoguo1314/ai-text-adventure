'use client';

import { useAuthStore } from '@/store/authStore';

export default function ProfilePage() {
  const { user, logout } = useAuthStore();

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--ink)] mb-6">个人设置</h1>
      <div className="bg-white rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-violet-200 flex items-center justify-center text-2xl font-bold text-violet-700">
            {user?.nickname?.[0] || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{user?.nickname || '未登录'}</h2>
            <p className="text-sm text-[var(--muted)]">
              {user?.phone || user?.email || '未设置联系方式'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1">昵称</label>
            <input
              type="text"
              defaultValue={user?.nickname || ''}
              className="w-full h-10 px-3 rounded-lg border border-[var(--rule)] bg-[var(--bg)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1">手机号</label>
            <input
              type="tel"
              defaultValue={user?.phone || ''}
              className="w-full h-10 px-3 rounded-lg border border-[var(--rule)] bg-[var(--bg)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1">邮箱</label>
            <input
              type="email"
              defaultValue={user?.email || ''}
              className="w-full h-10 px-3 rounded-lg border border-[var(--rule)] bg-[var(--bg)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button className="px-6 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700">
            保存修改
          </button>
          <button
            onClick={logout}
            className="px-6 py-2 rounded-lg border border-[var(--danger)] text-[var(--danger)] text-sm font-medium hover:bg-red-50"
          >
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
}
