'use client';

import Link from 'next/link';

const createTypes = [
  {
    key: 'script',
    label: '创作剧本',
    desc: '创建沉浸式文字冒险游戏剧本，定义世界观、NPC和剧情走向',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    tags: ['世界观设定', 'NPC管理', '剧情节点', 'AI辅助'],
    href: '/editor/new?type=script',
    featured: true,
  },
  {
    key: 'app',
    label: '创作 AI 应用',
    desc: '构建基于大语言模型的智能应用，定义对话流程和工具调用',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
    tags: ['Prompt工程', '工具调用', '多轮对话'],
    href: '/editor/new?type=app',
    featured: false,
  },
  {
    key: 'in-app',
    label: '创作手机 App',
    desc: '在手机端体验的互动故事应用，适合随时随地游玩',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
      </svg>
    ),
    tags: ['移动端适配', '触屏交互', '离线游玩'],
    href: '/editor/new?type=in-app',
    featured: false,
  },
  {
    key: 'import',
    label: '导入代码文件',
    desc: '从现有的剧本文件或JSON配置导入，快速开始编辑',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
    tags: ['JSON导入', '批量创建', '模板复用'],
    href: '/editor/new?type=import',
    featured: false,
  },
];

export default function CreatePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--ink)] mb-2">开始创作</h1>
        <p className="text-[var(--muted)]">选择你想要创建的内容类型，开始你的创作之旅</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {createTypes.map((type) => (
          <Link
            key={type.key}
            href={type.href}
            className={`relative group block p-6 bg-white rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
              type.featured
                ? 'border-violet-200 hover:border-violet-400'
                : 'border-[var(--rule)] hover:border-violet-300'
            }`}
          >
            {type.featured && (
              <span className="absolute top-3 right-3 text-xs font-medium bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                推荐
              </span>
            )}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-2 rounded-lg bg-violet-50 text-violet-600 group-hover:bg-violet-100 transition-colors">
                {type.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-[var(--ink)] group-hover:text-violet-700 transition-colors">
                  {type.label}
                </h3>
                <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">
                  {type.desc}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {type.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <span className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 group-hover:text-violet-700">
                开始
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
