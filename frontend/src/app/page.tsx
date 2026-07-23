'use client';

import { useState } from 'react';
import Banner from '@/components/home/Banner';
import SearchBar from '@/components/home/SearchBar';
import RankTabs from '@/components/home/RankTabs';
import ScriptCard from '@/components/home/ScriptCard';
import PageTransition from '@/components/common/PageTransition';
import { Script } from '@/types';

const mockScripts: Script[] = [
  {
    id: 1,
    title: '迷雾森林',
    description: '你醒来时发现自己身处一片被浓雾笼罩的古老森林。四周寂静无声，只有偶尔传来的鸟鸣打破这份宁静。你的背包里有一张泛黄的地图和一把生锈的匕首...',
    coverImage: null,
    genre: '奇幻冒险',
    tags: ['奇幻', '冒险', '探索'],
    authorId: 1,
    authorName: '梦境旅人',
    playCount: 12580,
    likeCount: 892,
    chapterCount: 12,
    status: 'published',
    rating: 4.7,
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-02-20T15:30:00Z',
  },
  {
    id: 2,
    title: '赛博朋克 2099',
    description: '在新东京的霓虹灯下，你是一名赏金猎人，接到一个神秘委托——寻找失踪的天才科学家。每一次选择都将影响故事的走向和最终结局。',
    coverImage: null,
    genre: '科幻',
    tags: ['科幻', '赛博朋克', '悬疑'],
    authorId: 2,
    authorName: '未来代码',
    playCount: 8430,
    likeCount: 621,
    chapterCount: 15,
    status: 'published',
    rating: 4.5,
    createdAt: '2025-02-01T08:00:00Z',
    updatedAt: '2025-03-10T12:00:00Z',
  },
  {
    id: 3,
    title: '江湖恩仇录',
    description: '天下武林，风起云涌。你本是山野村夫，却因一场意外卷入了江湖纷争。是选择归隐山林，还是仗剑天涯？一切由你决定。',
    coverImage: null,
    genre: '武侠',
    tags: ['武侠', '古风', '江湖'],
    authorId: 3,
    authorName: '墨染江山',
    playCount: 15620,
    likeCount: 1103,
    chapterCount: 20,
    status: 'published',
    rating: 4.9,
    createdAt: '2025-01-20T14:00:00Z',
    updatedAt: '2025-03-05T09:00:00Z',
  },
  {
    id: 4,
    title: '深海实验室',
    description: '你被派往位于马里亚纳海沟的秘密研究站调查失联事件。随着调查深入，你发现这里的秘密远超想象...',
    coverImage: null,
    genre: '恐怖',
    tags: ['恐怖', '悬疑', '科幻'],
    authorId: 4,
    authorName: '深渊凝视者',
    playCount: 6780,
    likeCount: 445,
    chapterCount: 8,
    status: 'published',
    rating: 4.3,
    createdAt: '2025-03-01T16:00:00Z',
    updatedAt: '2025-03-20T11:00:00Z',
  },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('category');

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Banner 轮播 */}
        <Banner />

        {/* 搜索框 */}
        <div className="mt-6">
          <SearchBar />
        </div>

        {/* 排行榜区域 */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-[var(--ink)] mb-4">排行榜</h2>
          <RankTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {/* 作品列表 */}
          <div className="mt-4 space-y-3">
            {mockScripts.map((script, idx) => (
              <ScriptCard key={script.id} script={script} rank={idx + 1} />
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
