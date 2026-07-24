'use client';

import { useState, useCallback, useRef } from 'react';
import api from '@/lib/api';
import type {
  EndingTrigger,
  EndingType,
  EventCondition,
  ConditionType,
  ConditionOperator,
} from '@/types';

interface EndingConditionEditorProps {
  scriptId: number;
  initialEndings: EndingTrigger[];
  onSaved?: () => void;
}

/* ===== 标签映射 ===== */

const ENDING_TYPE_LABELS: Record<EndingType, string> = {
  good: '好结局',
  bad: '坏结局',
  neutral: '中性结局',
  hidden: '隐藏结局',
  true_ending: '真结局',
  death: '死亡结局',
};

const ENDING_TYPE_COLORS: Record<EndingType, string> = {
  good: 'bg-green-950/50 text-green-300 border-green-700/50',
  bad: 'bg-red-950/50 text-red-300 border-red-700/50',
  neutral: 'bg-slate-800 text-slate-300 border-slate-600',
  hidden: 'bg-purple-950/50 text-purple-300 border-purple-700/50',
  true_ending: 'bg-amber-950/50 text-amber-300 border-amber-700/50',
  death: 'bg-gray-950 text-gray-400 border-gray-700',
};

const CONDITION_TYPE_LABELS: Record<ConditionType, string> = {
  attribute: '属性值',
  flag: '剧情标记',
  npc_relation: 'NPC好感度',
  karma: '善恶值',
  chapter: '章节',
  day: '游戏天数',
  inventory: '物品栏',
  skill: '技能',
  ending: '已达成结局',
  custom: '自定义',
};

const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  eq: '等于 =',
  ne: '不等于 ≠',
  gt: '大于 >',
  lt: '小于 <',
  gte: '大于等于 ≥',
  lte: '小于等于 ≤',
  contains: '包含',
  not_contains: '不包含',
  between: '介于',
  exists: '存在',
};

/* ===== 工具函数 ===== */

