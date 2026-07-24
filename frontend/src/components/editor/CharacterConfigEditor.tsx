'use client';

import { useState, useCallback } from 'react';
import api from '@/lib/api';
import type {
  CharacterCreationConfig,
  CharCreationField,
  CustomTextField,
} from '@/types';

interface CharacterConfigEditorProps {
  scriptId: number;
  initialConfig: CharacterCreationConfig;
  onSaved?: () => void;
}

/** 默认配置工厂 */
function createDefaultConfig(): CharacterCreationConfig {
  return {
    fields: [],
    allowCustomText: true,
    customTextFields: [
      {
        key: 'background',
        label: '背景故事',
        icon: '📜',
        maxLength: 300,
        required: false,
        placeholder: '描述你的角色背景故事...',
      },
      {
        key: 'appearance',
        label: '外貌特征',
        icon: '✨',
        maxLength: 200,
        required: false,
        placeholder: '描述你的角色外貌特征...',
      },
    ],
  };
}

/** 常用字段预设 */
const FIELD_PRESETS: Array<Omit<CharCreationField, 'id'>> = [
  { key: 'origins', label: '家世出身', icon: '🏯', options: ['寒门学子', '世家子弟', '江湖浪子', '皇族贵胄'], required: true, allowRandom: true },
  { key: 'personalities', label: '性格特质', icon: '🎭', options: ['沉稳内敛', '热情奔放', '腹黑深沉', '洒脱不羁'], required: true, allowRandom: true },
  { key: 'talents', label: '天赋特长', icon: '⭐', options: ['过目不忘', '天生神力', '医术通神', '机关奇才'], required: false, allowRandom: true },
];

/**
 * 角色创建配置编辑器
 *
 * 让创作者定义开局选择项（家世/性格/天赋等）。
 * - 字段列表管理（添加/删除/编辑）
 * - 选项管理（添加/删除）
 * - 自定义文本字段配置（background/appearance 等）
 * - 预览区：显示角色创建表单的预览效果
 * - 保存到 PUT /api/scripts/:scriptId/logic/character-creation
 */
