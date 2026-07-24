'use client';

import { useState, useMemo, useCallback, type ReactNode } from 'react';

/* ===========================================================================
 * 角色创建界面
 * 对标 UU 平台的家世 / 性格 / 特质等开局选择功能。
 * 当剧本模板带有 charConfig 配置时，在开始游戏前展示，让玩家自定义角色。
 * =========================================================================== */

/* ===== 类型定义 ===== */

/** 角色配置对象：字段名 -> 选项数组 */
export interface CharConfig {
  [key: string]: string[];
}

/** 玩家最终选择的角色配置：字段名 -> 选定值（含自定义文本） */
export interface CharacterConfig {
  [key: string]: string;
}

export interface CharacterCreationProps {
  /** 剧本模板的角色配置（origins/spiritualRoots/personalities 等可选字段） */
  charConfig: CharConfig;
  /** 完成角色创建后回调，传递角色配置对象 */
  onComplete: (config: CharacterConfig) => void;
  /** 跳过自定义回调 */
  onSkip: () => void;
  /** 剧本标题（可选，用于头部展示） */
  scriptTitle?: string;
}

/* ===== 字段元数据：已知字段的中文名与图标 ===== */

interface FieldMeta {
  label: string;
  icon: string;
  hint?: string;
}

const FIELD_META: Record<string, FieldMeta> = {
  origins: { label: '家世出身', icon: '🏯', hint: '选择你的出身背景' },
  spiritualRoots: { label: '灵根天赋', icon: '🌿', hint: '决定你的修炼根基' },
  personalities: { label: '性格特质', icon: '🎭', hint: '塑造你的行事风格' },
  talents: { label: '特殊天赋', icon: '⭐', hint: '与生俱来的能力' },
  ambitions: { label: '志向抱负', icon: '🎯', hint: '你追求的终极目标' },
  paths: { label: '修炼道途', icon: '⚔️', hint: '选择你的修行之路' },
  houses: { label: '所属阵营', icon: '🏰', hint: '你效力的势力或学院' },
  bloodStatus: { label: '血脉血统', icon: '🩸', hint: '你的血脉传承' },
  genders: { label: '性别', icon: '⚧', hint: '角色性别' },
  earTypes: { label: '耳型特征', icon: '👂', hint: '独特的外貌特征' },
};

/** 自由文本字段定义：始终渲染为多行输入 */
const TEXT_FIELD_DEFS: {
  key: 'background' | 'appearance';
  label: string;
  icon: string;
  placeholder: string;
  maxLength: number;
  rows: number;
}[] = [
  {
    key: 'background',
    label: '背景故事',
    icon: '📖',
    placeholder: '描述你的角色过往经历、身世渊源、为何踏上这段旅程……',
    maxLength: 300,
    rows: 4,
  },
  {
    key: 'appearance',
    label: '外貌特征',
    icon: '✨',
    placeholder: '描述你的角色外貌、衣着打扮、独特印记……',
    maxLength: 200,
    rows: 3,
  },
];

/* ===== 工具函数 ===== */

