'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/api';

interface NarrativeRulesEditorProps {
  scriptId: number;
  initialValue: string;
  /** 当 AI 润色生成新内容后通知父组件刷新 */
  onContentChange?: (value: string) => void;
}

/**
 * 叙事规则编辑器
 *
 * narrativeRules 是 AI 游玩时贯穿全程遵循的核心规则。
 * - 大文本编辑器（支持 Markdown）
 * - AI 润色按钮：调用增量生成重新生成叙事规则
 * - 3 秒防抖自动保存
 * - 实时字数统计
 */
export default function NarrativeRulesEditor({
  scriptId,
  initialValue,
  onContentChange,
}: NarrativeRulesEditorProps) {
  const [value, setValue] = useState(initialValue || '');
  const [saving, setSaving] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const charCount = value.length;

  const saveContent = useCallback(
    async (content: string) => {
      try {
        setSaving(true);
        setError(null);
        await api.put(`/scripts/${scriptId}/narrative-rules`, {
          narrativeRules: content,
        });
        setLastSaved(new Date());
      } catch {
        setError('自动保存失败，请检查网络后重试');
      } finally {
        setSaving(false);
      }
    },
    [scriptId],
  );

  const handleChange = useCallback(
    (newValue: string) => {
      setValue(newValue);
      onContentChange?.(newValue);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        saveContent(newValue);
      }, 3000);
    },
    [saveContent, onContentChange],
  );

  // 卸载时清除定时器并保存未保存内容
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleAiPolish = async () => {
    setPolishing(true);
    setError(null);
    try {
      const res: any = await api.post(`/scripts/${scriptId}/generate-incremental`, {
        items: ['narrativeRules'],
        mergeMode: false,
      });
      // 增量生成接口可能返回最新内容
      const newRules =
        res?.data?.narrativeRules ||
        res?.narrativeRules ||
        res?.data?.content ||
        null;
      if (newRules) {
        setValue(newRules);
        onContentChange?.(newRules);
        setLastSaved(new Date());
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'AI 润色失败，请稍后重试');
    } finally {
      setPolishing(false);
    }
  };

  const handleSaveNow = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    saveContent(value);
  };

  return (
    <div className="space-y-3">
      {/* 头部：标题 + 状态 + AI 按钮 */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-100">叙事规则</h3>
          <span className="text-xs text-slate-400">|</span>
          <span className="text-xs text-slate-400">{charCount} 字</span>
        </div>
        <div className="flex items-center gap-2">
          {saving && (
            <span className="flex items-center gap-1 text-xs text-violet-300">
              <span className="w-3 h-3 border border-violet-400 border-t-transparent rounded-full animate-spin" />
              保存中...
            </span>
          )}
          {!saving && lastSaved && (
            <span className="text-xs text-slate-400">
              已保存 {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {!saving && !lastSaved && (
            <span className="text-xs text-slate-500">支持 Markdown</span>
          )}
          <button
            onClick={handleAiPolish}
            disabled={polishing}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:bg-violet-800 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            {polishing ? 'AI 润色中...' : 'AI 润色'}
          </button>
        </div>
      </div>

      {/* 提示说明 */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-violet-950/40 border border-violet-800/50">
        <svg className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-violet-200/80 leading-relaxed">
          这是 AI 游玩时遵循的核心规则，贯穿全程。请描述叙事风格、文风约束、特殊机制、
          互动节奏等。AI 会严格依据此规则推进剧情。（建议 200-500 字）
        </p>
      </div>

      {error && (
        <div className="px-3 py-2 rounded-lg bg-red-950/40 border border-red-800/50 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* 大文本编辑器 */}
      <textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        rows={18}
        className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-sm text-slate-100 resize-y font-mono leading-relaxed transition-colors"
        placeholder={`使用 Markdown 描述叙事规则...\n\n## 叙事风格\n- 第二人称沉浸式叙事\n- 文风偏古典武侠\n\n## 核心机制\n- 属性影响选项解锁\n- NPC好感度决定支线走向\n\n## 约束\n- 不可违背世界观设定\n- 战斗需回合制描述`}
      />

      <div className="flex justify-end">
        <button
          onClick={handleSaveNow}
          disabled={saving}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-600 text-slate-300 hover:border-violet-500 hover:text-violet-300 disabled:opacity-50 transition-colors"
        >
          立即保存
        </button>
      </div>
    </div>
  );
}
