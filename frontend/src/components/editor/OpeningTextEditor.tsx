'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/api';

interface OpeningTextEditorProps {
  scriptId: number;
  initialValue: string;
  onContentChange?: (value: string) => void;
}

/**
 * 开场白文本编辑器
 *
 * openingText 是直接呈现给玩家的第一个场景文本（独立于剧情节点）。
 * - 大文本编辑器
 * - AI 生成按钮
 * - 3 秒防抖自动保存（保存到剧本 openingText 字段）
 * - 字数统计（推荐 200-400 字）
 */
export default function OpeningTextEditor({
  scriptId,
  initialValue,
  onContentChange,
}: OpeningTextEditorProps) {
  const [value, setValue] = useState(initialValue || '');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const charCount = value.length;
  const inRecommendedRange = charCount >= 200 && charCount <= 400;

  const saveContent = useCallback(
    async (content: string) => {
      try {
        setSaving(true);
        setError(null);
        await api.put(`/scripts/${scriptId}`, { openingText: content });
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

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleAiGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res: any = await api.post(`/scripts/${scriptId}/generate-incremental`, {
        items: ['openingText'],
        mergeMode: false,
      });
      const newText =
        res?.data?.openingText ||
        res?.openingText ||
        res?.data?.content ||
        null;
      if (newText) {
        setValue(newText);
        onContentChange?.(newText);
        // 立即保存生成的内容
        await api.put(`/scripts/${scriptId}`, { openingText: newText });
        setLastSaved(new Date());
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'AI 生成失败，请稍后重试');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveNow = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    saveContent(value);
  };

  return (
    <div className="space-y-3">
      {/* 头部 */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-100">开场白</h3>
          <span className="text-xs text-slate-400">|</span>
          <span
            className={`text-xs ${
              inRecommendedRange ? 'text-green-400' : 'text-slate-400'
            }`}
          >
            {charCount} 字 {inRecommendedRange && '(推荐范围)'}
          </span>
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
            <span className="text-xs text-slate-500">推荐 200-400 字</span>
          )}
          <button
            onClick={handleAiGenerate}
            disabled={generating}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:bg-violet-800 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {generating ? 'AI 生成中...' : 'AI 生成'}
          </button>
        </div>
      </div>

      {/* 提示说明 */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-violet-950/40 border border-violet-800/50">
        <svg className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-violet-200/80 leading-relaxed">
          开场白是玩家进入游戏后看到的第一段文本，用于带入第一幕场景。
          请营造氛围、交代初始处境，引导玩家进入故事。（推荐 200-400 字）
        </p>
      </div>

      {error && (
        <div className="px-3 py-2 rounded-lg bg-red-950/40 border border-red-800/50 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* 字数进度条 */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full transition-all ${
              inRecommendedRange
                ? 'bg-green-500'
                : charCount < 200
                ? 'bg-amber-500'
                : 'bg-violet-500'
            }`}
            style={{ width: `${Math.min((charCount / 400) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* 大文本编辑器 */}
      <textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        rows={14}
        className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-sm text-slate-100 resize-y leading-relaxed transition-colors"
        placeholder={`开场白文本...&#10;&#10;夜色如墨，你独自行走在荒凉的官道上。远处偶尔传来几声不知名野兽的嘶吼，寒风裹挟着枯叶从脚边掠过......`}
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
