'use client';

import { useEffect, useState } from 'react';
import { ScriptTemplate } from '@/types';
import { formatNumber } from '@/lib/utils';
import { getCategoryLabel } from '@/lib/useTemplates';

interface TemplateDetailProps {
  template: ScriptTemplate | null;
  open: boolean;
  onClose: () => void;
  onApply?: (template: ScriptTemplate) => void;
  onRate?: (template: ScriptTemplate, rating: number) => void;
  applying?: boolean;
}

/* 星星评分组件 */
function StarRating({
  value,
  onChange,
  readOnly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
          onClick={() => !readOnly && onChange?.(star)}
          className={`${readOnly ? 'cursor-default' : 'cursor-pointer'} transition-transform ${!readOnly ? 'hover:scale-110' : ''}`}
          aria-label={`${star} 星`}
        >
          <svg
            className={`w-5 h-5 ${star <= display ? 'text-amber-400' : 'text-[var(--rule)]'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

/* 分区标题 */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-[var(--ink)] mb-2 flex items-center gap-1.5">
        <span className="w-1 h-4 rounded-full bg-[var(--accent)]" />
        {title}
      </h4>
      <div className="text-sm text-[var(--muted)] leading-relaxed">{children}</div>
    </div>
  );
}

export default function TemplateDetail({
  template,
  open,
  onClose,
  onApply,
  onRate,
  applying = false,
}: TemplateDetailProps) {
  const [userRating, setUserRating] = useState(0);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) setUserRating(0);
  }, [open, template?.id]);

  if (!open || !template) return null;

  const handleRate = (v: number) => {
    setUserRating(v);
    onRate?.(template, v);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg2)] rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="relative flex items-start gap-4 p-6 border-b border-[var(--rule)]">
          <div className="flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center text-4xl bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-violet-900/30 dark:via-purple-900/20 dark:to-pink-900/20">
            {template.coverEmoji || '📖'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-[var(--ink)]">{template.name}</h2>
              {template.isOfficial && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  官方
                </span>
              )}
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                {getCategoryLabel(template.category)}
              </span>
            </div>
            <p className="mt-1 text-sm text-[var(--muted)] line-clamp-2">
              {template.description || '暂无描述'}
            </p>
            <div className="mt-2 flex items-center gap-4 text-xs text-[var(--muted)]">
              <span>{formatNumber(template.useCount)} 次使用</span>
              <span className="flex items-center gap-1">
                <StarRating value={Math.round(template.rating)} readOnly />
                <span className="ml-1">
                  {template.rating > 0 ? template.rating.toFixed(1) : '暂无评分'}
                </span>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-[var(--bg3)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
            aria-label="关闭"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 世界观设定 */}
          {template.worldSetting && (
            <Section title="世界观设定">
              <p className="whitespace-pre-line">{template.worldSetting}</p>
            </Section>
          )}

          {/* NPC 列表 */}
          {template.npcTemplate?.length > 0 && (
            <Section title={`NPC 列表（${template.npcTemplate.length}）`}>
              <div className="space-y-2">
                {template.npcTemplate.map((npc, i) => (
                  <div
                    key={i}
                    className="flex gap-3 p-3 rounded-lg bg-[var(--bg3)]/50"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center text-sm font-medium">
                      {npc.name?.[0] || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--ink)]">{npc.name}</p>
                      {npc.personality && (
                        <p className="text-xs text-[var(--muted)] mt-0.5">{npc.personality}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* 属性定义 */}
          {template.attrTemplate?.length > 0 && (
            <Section title={`属性定义（${template.attrTemplate.length}）`}>
              <div className="grid grid-cols-2 gap-2">
                {template.attrTemplate.map((attr, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg3)]/50"
                  >
                    <span className="text-sm text-[var(--ink)]">{attr.name}</span>
                    <span className="text-xs text-[var(--muted)]">
                      {attr.type || 'number'}
                      {attr.defaultVal ? ` · 默认 ${attr.defaultVal}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* 节点结构 */}
          {template.nodeTemplate?.length > 0 && (
            <Section title={`节点结构（${template.nodeTemplate.length}）`}>
              <div className="space-y-2">
                {template.nodeTemplate.map((node, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-[var(--bg3)]/50"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)]/15 text-[var(--accent)] font-medium">
                        {node.type || 'scene'}
                      </span>
                      <span className="text-xs text-[var(--muted)]">#{i + 1}</span>
                    </div>
                    {node.content && (
                      <p className="text-xs text-[var(--muted)] line-clamp-3 whitespace-pre-line">
                        {node.content}
                      </p>
                    )}
                    {node.choices && node.choices.length > 0 && (
                      <ul className="mt-1.5 space-y-1">
                        {node.choices.map((c, j) => (
                          <li key={j} className="text-xs text-[var(--muted)] flex gap-1.5">
                            <span className="text-[var(--accent)]">·</span>
                            {c.text}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* 评分 */}
          {onRate && (
            <Section title="为模板评分">
              <div className="flex items-center gap-3">
                <StarRating value={userRating} onChange={handleRate} />
                <span className="text-xs text-[var(--muted)]">
                  {userRating > 0 ? `已评 ${userRating} 星` : '点击星星评分（0-5）'}
                </span>
              </div>
            </Section>
          )}
        </div>

        {/* 底部操作 */}
        <div className="p-4 border-t border-[var(--rule)]">
          <button
            onClick={() => onApply?.(template)}
            disabled={applying}
            className="w-full py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 text-white text-sm font-medium transition-colors"
          >
            {applying ? '创建中...' : '使用此模板'}
          </button>
        </div>
      </div>
    </div>
  );
}
