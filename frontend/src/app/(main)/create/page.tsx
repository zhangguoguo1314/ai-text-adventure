'use client';

export default function CreatePage() {
  const createTypes = [
    { key: 'blank', label: '空白剧本', desc: '从零开始，自由创作你的故事' },
    { key: 'template', label: '模板创作', desc: '选择模板，快速开始创作' },
    { key: 'ai', label: 'AI 辅助', desc: '描述你的想法，AI 帮你生成剧本框架' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--ink)] mb-6">开始创作</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {createTypes.map((type) => (
          <button
            key={type.key}
            className="p-6 bg-white rounded-xl hover:shadow-md transition-shadow text-left group"
          >
            <h3 className="text-lg font-semibold text-[var(--ink)] group-hover:text-violet-600 transition-colors">
              {type.label}
            </h3>
            <p className="mt-2 text-sm text-[var(--muted)]">{type.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
