'use client';

export default function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl overflow-hidden">
        {/* 头部 */}
        <div className="h-48 bg-gradient-to-r from-violet-500 to-purple-600 flex items-end p-6">
          <div>
            <h1 className="text-2xl font-bold text-white">剧本名称</h1>
            <p className="text-white/70 text-sm mt-1">作者名</p>
          </div>
        </div>

        {/* 信息 */}
        <div className="p-6 space-y-4">
          <p className="text-[var(--muted)] leading-relaxed">
            这是一个精彩的文字冒险故事，等待你来探索...
          </p>

          <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
            <span>0 次游玩</span>
            <span>0 次收藏</span>
            <span>0 章节</span>
          </div>

          <div className="flex gap-3 pt-4">
            <button className="flex-1 py-3 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-700">
              开始游玩
            </button>
            <button className="px-6 py-3 rounded-lg border border-[var(--rule)] text-[var(--ink)] hover:bg-violet-50">
              收藏
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