/** 将 camelCase key 转为可读中文标题 */
function prettifyKey(key: string): string {
  const spaced = key.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** 从数组中随机取一个元素 */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ===== 图标组件 ===== */

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function DiceIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 7l7-4 7 4v10l-7 4-7-4V7z" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="9" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="9" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ===== 选项卡片 ===== */

interface OptionCardProps {
  option: string;
  selected: boolean;
  onClick: () => void;
}

function OptionCard({ option, selected, onClick }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all duration-200
        ${
          selected
            ? 'border-violet-500 bg-violet-500/15 text-white shadow-lg shadow-violet-500/20'
            : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-violet-500/50 hover:bg-slate-800 hover:text-white'
        }`}
    >
      <span className="block truncate pr-4">{option}</span>
      {selected && (
        <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
          <CheckIcon className="w-2.5 h-2.5 text-white" />
        </span>
      )}
    </button>
  );
}

/* ===== 选择字段区块 ===== */

interface SelectionSectionProps {
  icon: string;
  label: string;
  hint?: string;
  selectedValue?: string;
  children: ReactNode;
}

function SelectionSection({ icon, label, hint, selectedValue, children }: SelectionSectionProps) {
  return (
    <section className="bg-slate-800/30 rounded-2xl border border-slate-700/60 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xl flex-shrink-0" aria-hidden="true">
            {icon}
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-white leading-tight">{label}</h3>
            {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
          </div>
        </div>
        {selectedValue && (
          <span className="flex-shrink-0 text-xs font-medium text-violet-300 bg-violet-500/15 px-2.5 py-1 rounded-full max-w-[40%] truncate">
            {selectedValue}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

/* ===== 主组件 ===== */

export default function CharacterCreation({
  charConfig,
  onComplete,
  onSkip,
  scriptTitle,
}: CharacterCreationProps) {
  // 解析选择类字段（值为非空数组的字段）
  const selectionFields = useMemo(() => {
    return Object.entries(charConfig || {})
      .filter(([, v]) => Array.isArray(v) && v.length > 0)
      .map(([key, options]) => ({
        key,
        options: (options as string[]).filter((o) => o != null && o !== ''),
        meta: FIELD_META[key] || { label: prettifyKey(key), icon: '🔮' },
      }))
      .filter((f) => f.options.length > 0);
  }, [charConfig]);

  const [selections, setSelections] = useState<Record<string, string>>({});
  const [texts, setTexts] = useState<Record<string, string>>({});

  const handleSelect = useCallback((key: string, value: string) => {
    setSelections((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleTextChange = useCallback((key: string, value: string) => {
    setTexts((prev) => ({ ...prev, [key]: value }));
  }, []);

  // 随机选择所有选项字段
  const handleRandom = useCallback(() => {
    const next: Record<string, string> = {};
    for (const f of selectionFields) {
      next[f.key] = pickRandom(f.options);
    }
    setSelections(next);
  }, [selectionFields]);

  // 完成创建
  const handleComplete = useCallback(() => {
    const config: CharacterConfig = { ...selections };
    for (const t of TEXT_FIELD_DEFS) {
      const val = (texts[t.key] || '').trim();
      if (val) config[t.key] = val;
    }
    onComplete(config);
  }, [selections, texts, onComplete]);

  const filledCount = selectionFields.filter((f) => selections[f.key]).length;
  const totalSelections = selectionFields.length;
  const progress = totalSelections > 0 ? Math.round((filledCount / totalSelections) * 100) : 100;
  const hasAnyInput = filledCount > 0 || Object.values(texts).some((v) => v.trim() !== '');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white flex flex-col">
      {/* 头部 */}
      <header className="px-4 sm:px-6 pt-8 pb-4 max-w-3xl w-full mx-auto">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-medium mb-3">
            <span>🧬</span>
            <span>角色创建</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
            缔造你的角色
          </h1>
          {scriptTitle && (
            <p className="text-sm text-slate-400 mt-2">
              即将开启《{scriptTitle}》的冒险之旅
            </p>
          )}

          {/* 进度条 */}
          {totalSelections > 0 && (
            <div className="mt-5 max-w-md mx-auto">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span>已选择 {filledCount} / {totalSelections} 项特质</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-700/70 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 可滚动内容区 */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 pb-32">
        <div className="max-w-3xl w-full mx-auto space-y-4">
          {/* 选择类字段 */}
          {selectionFields.length > 0 ? (
            selectionFields.map((field) => (
              <SelectionSection
                key={field.key}
                icon={field.meta.icon}
                label={field.meta.label}
                hint={field.meta.hint}
                selectedValue={selections[field.key]}
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {field.options.map((option) => (
                    <OptionCard
                      key={option}
                      option={option}
                      selected={selections[field.key] === option}
                      onClick={() => handleSelect(field.key, option)}
                    />
                  ))}
                </div>
              </SelectionSection>
            ))
          ) : (
            <div className="bg-slate-800/30 rounded-2xl border border-slate-700/60 p-6 text-center text-sm text-slate-400">
              当前剧本未提供预设选项，可直接撰写角色背景与外貌。
            </div>
          )}

          {/* 自由文本字段 */}
          {TEXT_FIELD_DEFS.map((t) => (
            <SelectionSection
              key={t.key}
              icon={t.icon}
              label={t.label}
              hint={`选填，最多 ${t.maxLength} 字`}
              selectedValue={texts[t.key]?.trim() ? '已填写' : undefined}
            >
              <textarea
                value={texts[t.key] || ''}
                onChange={(e) => handleTextChange(t.key, e.target.value.slice(0, t.maxLength))}
                placeholder={t.placeholder}
                rows={t.rows}
                maxLength={t.maxLength}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white
                           placeholder:text-slate-500 focus:border-violet-500 focus:outline-none focus:ring-2
                           focus:ring-violet-500/30 resize-none transition-colors"
              />
              <div className="mt-1.5 text-right text-xs text-slate-500">
                {(texts[t.key] || '').length} / {t.maxLength}
              </div>
            </SelectionSection>
          ))}
        </div>
      </main>

      {/* 底部操作栏 */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-slate-900/95 backdrop-blur border-t border-slate-700/70">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onSkip}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white
                       hover:bg-slate-800 transition-colors flex-shrink-0"
          >
            跳过自定义
          </button>

          {totalSelections > 0 && (
            <button
              type="button"
              onClick={handleRandom}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium
                         border border-slate-600 text-slate-200 hover:border-violet-500/60 hover:text-violet-300
                         hover:bg-violet-500/10 transition-colors flex-shrink-0"
            >
              <DiceIcon className="w-4 h-4" />
              <span className="hidden sm:inline">随机生成</span>
              <span className="sm:hidden">随机</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleComplete}
            disabled={!hasAnyInput}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white
                       bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500
                       shadow-lg shadow-violet-600/30 transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
                       flex items-center justify-center gap-2"
          >
            <span>开始冒险</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
