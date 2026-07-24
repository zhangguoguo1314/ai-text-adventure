'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { useState } from 'react';
import ModelExchangeModal from '@/components/settings/ModelExchangeModal';
import ThemeToggle from '@/components/common/ThemeToggle';
import NotificationBell from '@/components/common/NotificationBell';

const navLinks: Array<{ label: string; href: string; icon?: string }> = [
  { label: '发现', href: '/' },
  { label: '探索', href: '/explore', icon: 'compass' },
  { label: '模板市场', href: '/templates', icon: 'template' },
  { label: '我的作品', href: '/my-works' },
  { label: '创作仪表盘', href: '/dashboard', icon: 'chart' },
  { label: '社区广场', href: '/plaza' },
  { label: '排行榜', href: '/ranking', icon: 'trophy' },
];

const createLinks = [
  { label: '开始创作', href: '/create' },
  { label: '模板市场', href: '/templates' },
  { label: '我的创作', href: '/my-works' },
];

const accountLinks: Array<{ label: string; href: string; icon?: string }> = [
  { label: '设置', href: '/profile' },
  { label: '成就', href: '/achievements', icon: 'medal' },
  { label: '邀请奖励', href: '/invite', icon: 'gift' },
  { label: '关注动态', href: '/plaza?type=following' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { balance, sidebarCollapsed, toggleSidebar } = useAppStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);

  const handleCreateClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      setShowAuthModal(true);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen bg-violet-900 text-white flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? '-translate-x-full lg:w-16 lg:translate-x-0' : 'w-60'
        }`}
      >
        {/* Logo + 通知铃铛 */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-violet-800">
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-violet-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {!sidebarCollapsed && (
            <Link href="/" className="text-lg font-bold text-violet-200 hover:text-white flex-1 min-w-0 truncate">
              AI Text Adventure
            </Link>
          )}
          {/* 顶部栏通知铃铛 */}
          <div className={sidebarCollapsed ? '' : 'ml-auto'}>
            <NotificationBell onDark />
          </div>
        </div>

        {/* Main Nav */}
        {!sidebarCollapsed && (
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
            {/* Navigation */}
            <div>
              <p className="px-3 mb-2 text-xs font-semibold text-violet-400 uppercase tracking-wider">
                导航
              </p>
              {navLinks.map((link) => {
                const isActive =
                  link.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-violet-800 text-violet-200 font-medium'
                        : 'text-violet-300 hover:bg-violet-800/50 hover:text-white'
                    }`}
                  >
                    {link.icon === 'compass' && (
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {link.icon === 'template' && (
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    )}
                    {link.icon === 'chart' && (
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    )}
                    {link.icon === 'trophy' && (
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    )}
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Creation */}
            <div>
              <p className="px-3 mb-2 text-xs font-semibold text-violet-400 uppercase tracking-wider">
                创作
              </p>
              {createLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={handleCreateClick}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    pathname === link.href
                      ? 'bg-violet-800 text-violet-200 font-medium'
                      : 'text-violet-300 hover:bg-violet-800/50 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Account */}
            <div>
              <p className="px-3 mb-2 text-xs font-semibold text-violet-400 uppercase tracking-wider">
                账户
              </p>
              {accountLinks.map((link) => {
                const isActive =
                  link.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(link.href.split('?')[0]);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-violet-800 text-violet-200 font-medium'
                        : 'text-violet-300 hover:bg-violet-800/50 hover:text-white'
                    }`}
                  >
                    {link.icon === 'gift' && (
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12v10H4V12M2 7h20v5H2V7zm10 5a2 2 0 012 2v0a2 2 0 01-2 2 2 2 0 01-2-2v0a2 2 0 012-2zm0 0V7m0 0a3 3 0 00-3-3 2.5 2.5 0 00-2.5 2.5M12 7a3 3 0 013-3 2.5 2.5 0 012.5 2.5" />
                      </svg>
                    )}
                    {link.icon === 'medal' && (
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    )}
                    {link.label}
                  </Link>
                );
              })}
              <Link
                href="/settings/api"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  pathname.startsWith('/settings/api')
                    ? 'bg-violet-800 text-violet-200 font-medium'
                    : 'text-violet-300 hover:bg-violet-800/50 hover:text-white'
                }`}
              >
                自定义 API
              </Link>
            </div>

            {/* 通知 / 公告提示：实时通知已迁移至顶部通知铃铛，公告通过页面顶部横幅展示 */}
          </nav>
        )}

        {/* Bottom - Balance + User */}
        <div className="border-t border-violet-800 p-4">
          {/* UU Balance */}
          {!sidebarCollapsed && (
            <div className="flex items-center justify-between mb-3 px-2">
              <div className="text-sm text-violet-300">
                UU币：<span className="text-yellow-400 font-bold">{balance.permanent + balance.temp}</span>
              </div>
              <button className="p-1 rounded hover:bg-violet-800 text-violet-400 hover:text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          )}

          {/* Model / Exchange button */}
          {!sidebarCollapsed && (
            <button
              onClick={() => setShowModelModal(true)}
              className="w-full py-2 mb-3 rounded-lg bg-violet-700 hover:bg-violet-600 text-sm font-medium transition-colors"
            >
              模型 / 兑换
            </button>
          )}

          {/* User info */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-sm font-bold">
                {user.nickname?.[0] || 'U'}
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.nickname}</p>
                  <p className="text-xs text-violet-400">Lv.{user.level}</p>
                </div>
              )}
              {!sidebarCollapsed && (
                <button
                  onClick={logout}
                  className="p-1 rounded hover:bg-violet-800 text-violet-400 hover:text-white"
                  title="退出登录"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              )}
            </div>
          ) : (
            !sidebarCollapsed && (
              <Link
                href="/login"
                className="block w-full py-2 rounded-lg bg-violet-700 hover:bg-violet-600 text-sm font-medium text-center transition-colors"
              >
                登录 / 注册
              </Link>
            )
          )}
        </div>
      </aside>

      {/* 浮动主题切换按钮 - 紧凑模式 */}
      <div className="fixed top-4 right-4 z-30 lg:top-auto lg:right-auto lg:bottom-4 lg:left-4 lg:z-[51]">
        <ThemeToggle compact />
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center">
          <div className="bg-[var(--bg2)] rounded-xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-[var(--ink)] mb-2">请先登录</h3>
            <p className="text-[var(--muted)] mb-4">创作功能需要登录后才能使用。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAuthModal(false)}
                className="flex-1 py-2 rounded-lg border border-[var(--rule)] text-[var(--ink)] hover:bg-[var(--bg3)]"
              >
                取消
              </button>
              <Link
                href="/login"
                onClick={() => setShowAuthModal(false)}
                className="flex-1 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 text-center"
              >
                去登录
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Model Exchange Modal */}
      <ModelExchangeModal
        open={showModelModal}
        onClose={() => setShowModelModal(false)}
      />
    </>
  );
}
