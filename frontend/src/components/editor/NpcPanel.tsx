'use client';

import { useState } from 'react';
import { ScriptNpc } from '@/types';
import api from '@/lib/api';

interface NpcPanelProps {
  scriptId: number;
  npcs: ScriptNpc[];
  onRefresh: () => void;
}

export default function NpcPanel({ scriptId, npcs, onRefresh }: NpcPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [personality, setPersonality] = useState('');
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setName('');
    setPersonality('');
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (npc: ScriptNpc) => {
    setEditingId(npc.id);
    setName(npc.name);
    setPersonality(npc.personality);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/scripts/${scriptId}/npcs/${editingId}`, {
          name: name.trim(),
          personality: personality.trim(),
        });
      } else {
        await api.post(`/scripts/${scriptId}/npcs`, {
          name: name.trim(),
          personality: personality.trim(),
        });
      }
      resetForm();
      onRefresh();
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (npcId: number) => {
    if (!confirm('确定删除此 NPC？')) return;
    try {
      await api.delete(`/scripts/${scriptId}/npcs/${npcId}`);
      onRefresh();
    } catch {
      // handle error
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--ink)]">NPC 角色</h3>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="text-xs text-violet-600 hover:text-violet-700 font-medium"
        >
          + 添加
        </button>
      </div>

      {showForm && (
        <div className="mb-4 p-4 rounded-lg border border-violet-200 bg-violet-50">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[var(--ink)] mb-1">角色名称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                className="w-full px-3 py-2 rounded-lg border border-[var(--rule)] text-sm focus:border-violet-500 outline-none"
                placeholder="输入角色名称"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ink)] mb-1">性格描述</label>
              <textarea
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                maxLength={200}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-[var(--rule)] text-sm focus:border-violet-500 outline-none resize-none"
                placeholder="描述角色的性格特征..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={resetForm}
                className="px-3 py-1.5 rounded-lg text-xs border border-[var(--rule)] text-[var(--muted)] hover:border-violet-300"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                className="px-3 py-1.5 rounded-lg text-xs bg-violet-600 text-white hover:bg-violet-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {npcs.length === 0 && !showForm && (
        <p className="text-sm text-[var(--muted)] text-center py-4">
          暂无 NPC，点击上方添加
        </p>
      )}

      <div className="space-y-2">
        {npcs.map((npc) => (
          <div
            key={npc.id}
            className="flex items-start justify-between p-3 rounded-lg border border-[var(--rule)] hover:border-violet-200 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-[var(--ink)]">{npc.name}</div>
              {npc.personality && (
                <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2">{npc.personality}</p>
              )}
            </div>
            <div className="flex gap-1 flex-shrink-0 ml-2">
              <button
                onClick={() => startEdit(npc)}
                className="p-1 rounded text-[var(--muted)] hover:text-violet-600 hover:bg-violet-50 transition-colors"
                title="编辑"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => handleDelete(npc.id)}
                className="p-1 rounded text-[var(--muted)] hover:text-red-600 hover:bg-red-50 transition-colors"
                title="删除"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
