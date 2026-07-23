'use client';

import { useEffect, useRef } from 'react';
import { GeneratedContent } from '@/types';

interface GeneratePreviewProps {
  generating: boolean;
  generatedContent: GeneratedContent | null;
  error: string | null;
  onGenerate: () => void;
  onEnterEditor: () => void;
  onBack: (step: number) => void;
}

function LoadingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-violet-200 rounded-full" />
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-violet-600 rounded-full animate-spin" />
        <div className="absolute top-2 left-2 w-12 h-12 border-4 border-transparent border-t-violet-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
      </div>
      <h3 className="mt-6 text-lg font-semibold text-violet-600">AI 正在为你打造游戏世界...</h3>
      <p className="mt-2 text-sm text-[var(--muted)]">这可能需要 10-30 秒，请耐心等待</p>
      <div className="mt-4 flex gap-1">
        <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 rounded-full bg-violet-600 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

function ContentPreview({ content }: { content: GeneratedContent }) {
  return (
    <div className="space-y-6">
      {/* World Setting */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--ink)] mb-2 flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-violet-100 text-violet-600 flex items-center justify-center text-xs">1</span>
          世界观规则
        </h3>
        <div className="p-3 rounded-lg bg-gray-50 border border-[var(--rule)] text-sm text-[var(--muted)] whitespace-pre-line line-clamp-6">
          {content.worldSetting}
        </div>
      </div>

      {/* NPCs */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--ink)] mb-2 flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-violet-100 text-violet-600 flex items-center justify-center text-xs">2</span>
          NPC 角色
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {content.npcs.map((npc, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-gray-50 border border-[var(--rule)]">
              <div className="font-medium text-sm text-[var(--ink)]">{npc.name}</div>
              <div className="text-xs text-[var(--muted)] mt-1 line-clamp-2">{npc.personality}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Attributes */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--ink)] mb-2 flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-violet-100 text-violet-600 flex items-center justify-center text-xs">3</span>
          属性定义
        </h3>
        <div className="flex flex-wrap gap-2">
          {content.attributes.map((attr, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-xs text-violet-700"
            >
              {attr.name}
              {attr.type === 'number' && attr.minVal !== null && attr.maxVal !== null && (
                <span className="text-violet-400">({attr.minVal}-{attr.maxVal})</span>
              )}
              {attr.type === 'enum' && (
                <span className="text-violet-400">[枚举]</span>
              )}
              {attr.type === 'boolean' && (
                <span className="text-violet-400">[布尔]</span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Opening Scene */}
      {content.openingScene && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--ink)] mb-2 flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-violet-100 text-violet-600 flex items-center justify-center text-xs">4</span>
            开局场景
          </h3>
          <div className="p-3 rounded-lg bg-gray-50 border border-[var(--rule)] text-sm text-[var(--muted)]">
            {content.openingScene.content}
          </div>
          {content.openingScene.choices && content.openingScene.choices.length > 0 && (
            <div className="mt-2 space-y-1">
              {content.openingScene.choices.map((choice, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-100 text-xs text-violet-700"
                >
                  <span className="w-4 h-4 rounded-full bg-violet-200 text-violet-600 flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  {choice.text}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function GeneratePreview({
  generating,
  generatedContent,
  error,
  onGenerate,
  onEnterEditor,
  onBack,
}: GeneratePreviewProps) {
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (!generating && !generatedContent && !error && !hasTriggered.current) {
      hasTriggered.current = true;
      onGenerate();
    }
  }, [generating, generatedContent, error, onGenerate]);

  if (generating) {
    return <LoadingAnimation />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">生成失败</h3>
        <p className="text-sm text-[var(--muted)] mb-4">{error}</p>
        <div className="flex gap-3">
          <button
            onClick={() => onBack(2)}
            className="px-5 py-2 rounded-lg text-sm font-medium border border-[var(--rule)] text-[var(--muted)] hover:border-violet-300 transition-colors"
          >
            返回修改
          </button>
          <button
            onClick={() => {
              hasTriggered.current = false;
              onGenerate();
            }}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 transition-colors"
          >
            重新生成
          </button>
        </div>
      </div>
    );
  }

  if (!generatedContent) {
    return null;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-[var(--ink)] mb-1">生成预览</h2>
      <p className="text-sm text-[var(--muted)] mb-6">
        AI 已为你生成初始内容，你可以进入编辑器进一步调整
      </p>

      <ContentPreview content={generatedContent} />

      <div className="flex justify-between mt-8">
        <button
          onClick={() => onBack(2)}
          className="px-6 py-2.5 rounded-lg text-sm font-medium border border-[var(--rule)] text-[var(--muted)] hover:border-violet-300 hover:text-violet-600 transition-colors"
        >
          返回修改
        </button>
        <button
          onClick={onEnterEditor}
          className="px-6 py-2.5 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 transition-colors"
        >
          进入编辑器
        </button>
      </div>
    </div>
  );
}
