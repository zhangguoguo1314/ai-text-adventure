'use client';

import { useState, useCallback, useRef } from 'react';
import api from '@/lib/api';
import type { StoryArc } from '@/types';

interface StoryArcEditorProps {
  scriptId: number;
  initialArcs: StoryArc[];
  onSaved?: () => void;
}

/**
 * 故事章节编辑器
 *
 * 管理故事章节和剧情走向。
 * - 章节列表（可拖拽排序）
 * - 每个章节：chapter(章节号)、title(标题)、summary(概述)、keyEvents(关键事件数组)、keyNpcs(重要NPC)、locations(可用地点)
 * - 添加/删除章节
 * - 保存到 PUT /api/scripts/:scriptId/logic/story-arcs
 */
export default function StoryArcEditor({
  scriptId,
  initialArcs,
  onSaved,
}: StoryArcEditorProps) {
  const [arcs, setArcs] = useState<StoryArc[]>(initialArcs || []);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  /* ===== 章节操作 ===== */

  const addArc = () => {
    const nextChapter = arcs.length > 0 ? Math.max(...arcs.map((a) => a.chapter)) + 1 : 1;
    const newArc: StoryArc = {
      chapter: nextChapter,
      title: `第${nextChapter}章`,
      summary: '',
      keyEvents: [],
      keyNpcs: [],
      locations: [],
    };
    setArcs([...arcs, newArc]);
    setExpandedIdx(arcs.length);
  };

  const updateArc = (idx: number, patch: Partial<StoryArc>) => {
    setArcs(arcs.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  };

  const removeArc = (idx: number) => {
    setArcs(arcs.filter((_, i) => i !== idx));
    setExpandedIdx(null);
  };

  /* ===== 拖拽排序 ===== */

  const handleDragStart = (idx: number) => {
    setDragIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };

  const handleDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    const newArcs = [...arcs];
    const [moved] = newArcs.splice(dragIdx, 1);
    newArcs.splice(idx, 0, moved);
    // 重新编号章节
    const renumbered = newArcs.map((a, i) => ({ ...a, chapter: i + 1 }));
    setArcs(renumbered);
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setDragOverIdx(null);
  };

  /* ===== 关键事件 / NPC / 地点操作 ===== */

  const addKeyEvent = (idx: number) => {
    updateArc(idx, { keyEvents: [...arcs[idx].keyEvents, ''] });
  };

  const updateKeyEvent = (arcIdx: number, eventIdx: number, value: string) => {
    const events = [...arcs[arcIdx].keyEvents];
    events[eventIdx] = value;
    updateArc(arcIdx, { keyEvents: events });
  };

  const removeKeyEvent = (arcIdx: number, eventIdx: number) => {
    updateArc(arcIdx, {
      keyEvents: arcs[arcIdx].keyEvents.filter((_, i) => i !== eventIdx),
    });
  };

  /* ===== 保存 ===== */

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      await api.put(`/scripts/${scriptId}/logic/story-arcs`, {
        storyArcs: arcs,
      });
      setSavedAt(new Date());
      onSaved?.();
    } catch (err: any) {
      setError(err.response?.data?.message || '保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  }, [scriptId, arcs, onSaved]);

  const inputCls =
    'w-full px-2.5 py-1.5 rounded border border-slate-600 bg-slate-800 text-sm text-slate-100 focus:border-violet-500 outline-none transition-colors';

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-semibold text-slate-100">
          故事章节（{arcs.length}）
        </h3>
        <div className="flex items-center gap-2">
          {saving && (
            <span className="flex items-center gap-1 text-xs text-violet-300">
              <span className="w-3 h-3 border border-violet-400 border-t-transparent rounded-full animate-spin" />
              保存中...
            </span>
          )}
          {!saving && savedAt && (
            <span className="text-xs text-slate-400">
              已保存 {savedAt.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={addArc}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-violet-600 text-violet-300 hover:bg-violet-600 hover:text-white transition-colors"
          >
            + 添加章节
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:bg-violet-800 transition-colors"
          >
            保存章节
          </button>
        </div>
      </div>

      {/* 提示 */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-violet-950/40 border border-violet-800/50">
        <svg className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-violet-200/80 leading-relaxed">
          定义故事的章节走向和关键事件，帮助 AI 理解整体剧情结构。
          可拖拽章节卡片调整顺序。
        </p>
      </div>

      {error && (
        <div className="px-3 py-2 rounded-lg bg-red-950/40 border border-red-800/50 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* 章节列表 */}
      <div ref={listRef} className="space-y-2">
        {arcs.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-8 border border-dashed border-slate-700 rounded-lg">
            暂无章节，点击「添加章节」开始
          </p>
        )}

        {arcs.map((arc, idx) => {
          const isExpanded = expandedIdx === idx;
          const isDragging = dragIdx === idx;
          const isDragOver = dragOverIdx === idx;
          return (
            <div
              key={idx}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={handleDragEnd}
              className={`rounded-lg border transition-all ${
                isDragging
                  ? 'opacity-40 border-violet-500'
                  : isDragOver
                  ? 'border-violet-500 border-t-2'
                  : 'border-slate-700'
              } bg-slate-800/60`}
            >
              {/* 章节头部（可折叠） */}
              <div
                className="flex items-center gap-2 p-3 cursor-pointer"
                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
              >
                {/* 拖拽手柄 */}
                <span className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 4a1 1 0 110-2 1 1 0 010 2zM7 9a1 1 0 110-2 1 1 0 010 2zM7 14a1 1 0 110-2 1 1 0 010 2zM13 4a1 1 0 110-2 1 1 0 010 2zM13 9a1 1 0 110-2 1 1 0 010 2zM13 14a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </span>
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-600/20 border border-violet-600/40 flex items-center justify-center text-xs font-bold text-violet-300">
                  {arc.chapter}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-slate-100 truncate block">
                    {arc.title || `第${arc.chapter}章`}
                  </span>
                  {arc.summary && (
                    <span className="text-xs text-slate-500 truncate block">
                      {arc.summary}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500">
                  {arc.keyEvents.length} 事件
                </span>
                <svg
                  className={`w-4 h-4 text-slate-500 transition-transform flex-shrink-0 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* 章节详情 */}
              {isExpanded && (
                <div className="border-t border-slate-700 p-3 space-y-3">
                  {/* 标题 */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">章节号</label>
                      <input
                        type="number"
                        value={arc.chapter}
                        onChange={(e) =>
                          updateArc(idx, { chapter: Number(e.target.value) || 1 })
                        }
                        className={inputCls}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] text-slate-500 mb-1">章节标题</label>
                      <input
                        type="text"
                        value={arc.title}
                        onChange={(e) => updateArc(idx, { title: e.target.value })}
                        className={inputCls}
                        placeholder="如：初入江湖"
                      />
                    </div>
                  </div>

                  {/* 概述 */}
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">章节概述</label>
                    <textarea
                      value={arc.summary}
                      onChange={(e) => updateArc(idx, { summary: e.target.value })}
                      rows={2}
                      className={`${inputCls} resize-none`}
                      placeholder="描述本章的主要剧情走向..."
                    />
                  </div>

                  {/* 关键事件 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-slate-500">关键事件</label>
                      <button
                        onClick={() => addKeyEvent(idx)}
                        className="text-[11px] text-violet-400 hover:text-violet-300"
                      >
                        + 添加事件
                      </button>
                    </div>
                    {arc.keyEvents.map((event, eventIdx) => (
                      <div key={eventIdx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />
                        <input
                          type="text"
                          value={event}
                          onChange={(e) => updateKeyEvent(idx, eventIdx, e.target.value)}
                          className={inputCls}
                          placeholder="如：主角觉醒灵根"
                        />
                        <button
                          onClick={() => removeKeyEvent(idx, eventIdx)}
                          className="p-1 text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {arc.keyEvents.length === 0 && (
                      <p className="text-[11px] text-slate-600 pl-3">暂无关键事件</p>
                    )}
                  </div>

                  {/* 重要 NPC & 可用地点 */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">重要 NPC（逗号分隔）</label>
                      <input
                        type="text"
                        value={(arc.keyNpcs || []).join('，')}
                        onChange={(e) =>
                          updateArc(idx, {
                            keyNpcs: e.target.value
                              .split(/[，,]/)
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                        className={inputCls}
                        placeholder="如：师父，师妹"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">可用地点（逗号分隔）</label>
                      <input
                        type="text"
                        value={(arc.locations || []).join('，')}
                        onChange={(e) =>
                          updateArc(idx, {
                            locations: e.target.value
                              .split(/[，,]/)
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                        className={inputCls}
                        placeholder="如：山门，集市"
                      />
                    </div>
                  </div>

                  {/* 删除按钮 */}
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => removeArc(idx)}
                      className="px-2 py-1 rounded text-xs text-red-400 hover:bg-red-950/40 transition-colors"
                    >
                      删除本章
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