function genId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `end_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createEmptyEnding(): EndingTrigger {
  return {
    id: genId(),
    title: '新结局',
    description: '',
    type: 'neutral',
    conditions: [],
    priority: 0,
    narrative: '',
    isHidden: false,
  };
}

function createEmptyCondition(): EventCondition {
  return {
    type: 'attribute',
    target: '',
    operator: 'eq',
    value: '',
    description: '',
  };
}

/* ===== 条件编辑器子组件 ===== */

interface ConditionEditorProps {
  conditions: EventCondition[];
  onChange: (conditions: EventCondition[]) => void;
}

function ConditionEditor({ conditions, onChange }: ConditionEditorProps) {
  const addCondition = () => {
    onChange([...conditions, createEmptyCondition()]);
  };

  const updateCondition = (idx: number, patch: Partial<EventCondition>) => {
    onChange(conditions.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  };

  const removeCondition = (idx: number) => {
    onChange(conditions.filter((_, i) => i !== idx));
  };

  const inputCls =
    'px-2 py-1 rounded border border-slate-600 bg-slate-800 text-xs text-slate-100 focus:border-violet-500 outline-none transition-colors';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-500">触发条件（全部满足时达成）</span>
        <button
          onClick={addCondition}
          className="text-[11px] text-violet-400 hover:text-violet-300"
        >
          + 添加条件
        </button>
      </div>

      {conditions.length === 0 && (
        <p className="text-[11px] text-slate-600 pl-1">暂无条件，结局将无法触发</p>
      )}

      {conditions.map((cond, idx) => (
        <div
          key={idx}
          className="flex flex-wrap items-center gap-1.5 p-2 rounded bg-slate-900/50 border border-slate-700"
        >
          <select
            value={cond.type}
            onChange={(e) => updateCondition(idx, { type: e.target.value as ConditionType })}
            className={`${inputCls} w-28`}
          >
            {Object.entries(CONDITION_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={cond.target}
            onChange={(e) => updateCondition(idx, { target: e.target.value })}
            className={`${inputCls} w-28`}
            placeholder="目标（属性名/标记名/NPC名）"
          />
          <select
            value={cond.operator}
            onChange={(e) =>
              updateCondition(idx, { operator: e.target.value as ConditionOperator })
            }
            className={`${inputCls} w-28`}
          >
            {Object.entries(OPERATOR_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={typeof cond.value === 'object' ? JSON.stringify(cond.value) : String(cond.value ?? '')}
            onChange={(e) => {
              const raw = e.target.value;
              let parsed: any = raw;
              // 尝试解析数字
              if (/^-?\d+$/.test(raw)) parsed = Number(raw);
              updateCondition(idx, { value: parsed });
            }}
            className={`${inputCls} w-24`}
            placeholder="值"
          />
          <input
            type="text"
            value={cond.description || ''}
            onChange={(e) => updateCondition(idx, { description: e.target.value })}
            className={`${inputCls} flex-1 min-w-[100px]`}
            placeholder="条件描述（供AI理解，可选）"
          />
          <button
            onClick={() => removeCondition(idx)}
            className="p-1 text-slate-500 hover:text-red-400 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

/**
 * 结局触发器编辑器
 *
 * 配置结局触发器，让创作者定义什么条件下达成什么结局。
 * - 结局列表
 * - 每个结局：title、description、type、conditions、priority、narrative、isHidden
 * - 条件编辑器
 * - 保存到 POST/PUT/DELETE /api/scripts/:scriptId/logic/endings
 */
export default function EndingConditionEditor({
  scriptId,
  initialEndings,
  onSaved,
}: EndingConditionEditorProps) {
  const [endings, setEndings] = useState<EndingTrigger[]>(initialEndings || []);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // 记录初始从服务器加载的 ID，用于区分新建/已有
  const originalIdsRef = useRef<Set<string>>(
    new Set((initialEndings || []).map((e) => e.id)),
  );

  /* ===== 结局操作 ===== */

  const addEnding = () => {
    const newEnding = createEmptyEnding();
    setEndings([...endings, newEnding]);
    setExpandedId(newEnding.id);
  };

  const updateEnding = (id: string, patch: Partial<EndingTrigger>) => {
    setEndings(endings.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const removeEnding = async (id: string) => {
    if (!confirm('确定删除此结局触发器？')) return;
    const isExisting = originalIdsRef.current.has(id);
    setEndings(endings.filter((e) => e.id !== id));
    if (isExisting) {
      try {
        await api.delete(`/scripts/${scriptId}/logic/endings/${id}`);
        originalIdsRef.current.delete(id);
        onSaved?.();
      } catch {
        setError('删除失败，请稍后重试');
      }
    }
  };

  /* ===== 保存（区分新建/已有） ===== */

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const currentIds = new Set(endings.map((e) => e.id));
      // 删除：原始有但当前没有的
      for (const id of originalIdsRef.current) {
        if (!currentIds.has(id)) {
          try {
            await api.delete(`/scripts/${scriptId}/logic/endings/${id}`);
          } catch {
            /* 忽略单个删除错误 */
          }
        }
      }
      // 新建或更新
      for (const ending of endings) {
        if (originalIdsRef.current.has(ending.id)) {
          await api.put(`/scripts/${scriptId}/logic/endings/${ending.id}`, {
            updates: ending,
          });
        } else {
          await api.post(`/scripts/${scriptId}/logic/endings`, {
            ending,
          });
          originalIdsRef.current.add(ending.id);
        }
      }
      setSavedAt(new Date());
      onSaved?.();
    } catch (err: any) {
      setError(err.response?.data?.message || '保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  }, [scriptId, endings, onSaved]);

  const inputCls =
    'w-full px-2.5 py-1.5 rounded border border-slate-600 bg-slate-800 text-sm text-slate-100 focus:border-violet-500 outline-none transition-colors';

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-semibold text-slate-100">
          结局触发器（{endings.length}）
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
            onClick={addEnding}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-violet-600 text-violet-300 hover:bg-violet-600 hover:text-white transition-colors"
          >
            + 添加结局
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:bg-violet-800 transition-colors"
          >
            保存全部
          </button>
        </div>
      </div>

      {/* 提示 */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-violet-950/40 border border-violet-800/50">
        <svg className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-violet-200/80 leading-relaxed">
          定义结局触发条件。当玩家满足所有条件时，将达成对应结局。
          支持好结局、坏结局、真结局、隐藏结局等多种类型。
        </p>
      </div>

      {error && (
        <div className="px-3 py-2 rounded-lg bg-red-950/40 border border-red-800/50 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* 结局列表 */}
      <div className="space-y-2">
        {endings.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-8 border border-dashed border-slate-700 rounded-lg">
            暂无结局触发器，点击「添加结局」开始
          </p>
        )}

        {endings.map((ending) => {
          const isExpanded = expandedId === ending.id;
          return (
            <div
              key={ending.id}
              className="rounded-lg border border-slate-700 bg-slate-800/60 overflow-hidden"
            >
              {/* 结局头部 */}
              <div
                className="flex items-center gap-2 p-3 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : ending.id)}
              >
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                    ENDING_TYPE_COLORS[ending.type]
                  }`}
                >
                  {ENDING_TYPE_LABELS[ending.type]}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-slate-100 truncate block">
                    {ending.title}
                    {ending.isHidden && (
                      <span className="ml-1.5 text-[10px] text-purple-400">[隐藏]</span>
                    )}
                  </span>
                  {ending.description && (
                    <span className="text-xs text-slate-500 truncate block">
                      {ending.description}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500">
                  {ending.conditions.length} 条件 · P{ending.priority}
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

              {/* 结局详情 */}
              {isExpanded && (
                <div className="border-t border-slate-700 p-3 space-y-3">
                  {/* 标题 & 类型 */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[11px] text-slate-500 mb-1">结局标题</label>
                      <input
                        type="text"
                        value={ending.title}
                        onChange={(e) => updateEnding(ending.id, { title: e.target.value })}
                        className={inputCls}
                        placeholder="如：归隐山林"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">结局类型</label>
                      <select
                        value={ending.type}
                        onChange={(e) =>
                          updateEnding(ending.id, { type: e.target.value as EndingType })
                        }
                        className={inputCls}
                      >
                        {Object.entries(ENDING_TYPE_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 描述 */}
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">结局描述</label>
                    <textarea
                      value={ending.description}
                      onChange={(e) =>
                        updateEnding(ending.id, { description: e.target.value })
                      }
                      rows={2}
                      className={`${inputCls} resize-none`}
                      placeholder="简述达成此结局的情况..."
                    />
                  </div>

                  {/* 条件编辑器 */}
                  <ConditionEditor
                    conditions={ending.conditions}
                    onChange={(conditions) => updateEnding(ending.id, { conditions })}
                  />

                  {/* 优先级 & 隐藏 */}
                  <div className="flex items-center gap-4">
                    <div className="w-28">
                      <label className="block text-[11px] text-slate-500 mb-1">优先级</label>
                      <input
                        type="number"
                        value={ending.priority}
                        onChange={(e) =>
                          updateEnding(ending.id, {
                            priority: Number(e.target.value) || 0,
                          })
                        }
                        className={inputCls}
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer pt-5">
                      <input
                        type="checkbox"
                        checked={ending.isHidden}
                        onChange={(e) =>
                          updateEnding(ending.id, { isHidden: e.target.checked })
                        }
                        className="w-4 h-4 rounded accent-violet-600"
                      />
                      <span className="text-xs text-slate-300">隐藏结局</span>
                    </label>
                  </div>

                  {/* 结局叙事 */}
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">结局叙事文本</label>
                    <textarea
                      value={ending.narrative}
                      onChange={(e) =>
                        updateEnding(ending.id, { narrative: e.target.value })
                      }
                      rows={3}
                      className={`${inputCls} resize-none`}
                      placeholder="达成此结局时的叙事文本..."
                    />
                  </div>

                  {/* 删除 */}
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => removeEnding(ending.id)}
                      className="px-2 py-1 rounded text-xs text-red-400 hover:bg-red-950/40 transition-colors"
                    >
                      删除结局
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
