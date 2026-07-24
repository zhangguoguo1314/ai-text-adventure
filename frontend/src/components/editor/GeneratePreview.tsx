'use client';

import { useRef } from 'react';
import { GeneratedContent } from '@/types';

interface GeneratePreviewProps {
  generating: boolean;
  generatedContent: GeneratedContent | null;
  error: string | null;
  onGenerate: () => void;
  onEnterEditor: () => void;
  onBack: (step: number) => void;
  // 新增：生成项和引擎
  generateItems: string[];
  toggleGenerateItem: (item: string) => void;
  engineType: string;
  setEngineType: (v: string) => void;
  title: string;
  instruction: string;
  selectedStyleName: string;
  aiPolish: boolean;
}

// 生成项配置
const GENERATE_ITEMS = [
  { id: 'description', label: '游戏简介与标签', desc: '游戏详情页简介 + 2-5个分类标签', icon: '📋' },
  { id: 'narrativeRules', label: '叙事规则', desc: 'AI在指令基础上整理叙事规则，贯穿游玩全程', icon: '📜' },
  { id: 'themeColor', label: '主题配色', desc: '界面配色方案', icon: '🎨' },
  { id: 'attributes', label: '角色属性', desc: '体力、金钱等数值属性', icon: '📊' },
  { id: 'npcs', label: '预设NPC', desc: '仅从游戏指令中已写明的角色建档，不凭空编造', icon: '👥' },
  { id: 'opening', label: '开场白', desc: '约200-400字，带入第一幕', icon: '🎬' },
  { id: 'charConfig', label: '角色创建配置', desc: '根据世界观设计开局选择项（家世/性格/天赋等）', icon: '⚙️' },
  { id: 'tags', label: '分类标签', desc: '2-5个自动分类标签', icon: '🏷️' },
];

// 生成引擎配置
const ENGINES = [
  { id: 'standard', name: '标准', rate: '0.5x', desc: '标准引擎，叙事轻快、响应快' },
  { id: 'chat', name: '畅聊', rate: '0.35x', desc: '轻量角色扮演·入戏快·超值计费' },
  { id: 'luna', name: '露娜', rate: '0.6x', desc: '创意写作能力优秀' },
  { id: 'expert', name: '专家', rate: '1x', desc: '推理与叙事更细腻' },
];

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
      {content.npcs && content.npcs.length > 0 && (
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
      )}

      {/* Attributes */}
      {content.attributes && content.attributes.length > 0 && (
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
              </span>
            ))}
          </div>
        </div>
      )}

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
  generateItems,
  toggleGenerateItem,
  engineType,
  setEngineType,
  title,
  instruction,
  selectedStyleName,
  aiPolish,
}: GeneratePreviewProps) {
  const hasTriggered = useRef(false);

  // 确认生成按钮点击
  const handleConfirmGenerate = () => {
    if (!hasTriggered.current) {
      hasTriggered.current = true;
      onGenerate();
    }
  };

  // 如果正在生成或已生成或出错，显示对应状态
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

  // 已生成，显示预览
  if (generatedContent) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-[var(--ink)] mb-1">生成预览</h2>
        <p className="text-sm text-[var(--muted)] mb-6">
          AI 已为你生成初始内容，你可以进入编辑器进一步调整
        </p>

        <ContentPreview content={generatedContent} />

        <div className="flex justify-between mt-8">
          <button
            onClick={() => {
              hasTriggered.current = false;
              onBack(2);
            }}
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

  // 确认生成页面（对标UU第三步）
  return (
    <div>
      <h2 className="text-lg font-semibold text-[var(--ink)] mb-1">确认并生成</h2>
      <p className="text-sm text-[var(--muted)] mb-6">
        已根据你的游戏指令预选生成项，可手动调整。未勾选项可在编辑器中补全
      </p>

      {/* 即将创建的信息摘要 */}
      <div className="mb-6 p-4 rounded-lg bg-violet-50 border border-violet-200 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-violet-500">即将创建</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--ink)]">{title}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-600">
            {selectedStyleName}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {aiPolish ? 'AI润色' : '原样指令'}
          </span>
        </div>
        <p className="text-xs text-[var(--muted)] line-clamp-2">{instruction}</p>
      </div>

      {/* 生成引擎选择 */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-[var(--ink)] mb-2">生成引擎</h3>
        <p className="text-xs text-[var(--muted)] mb-3">选择用于生成本剧本的AI引擎</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ENGINES.map(engine => (
            <button
              key={engine.id}
              onClick={() => setEngineType(engine.id)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                engineType === engine.id
                  ? 'border-violet-500 bg-violet-50'
                  : 'border-[var(--rule)] hover:border-violet-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-[var(--ink)]">{engine.name}</span>
                <span className="text-xs text-violet-500">{engine.rate}</span>
              </div>
              <p className="text-xs text-[var(--muted)] line-clamp-1">{engine.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* AI生成项选择 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-[var(--ink)]">AI 生成项</h3>
          <span className="text-xs text-[var(--muted)]">
            已选 {generateItems.length}/{GENERATE_ITEMS.length} 项
          </span>
        </div>
        <p className="text-xs text-[var(--muted)] mb-3">至少保留1项，生成完成后可在编辑器中继续修改</p>

        <div className="space-y-2">
          {GENERATE_ITEMS.map(item => {
            const isSelected = generateItems.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggleGenerateItem(item.id)}
                className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                  isSelected
                    ? 'border-violet-400 bg-violet-50/50'
                    : 'border-[var(--rule)] opacity-60 hover:opacity-100'
                }`}
              >
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--ink)]">{item.label}</span>
                    {isSelected && (
                      <svg className="w-4 h-4 text-violet-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-0.5">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-between mt-8">
        <button
          onClick={() => onBack(2)}
          className="px-6 py-2.5 rounded-lg text-sm font-medium border border-[var(--rule)] text-[var(--muted)] hover:border-violet-300 hover:text-violet-600 transition-colors"
        >
          上一步
        </button>
        <button
          onClick={handleConfirmGenerate}
          disabled={generateItems.length === 0}
          className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            generateItems.length > 0
              ? 'bg-violet-600 text-white hover:bg-violet-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          开始生成
        </button>
      </div>
    </div>
  );
}
