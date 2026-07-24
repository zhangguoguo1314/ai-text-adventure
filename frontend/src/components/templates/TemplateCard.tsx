'use client';

import { ScriptTemplate } from '@/types';
import { formatNumber } from '@/lib/utils';
import { getCategoryLabel } from '@/lib/useTemplates';

interface TemplateCardProps {
  template: ScriptTemplate;
  onApply?: (template: ScriptTemplate) => void;
  onDetail?: (template: ScriptTemplate) => void;
}

export default function TemplateCard({
  template,
  onApply,
  onDetail,
}: TemplateCardProps) {
  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    onApply?.(template);
  };

  const handleOpen = () => {
    onDetail?.(template);
  };

  return (
    <div
      onClick={handleOpen}
      className="flex flex-col bg-[var(--bg2)] rounded-xl border border-[var(--rule)] hover:border-[var(--accent)] hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden group card-shadow"
    >
      {/* emoji 封面 */}
      <div className="relative h-28 flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-violet-900/30 dark:via-purple-900/20 dark:to-pink-900/20">
        <span className="text-5xl group-hover:scale-110 transition-transform duration-200">
          {template.coverEmoji || '📖'}
        </span>
        {template.isOfficial && (
          <span className="absolute top-2 left-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            官方
          </span>
        )}
        <span className="absolute top-2 right-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--bg2)]/80 text-[var(--accent)] backdrop-blur">
          {getCategoryLabel(template.category)}
        </span>
      </div>

      {/* 内容 */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="text-base font-semibold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors truncate">
          {template.name}
        </h3>
        <p className="mt-1.5 text-sm text-[var(--muted)] line-clamp-2 leading-relaxed flex-1">
          {template.description || '暂无描述'}
        </p>

        {/* 标签 */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-300">
            {template.npcTemplate?.length || 0} NPC
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-300">
            {template.attrTemplate?.length || 0} 属性
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-300">
            {template.nodeTemplate?.length || 0} 节点
          </span>
        </div>

        {/* 统计 */}
        <div className="mt-3 flex items-center justify-between text-xs text-[var(--muted)]">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path
                fillRule="evenodd"
                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clipRule="evenodd"
              />
            </svg>
            {formatNumber(template.useCount)} 次使用
          </span>
          <span className="flex items-center gap-0.5">
            <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {template.rating > 0 ? template.rating.toFixed(1) : '暂无'}
          </span>
        </div>

        {/* 使用按钮 */}
        <button
          onClick={handleApply}
          className="mt-3 w-full py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium transition-colors"
        >
          使用模板
        </button>
      </div>
    </div>
  );
}
