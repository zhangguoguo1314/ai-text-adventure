'use client';

export default function MyWorksPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--ink)]">我的创作</h1>
        <a
          href="/create"
          className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700"
        >
          新建剧本
        </a>
      </div>
      <div className="bg-white rounded-xl p-8">
        <p className="text-center text-[var(--muted)]">暂无作品，点击「新建剧本」开始创作</p>
      </div>
    </div>
  );
}
