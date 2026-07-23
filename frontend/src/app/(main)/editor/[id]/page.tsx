'use client';

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  // Script ID will be loaded from params
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--ink)]">剧本编辑器</h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700">
            保存
          </button>
          <button className="px-4 py-2 rounded-lg bg-[var(--success)] text-white text-sm font-medium hover:opacity-90">
            发布
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl p-6 min-h-[60vh]">
        <p className="text-[var(--muted)]">编辑器区域开发中...</p>
      </div>
    </div>
  );
}
