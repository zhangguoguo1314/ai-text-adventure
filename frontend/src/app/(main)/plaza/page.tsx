'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import PostFeed from '@/components/community/PostFeed';
import CreatePost from '@/components/community/CreatePost';
import NotificationList from '@/components/community/NotificationList';

const TABS = ['动态', 'AI应用', '创作者活动', '角色卡', '消息'] as const;
type TabType = (typeof TABS)[number];

export default function PlazaPage() {
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('动态');
  const [sort, setSort] = useState<'latest' | 'hot' | 'following'>('latest');
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePostCreated = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--ink)] mb-6">社区广场</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white text-violet-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === '动态' && (
        <div className="space-y-4">
          {/* Sort Tabs */}
          <div className="flex gap-4">
            {(['latest', 'hot', 'following'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`text-sm pb-1 border-b-2 transition-colors ${
                  sort === s
                    ? 'border-violet-600 text-violet-700 font-medium'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {s === 'latest' ? '最新' : s === 'hot' ? '最热' : '关注'}
              </button>
            ))}
          </div>

          {/* Create Post */}
          {isAuthenticated && <CreatePost onCreated={handlePostCreated} />}

          {/* Post Feed */}
          <PostFeed sort={sort} refreshKey={refreshKey} />
        </div>
      )}

      {activeTab === 'AI应用' && (
        <div className="bg-white rounded-xl p-8 text-center">
          <p className="text-gray-400">AI应用市场即将上线，敬请期待。</p>
        </div>
      )}

      {activeTab === '创作者活动' && (
        <div className="bg-white rounded-xl p-8 text-center">
          <p className="text-gray-400">创作者活动板块开发中...</p>
        </div>
      )}

      {activeTab === '角色卡' && (
        <div className="bg-white rounded-xl p-8 text-center">
          <p className="text-gray-400">角色卡市场即将上线，敬请期待。</p>
        </div>
      )}

      {activeTab === '消息' && (
        <div>
          {isAuthenticated ? (
            <NotificationList />
          ) : (
            <div className="bg-white rounded-xl p-8 text-center">
              <p className="text-gray-400">请先登录查看消息</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
