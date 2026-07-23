'use client';

import { useState, useEffect, useCallback } from 'react';

interface BannerItem {
  id: number;
  title: string;
  description: string;
  bgColor: string;
}

const mockBanners: BannerItem[] = [
  {
    id: 1,
    title: 'AI 文字冒险 -- 无限想象',
    description: '用 AI 创造属于你的互动文字冒险游戏',
    bgColor: 'from-violet-600 to-purple-700',
  },
  {
    id: 2,
    title: '全新模板库上线',
    description: '数百种预设模板，一键开始你的创作之旅',
    bgColor: 'from-fuchsia-600 to-pink-700',
  },
  {
    id: 3,
    title: '创作者大赛火热进行中',
    description: '参与创作赢取丰厚奖励',
    bgColor: 'from-indigo-600 to-blue-700',
  },
];

export default function Banner() {
  const [current, setCurrent] = useState(0);

  const goNext = useCallback(() => {
    setCurrent((prev) => (prev + 1) % mockBanners.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(goNext, 4000);
    return () => clearInterval(timer);
  }, [goNext]);

  const banner = mockBanners[current];

  return (
    <div className="relative w-full h-48 md:h-64 rounded-xl overflow-hidden">
      <div
        className={`absolute inset-0 bg-gradient-to-r ${banner.bgColor} transition-all duration-500`}
      />
      <div className="relative z-10 flex flex-col justify-center h-full px-8 md:px-12 text-white">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">{banner.title}</h2>
        <p className="text-sm md:text-base text-white/80 max-w-lg">{banner.description}</p>
      </div>

      {/* 指示器 */}
      <div className="absolute bottom-4 right-6 flex gap-2 z-10">
        {mockBanners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              idx === current ? 'bg-white' : 'bg-white/40'
            }`}
          />
        ))}
      </div>

      {/* 左右箭头 */}
      <button
        onClick={() => setCurrent((current - 1 + mockBanners.length) % mockBanners.length)}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={goNext}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