export default function CharacterConfigEditor({
  scriptId,
  initialConfig,
  onSaved,
}: CharacterConfigEditorProps) {
  const [config, setConfig] = useState<CharacterCreationConfig>(
    initialConfig || createDefaultConfig(),
  );
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  /* ===== 字段操作 ===== */

  const addField = () => {
    const newField: CharCreationField = {
      key: `field_${Date.now()}`,
      label: '新字段',
      icon: '⚙️',
      options: ['选项一', '选项二'],
      required: false,
      allowRandom: true,
    };
    setConfig((c) => ({ ...c, fields: [...c.fields, newField] }));
  };

  const addPresetField = (preset: Omit<CharCreationField, 'id'>) => {
    setConfig((c) => ({
      ...c,
      fields: [...c.fields, { ...preset, key: `${preset.key}_${Date.now()}` }],
    }));
  };

  const updateField = (idx: number, patch: Partial<CharCreationField>) => {
    setConfig((c) => ({
      ...c,
      fields: c.fields.map((f, i) => (i === idx ? { ...f, ...patch } : f)),
    }));
  };

  const removeField = (idx: number) => {
    setConfig((c) => ({ ...c, fields: c.fields.filter((_, i) => i !== idx) }));
  };

  /* ===== 选项操作 ===== */

  const addOption = (fieldIdx: number) => {
    setConfig((c) => ({
      ...c,
      fields: c.fields.map((f, i) =>
        i === fieldIdx ? { ...f, options: [...f.options, '新选项'] } : f,
      ),
    }));
  };

  const updateOption = (fieldIdx: number, optIdx: number, value: string) => {
    setConfig((c) => ({
      ...c,
      fields: c.fields.map((f, i) =>
        i === fieldIdx
          ? { ...f, options: f.options.map((o, j) => (j === optIdx ? value : o)) }
          : f,
      ),
    }));
  };

  const removeOption = (fieldIdx: number, optIdx: number) => {
    setConfig((c) => ({
      ...c,
      fields: c.fields.map((f, i) =>
        i === fieldIdx
          ? { ...f, options: f.options.filter((_, j) => j !== optIdx) }
          : f,
      ),
    }));
  };

  /* ===== 自定义文本字段操作 ===== */

  const addCustomTextField = () => {
    const newField: CustomTextField = {
      key: `text_${Date.now()}`,
      label: '新文本字段',
      icon: '📝',
      maxLength: 200,
      required: false,
      placeholder: '请输入...',
    };
    setConfig((c) => ({
      ...c,
      customTextFields: [...(c.customTextFields || []), newField],
    }));
  };

  const updateCustomTextField = (idx: number, patch: Partial<CustomTextField>) => {
    setConfig((c) => ({
      ...c,
      customTextFields: (c.customTextFields || []).map((f, i) =>
        i === idx ? { ...f, ...patch } : f,
      ),
    }));
  };

  const removeCustomTextField = (idx: number) => {
    setConfig((c) => ({
      ...c,
      customTextFields: (c.customTextFields || []).filter((_, i) => i !== idx),
    }));
  };

  /* ===== 保存 ===== */

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      await api.put(`/scripts/${scriptId}/logic/character-creation`, {
        config,
      });
      setSavedAt(new Date());
      onSaved?.();
    } catch (err: any) {
      setError(err.response?.data?.message || '保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  }, [scriptId, config, onSaved]);

  const inputCls =
    'w-full px-2.5 py-1.5 rounded border border-slate-600 bg-slate-800 text-sm text-slate-100 focus:border-violet-500 outline-none transition-colors';

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-semibold text-slate-100">角色创建配置</h3>
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
            onClick={() => setShowPreview((v) => !v)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-600 text-slate-300 hover:border-violet-500 hover:text-violet-300 transition-colors"
          >
            {showPreview ? '隐藏预览' : '显示预览'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:bg-violet-800 transition-colors"
          >
            保存配置
          </button>
        </div>
      </div>

      {/* 提示 */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-violet-950/40 border border-violet-800/50">
        <svg className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-violet-200/80 leading-relaxed">
          定义玩家开局时的角色选择项。每个字段可配置选项列表，玩家在创建角色时选择。
          支持自定义文本字段（如背景故事、外貌特征）。
        </p>
      </div>

      {error && (
        <div className="px-3 py-2 rounded-lg bg-red-950/40 border border-red-800/50 text-xs text-red-300">
          {error}
        </div>
      )}

      <div className={`grid gap-4 ${showPreview ? 'lg:grid-cols-2' : ''}`}>
        {/* ===== 编辑区 ===== */}
        <div className="space-y-4">
          {/* 全局开关 */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.allowCustomText}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, allowCustomText: e.target.checked }))
                }
                className="w-4 h-4 rounded accent-violet-600"
              />
              <span className="text-xs text-slate-200">允许自定义文本输入</span>
            </label>
          </div>

          {/* 字段列表 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">
                选择字段（{config.fields.length}）
              </span>
              <div className="flex gap-1">
                {FIELD_PRESETS.map((preset) => (
                  <button
                    key={preset.key}
                    onClick={() => addPresetField(preset)}
                    className="px-2 py-0.5 rounded text-[10px] bg-slate-700 text-slate-300 hover:bg-violet-600 hover:text-white transition-colors"
                    title={`快速添加「${preset.label}」`}
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {config.fields.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-4 border border-dashed border-slate-700 rounded-lg">
                暂无字段，点击下方添加
              </p>
            )}

            {config.fields.map((field, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-800/60 border border-slate-700 space-y-2"
              >
                {/* 字段基本信息 */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={field.icon}
                    onChange={(e) => updateField(idx, { icon: e.target.value })}
                    maxLength={4}
                    className="w-12 text-center px-1 py-1.5 rounded border border-slate-600 bg-slate-900 text-sm focus:border-violet-500 outline-none"
                    title="图标 emoji"
                  />
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateField(idx, { label: e.target.value })}
                    maxLength={20}
                    className={inputCls}
                    placeholder="显示名称"
                  />
                  <input
                    type="text"
                    value={field.key}
                    onChange={(e) =>
                      updateField(idx, {
                        key: e.target.value.replace(/[^a-zA-Z0-9_]/g, '_'),
                      })
                    }
                    maxLength={30}
                    className="w-28 px-2 py-1.5 rounded border border-slate-600 bg-slate-900 text-xs text-slate-400 font-mono focus:border-violet-500 outline-none"
                    placeholder="字段键名"
                    title="字段键名（英文）"
                  />
                  <button
                    onClick={() => removeField(idx)}
                    className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-colors flex-shrink-0"
                    title="删除字段"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* 字段属性 */}
                <div className="flex items-center gap-4 pl-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) =>
                        updateField(idx, { required: e.target.checked })
                      }
                      className="w-3.5 h-3.5 rounded accent-violet-600"
                    />
                    <span className="text-[11px] text-slate-400">必选</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.allowRandom}
                      onChange={(e) =>
                        updateField(idx, { allowRandom: e.target.checked })
                      }
                      className="w-3.5 h-3.5 rounded accent-violet-600"
                    />
                    <span className="text-[11px] text-slate-400">允许随机</span>
                  </label>
                </div>

                {/* 选项列表 */}
                <div className="space-y-1.5 pl-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">选项列表</span>
                    <button
                      onClick={() => addOption(idx)}
                      className="text-[11px] text-violet-400 hover:text-violet-300"
                    >
                      + 添加选项
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {field.options.map((opt, optIdx) => (
                      <div
                        key={optIdx}
                        className="group flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border border-slate-700"
                      >
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) =>
                            updateOption(idx, optIdx, e.target.value)
                          }
                          maxLength={20}
                          className="w-20 bg-transparent text-xs text-slate-200 focus:outline-none"
                        />
                        <button
                          onClick={() => removeOption(idx, optIdx)}
                          className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {field.options.length === 0 && (
                      <span className="text-[11px] text-slate-600">无选项</span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={addField}
              className="w-full py-2 rounded-lg border border-dashed border-slate-600 text-xs text-slate-400 hover:border-violet-500 hover:text-violet-400 transition-colors"
            >
              + 添加字段
            </button>
          </div>

          {/* 自定义文本字段 */}
          {config.allowCustomText && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">
                  自定义文本字段（{(config.customTextFields || []).length}）
                </span>
                <button
                  onClick={addCustomTextField}
                  className="text-xs text-violet-400 hover:text-violet-300"
                >
                  + 添加文本字段
                </button>
              </div>

              {(config.customTextFields || []).map((field, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700"
                >
                  <input
                    type="text"
                    value={field.icon}
                    onChange={(e) =>
                      updateCustomTextField(idx, { icon: e.target.value })
                    }
                    maxLength={4}
                    className="w-10 text-center px-1 py-1.5 rounded border border-slate-600 bg-slate-900 text-sm focus:border-violet-500 outline-none"
                  />
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) =>
                      updateCustomTextField(idx, { label: e.target.value })
                    }
                    maxLength={20}
                    className={inputCls}
                    placeholder="字段名称"
                  />
                  <input
                    type="number"
                    value={field.maxLength}
                    onChange={(e) =>
                      updateCustomTextField(idx, {
                        maxLength: Number(e.target.value) || 100,
                      })
                    }
                    className="w-16 px-1 py-1.5 rounded border border-slate-600 bg-slate-900 text-xs text-slate-300 focus:border-violet-500 outline-none"
                    title="最大字数"
                  />
                  <label className="flex items-center gap-1 cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) =>
                        updateCustomTextField(idx, { required: e.target.checked })
                      }
                      className="w-3.5 h-3.5 rounded accent-violet-600"
                    />
                    <span className="text-[11px] text-slate-400">必填</span>
                  </label>
                  <button
                    onClick={() => removeCustomTextField(idx)}
                    className="p-1 rounded text-slate-400 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== 预览区 ===== */}
        {showPreview && (
          <div className="space-y-3">
            <span className="text-xs font-medium text-slate-300">表单预览</span>
            <div className="rounded-lg bg-slate-900/80 border border-slate-700 p-4 space-y-3 max-h-[600px] overflow-y-auto">
              <p className="text-xs text-slate-500 text-center pb-1 border-b border-slate-800">
                —— 玩家将看到如下创建表单 ——
              </p>
              {config.fields.map((field, idx) => (
                <div key={idx} className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-slate-200">
                    <span>{field.icon}</span>
                    {field.label}
                    {field.required && <span className="text-red-400">*</span>}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {field.options.map((opt, optIdx) => (
                      <span
                        key={optIdx}
                        className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs text-slate-300 cursor-pointer hover:border-violet-500 hover:text-violet-300 transition-colors"
                      >
                        {opt}
                      </span>
                    ))}
                    {field.allowRandom && (
                      <span className="px-2.5 py-1 rounded-md bg-violet-950/50 border border-violet-800 text-xs text-violet-300 cursor-pointer">
                        🎲 随机
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {config.allowCustomText &&
                (config.customTextFields || []).map((field, idx) => (
                  <div key={`text-${idx}`} className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-200">
                      <span>{field.icon}</span>
                      {field.label}
                      {field.required && <span className="text-red-400">*</span>}
                    </label>
                    <div className="px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-xs text-slate-500 min-h-[40px]">
                      {field.placeholder}
                    </div>
                  </div>
                ))}
              {config.fields.length === 0 &&
                (!config.allowCustomText ||
                  (config.customTextFields || []).length === 0) && (
                  <p className="text-xs text-slate-600 text-center py-6">
                    暂无配置，添加字段后可预览
                  </p>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
