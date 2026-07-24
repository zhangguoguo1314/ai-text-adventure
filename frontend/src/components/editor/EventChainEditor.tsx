'use client';

import { useState, useCallback, useRef } from 'react';
import api from '@/lib/api';
import type {
  EventChain,
  EventTrigger,
  EventTriggerType,
  EventCondition,
  ConditionType,
  ConditionOperator,
  EventEffect,
  EffectType,
} from '@/types';

interface EventChainEditorProps {
  scriptId: number;
  initialChains: EventChain[];
  onSaved?: () => void;
}

/* ===== 标签映射 ===== */

const TRIGGER_TYPE_LABELS: Record<EventTriggerType, string> = {
  location: '进入地点',
  time: '特定时段',
  chapter: '进入章节',
  attribute: '属性变化',
  flag: '标记变化',
  npc_relation: 'NPC好感度变化',
  choice: '玩家选择',
  turn_count: '回合数',
  custom: '自定义',
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

const EFFECT_TYPE_LABELS: Record<EffectType, string> = {
  attribute_change: '属性变化',
  flag_set: '设置标记',
  npc_relation_change: 'NPC好感度变化',
  karma_change: '善恶值变化',
  item_give: '给予物品',
  item_remove: '移除物品',
  skill_learn: '学习技能',
  location_change: '改变位置',
  time_change: '改变时间',
  chapter_change: '改变章节',
  narrative: '叙事效果',
  combat_start: '触发战斗',
  ending_trigger: '触发结局',
  unlock_choice: '解锁选项',
  lock_choice: '锁定选项',
  custom: '自定义',
};

/* ===== 工具函数 ===== */

function genId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createEmptyChain(): EventChain {
  return {
    id: genId(),
    name: '新事件链',
    description: '',
    trigger: { type: 'location', target: '', operator: 'eq', value: '' },
    conditions: [],
    effects: [],
    onceOnly: true,
    priority: 0,
    enabled: true,
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

function createEmptyEffect(): EventEffect {
  return {
    type: 'narrative',
    target: '',
    value: '',
    description: '',
  };
}

/* ===== 通用输入样式 ===== */
const inputCls =
  'px-2 py-1 rounded border border-slate-600 bg-slate-800 text-xs text-slate-100 focus:border-violet-500 outline-none transition-colors';
const fullInputCls =
  'w-full px-2.5 py-1.5 rounded border border-slate-600 bg-slate-800 text-sm text-slate-100 focus:border-violet-500 outline-none transition-colors';

/* ===== 触发器编辑器 ===== */

interface TriggerEditorProps {
  trigger: EventTrigger;
  onChange: (trigger: EventTrigger) => void;
}

function TriggerEditor({ trigger, onChange }: TriggerEditorProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 p-2 rounded bg-slate-900/50 border border-violet-800/40">
      <span className="text-[11px] text-violet-400 font-medium flex-shrink-0">触发:</span>
      <select
        value={trigger.type}
        onChange={(e) => onChange({ ...trigger, type: e.target.value as EventTriggerType })}
        className={`${inputCls} w-28`}
      >
        {Object.entries(TRIGGER_TYPE_LABELS).map(([val, label]) => (
          <option key={val} value={val}>
            {label}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={trigger.target}
        onChange={(e) => onChange({ ...trigger, target: e.target.value })}
        className={`${inputCls} w-28`}
        placeholder="目标"
      />
      <select
        value={trigger.operator}
        onChange={(e) =>
          onChange({ ...trigger, operator: e.target.value as ConditionOperator })
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
        value={typeof trigger.value === 'object' ? JSON.stringify(trigger.value) : String(trigger.value ?? '')}
        onChange={(e) => {
          const raw = e.target.value;
          let parsed: any = raw;
          if (/^-?\d+$/.test(raw)) parsed = Number(raw);
          onChange({ ...trigger, value: parsed });
        }}
        className={`${inputCls} w-24`}
        placeholder="值"
      />
    </div>
  );
}

/* ===== 条件编辑器 ===== */

interface ConditionEditorProps {
  conditions: EventCondition[];
  onChange: (conditions: EventCondition[]) => void;
}

function ConditionEditor({ conditions, onChange }: ConditionEditorProps) {
  const addCondition = () => onChange([...conditions, createEmptyCondition()]);
  const updateCondition = (idx: number, patch: Partial<EventCondition>) =>
    onChange(conditions.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  const removeCondition = (idx: number) =>
    onChange(conditions.filter((_, i) => i !== idx));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-500">前置条件（全部满足才触发）</span>
        <button
          onClick={addCondition}
          className="text-[11px] text-violet-400 hover:text-violet-300"
        >
          + 添加条件
        </button>
      </div>
      {conditions.length === 0 && (
        <p className="text-[11px] text-slate-600 pl-1">无前置条件（仅凭触发器即可触发）</p>
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
            placeholder="目标"
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
            placeholder="描述（可选）"
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

/* ===== 效果编辑器 ===== */

interface EffectEditorProps {
  effects: EventEffect[];
  onChange: (effects: EventEffect[]) => void;
}

function EffectEditor({ effects, onChange }: EffectEditorProps) {
  const addEffect = () => onChange([...effects, createEmptyEffect()]);
  const updateEffect = (idx: number, patch: Partial<EventEffect>) =>
    onChange(effects.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  const removeEffect = (idx: number) =>
    onChange(effects.filter((_, i) => i !== idx));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-500">触发效果</span>
        <button
          onClick={addEffect}
          className="text-[11px] text-violet-400 hover:text-violet-300"
        >
          + 添加效果
        </button>
      </div>
      {effects.length === 0 && (
        <p className="text-[11px] text-slate-600 pl-1">暂无效果</p>
      )}
      {effects.map((effect, idx) => (
        <div
          key={idx}
          className="flex flex-wrap items-center gap-1.5 p-2 rounded bg-slate-900/50 border border-slate-700"
        >
          <select
            value={effect.type}
            onChange={(e) => updateEffect(idx, { type: e.target.value as EffectType })}
            className={`${inputCls} w-32`}
          >
            {Object.entries(EFFECT_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={effect.target}
            onChange={(e) => updateEffect(idx, { target: e.target.value })}
            className={`${inputCls} w-24`}
            placeholder="目标"
          />
          <input
            type="text"
            value={typeof effect.value === 'object' ? JSON.stringify(effect.value) : String(effect.value ?? '')}
            onChange={(e) => {
              const raw = e.target.value;
              let parsed: any = raw;
              if (/^-?\d+$/.test(raw)) parsed = Number(raw);
              updateEffect(idx, { value: parsed });
            }}
            className={`${inputCls} w-24`}
            placeholder="值"
          />
          <input
            type="text"
            value={effect.description || ''}
            onChange={(e) => updateEffect(idx, { description: e.target.value })}
            className={`${inputCls} flex-1 min-w-[100px]`}
            placeholder="效果描述（供AI叙事）"
          />
          <button
            onClick={() => removeEffect(idx)}
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
 * 事件链编辑器
 *
 * 配置事件链，让创作者定义按条件触发的剧情事件。
 * - 事件链列表
 * - 每个事件链：name、description、trigger、conditions、effects、onceOnly、priority、enabled
 * - 触发器编辑器、条件编辑器、效果编辑器
 * - 保存到 POST/PUT/DELETE /api/scripts/:scriptId/logic/event-chains
 */
export default function EventChainEditor({
  scriptId,
  initialChains,
  onSaved,
}: EventChainEditorProps) {
  const [chains, setChains] = useState<EventChain[]>(initialChains || []);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const originalIdsRef = useRef<Set<string>>(
    new Set((initialChains || []).map((c) => c.id)),
  );

  /* ===== 事件链操作 ===== */

  const addChain = () => {
    const newChain = createEmptyChain();
    setChains([...chains, newChain]);
    setExpandedId(newChain.id);
  };

  const updateChain = (id: string, patch: Partial<EventChain>) => {
    setChains(chains.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const removeChain = async (id: string) => {
    if (!confirm('确定删除此事件链？')) return;
    const isExisting = originalIdsRef.current.has(id);
    setChains(chains.filter((c) => c.id !== id));
    if (isExisting) {
      try {
        await api.delete(`/scripts/${scriptId}/logic/event-chains/${id}`);
        originalIdsRef.current.delete(id);
        onSaved?.();
      } catch {
        setError('删除失败，请稍后重试');
      }
    }
  };

  /* ===== 保存 ===== */

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const currentIds = new Set(chains.map((c) => c.id));
      for (const id of originalIdsRef.current) {
        if (!currentIds.has(id)) {
          try {
            await api.delete(`/scripts/${scriptId}/logic/event-chains/${id}`);
          } catch {
            /* 忽略单个删除错误 */
          }
        }
      }
      for (const chain of chains) {
        if (originalIdsRef.current.has(chain.id)) {
          await api.put(`/scripts/${scriptId}/logic/event-chains/${chain.id}`, {
            updates: chain,
          });
        } else {
          await api.post(`/scripts/${scriptId}/logic/event-chains`, {
            eventChain: chain,
          });
          originalIdsRef.current.add(chain.id);
        }
      }
      setSavedAt(new Date());
      onSaved?.();
    } catch (err: any) {
      setError(err.response?.data?.message || '保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  }, [scriptId, chains, onSaved]);

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-semibold text-slate-100">
          事件链（{chains.length}）
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
            onClick={addChain}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-violet-600 text-violet-300 hover:bg-violet-600 hover:text-white transition-colors"
          >
            + 添加事件链
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
          定义按条件触发的剧情事件。每个事件链包含触发器（何时检查）、
          前置条件（需满足什么）、效果（触发后产生什么变化）。
        </p>
      </div>

      {error && (
        <div className="px-3 py-2 rounded-lg bg-red-950/40 border border-red-800/50 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* 事件链列表 */}
      <div className="space-y-2">
        {chains.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-8 border border-dashed border-slate-700 rounded-lg">
            暂无事件链，点击「添加事件链」开始
          </p>
        )}

        {chains.map((chain) => {
          const isExpanded = expandedId === chain.id;
          return (
            <div
              key={chain.id}
              className={`rounded-lg border bg-slate-800/60 overflow-hidden transition-colors ${
                chain.enabled ? 'border-slate-700' : 'border-slate-800 opacity-60'
              }`}
            >
              {/* 事件链头部 */}
              <div
                className="flex items-center gap-2 p-3 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : chain.id)}
              >
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    chain.enabled ? 'bg-green-500' : 'bg-slate-600'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-slate-100 truncate block">
                    {chain.name}
                  </span>
                  {chain.description && (
                    <span className="text-xs text-slate-500 truncate block">
                      {chain.description}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500">
                  {TRIGGER_TYPE_LABELS[chain.trigger.type]} · P{chain.priority}
                  {chain.onceOnly && ' · 单次'}
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

              {/* 事件链详情 */}
              {isExpanded && (
                <div className="border-t border-slate-700 p-3 space-y-3">
                  {/* 名称 & 描述 */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[11px] text-slate-500 mb-1">事件链名称</label>
                      <input
                        type="text"
                        value={chain.name}
                        onChange={(e) => updateChain(chain.id, { name: e.target.value })}
                        className={fullInputCls}
                        placeholder="如：初遇师父"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">优先级</label>
                      <input
                        type="number"
                        value={chain.priority}
                        onChange={(e) =>
                          updateChain(chain.id, {
                            priority: Number(e.target.value) || 0,
                          })
                        }
                        className={fullInputCls}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">事件描述</label>
                    <textarea
                      value={chain.description}
                      onChange={(e) =>
                        updateChain(chain.id, { description: e.target.value })
                      }
                      rows={2}
                      className={`${fullInputCls} resize-none`}
                      placeholder="描述这个事件链的剧情内容..."
                    />
                  </div>

                  {/* 开关 */}
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={chain.enabled}
                        onChange={(e) =>
                          updateChain(chain.id, { enabled: e.target.checked })
                        }
                        className="w-4 h-4 rounded accent-violet-600"
                      />
                      <span className="text-xs text-slate-300">启用</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={chain.onceOnly}
                        onChange={(e) =>
                          updateChain(chain.id, { onceOnly: e.target.checked })
                        }
                        className="w-4 h-4 rounded accent-violet-600"
                      />
                      <span className="text-xs text-slate-300">仅触发一次</span>
                    </label>
                  </div>

                  {/* 触发器 */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-slate-500">触发器（何时检查此事件）</span>
                    <TriggerEditor
                      trigger={chain.trigger}
                      onChange={(trigger) => updateChain(chain.id, { trigger })}
                    />
                  </div>

                  {/* 条件 */}
                  <ConditionEditor
                    conditions={chain.conditions}
                    onChange={(conditions) => updateChain(chain.id, { conditions })}
                  />

                  {/* 效果 */}
                  <EffectEditor
                    effects={chain.effects}
                    onChange={(effects) => updateChain(chain.id, { effects })}
                  />

                  {/* 删除 */}
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => removeChain(chain.id)}
                      className="px-2 py-1 rounded text-xs text-red-400 hover:bg-red-950/40 transition-colors"
                    >
                      删除事件链
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
