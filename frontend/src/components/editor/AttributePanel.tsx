'use client';

import { useState } from 'react';
import { ScriptAttribute } from '@/types';
import api from '@/lib/api';

interface AttributePanelProps {
  scriptId: number;
  attributes: ScriptAttribute[];
  onRefresh: () => void;
}

const typeLabels: Record<string, string> = {
  number: '数值',
  enum: '枚举',
  boolean: '布尔',
};

export default function AttributePanel({ scriptId, attributes, onRefresh }: AttributePanelProps) {
  const [items, setItems] = useState(
    attributes.map((a) => ({
      name: a.name,
      type: a.type,
      minVal: a.minVal ?? '',
      maxVal: a.maxVal ?? '',
      defaultVal: a.defaultVal ?? '',
    })),
  );
  const [saving, setSaving] = useState(false);

  const addItem = () => {
    setItems([
      ...items,
      { name: '', type: 'number' as const, minVal: '', maxVal: '', defaultVal: '' },
    ]);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: string, value: string) => {
    const newItems = [...items];
    (newItems[idx] as any)[field] = value;
    setItems(newItems);
  };

  const handleSave = async () => {
    const validItems = items.filter((a) => a.name.trim());
    if (validItems.length === 0) return;

    setSaving(true);
    try {
      await api.put(`/scripts/${scriptId}/attributes`, {
        attributes: validItems.map((a) => ({
          name: a.name.trim(),
          type: a.type,
          minVal: a.type === 'number' ? (a.minVal ? Number(a.minVal) : null) : null,
          maxVal: a.type === 'number' ? (a.maxVal ? Number(a.maxVal) : null) : null,
          defaultVal: a.defaultVal || null,
        })),
      });
      onRefresh();
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--ink)]">属性定义</h3>
        <button
          onClick={addItem}
          className="text-xs text-violet-600 hover:text-violet-700 font-medium"
        >
          + 添加
        </button>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-[var(--muted)] text-center py-4">
          暂无属性，点击上方添加
        </p>
      )}

      <div className="space-y-3">
        {items.map((attr, idx) => (
          <div key={idx} className="flex items-end gap-2 p-3 rounded-lg border border-[var(--rule)]">
            <div className="flex-1">
              <label className="block text-xs text-[var(--muted)] mb-1">属性名</label>
              <input
                type="text"
                value={attr.name}
                onChange={(e) => updateItem(idx, 'name', e.target.value)}
                className="w-full px-2 py-1.5 rounded border border-[var(--rule)] text-sm focus:border-violet-500 outline-none"
                placeholder="如：勇气"
              />
            </div>
            <div className="w-24">
              <label className="block text-xs text-[var(--muted)] mb-1">类型</label>
              <select
                value={attr.type}
                onChange={(e) => updateItem(idx, 'type', e.target.value)}
                className="w-full px-2 py-1.5 rounded border border-[var(--rule)] text-sm focus:border-violet-500 outline-none bg-white"
              >
                <option value="number">{typeLabels.number}</option>
                <option value="enum">{typeLabels.enum}</option>
                <option value="boolean">{typeLabels.boolean}</option>
              </select>
            </div>
            {attr.type === 'number' && (
              <>
                <div className="w-16">
                  <label className="block text-xs text-[var(--muted)] mb-1">最小</label>
                  <input
                    type="number"
                    value={attr.minVal}
                    onChange={(e) => updateItem(idx, 'minVal', e.target.value)}
                    className="w-full px-2 py-1.5 rounded border border-[var(--rule)] text-sm focus:border-violet-500 outline-none"
                  />
                </div>
                <div className="w-16">
                  <label className="block text-xs text-[var(--muted)] mb-1">最大</label>
                  <input
                    type="number"
                    value={attr.maxVal}
                    onChange={(e) => updateItem(idx, 'maxVal', e.target.value)}
                    className="w-full px-2 py-1.5 rounded border border-[var(--rule)] text-sm focus:border-violet-500 outline-none"
                  />
                </div>
              </>
            )}
            <div className="w-20">
              <label className="block text-xs text-[var(--muted)] mb-1">默认值</label>
              <input
                type="text"
                value={attr.defaultVal}
                onChange={(e) => updateItem(idx, 'defaultVal', e.target.value)}
                className="w-full px-2 py-1.5 rounded border border-[var(--rule)] text-sm focus:border-violet-500 outline-none"
              />
            </div>
            <button
              onClick={() => removeItem(idx)}
              className="p-1.5 rounded text-[var(--muted)] hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {items.length > 0 && (
        <div className="flex justify-end mt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:bg-gray-300"
          >
            {saving ? '保存中...' : '保存属性'}
          </button>
        </div>
      )}
    </div>
  );
}
