'use client';

import { useState } from 'react';
import { ScriptNode, NodeChoice } from '@/types';
import api from '@/lib/api';

interface NodeEditorProps {
  scriptId: number;
  nodes: ScriptNode[];
  onRefresh: () => void;
}

const typeLabels: Record<string, string> = {
  scene: '场景',
  choice: '选择',
  condition: '条件',
  preset: '预设',
};

const typeColors: Record<string, string> = {
  scene: 'bg-blue-100 text-blue-700',
  choice: 'bg-violet-100 text-violet-700',
  condition: 'bg-amber-100 text-amber-700',
  preset: 'bg-green-100 text-green-700',
};

function parseChoices(choicesStr: string | null): NodeChoice[] {
  if (!choicesStr) return [];
  try {
    return JSON.parse(choicesStr);
  } catch {
    return [];
  }
}

export default function NodeEditor({ scriptId, nodes, onRefresh }: NodeEditorProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newType, setNewType] = useState('scene');
  const [newContent, setNewContent] = useState('');
  const [newChoices, setNewChoices] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!newContent.trim()) return;
    setSaving(true);
    try {
      const payload: any = {
        type: newType,
        content: newContent.trim(),
      };
      if (newType === 'scene' && newChoices.trim()) {
        payload.choices = newChoices.trim();
      }
      await api.post(`/scripts/${scriptId}/nodes`, payload);
      setNewContent('');
      setNewChoices('');
      setShowAddForm(false);
      onRefresh();
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (nodeId: number) => {
    if (!confirm('确定删除此节点？')) return;
    try {
      await api.delete(`/scripts/${scriptId}/nodes/${nodeId}`);
      onRefresh();
    } catch {
      // handle error
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--ink)]">剧情节点</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-xs text-violet-600 hover:text-violet-700 font-medium"
        >
          {showAddForm ? '取消' : '+ 添加节点'}
        </button>
      </div>

      {showAddForm && (
        <div className="mb-4 p-4 rounded-lg border border-violet-200 bg-violet-50">
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="w-32">
                <label className="block text-xs font-medium text-[var(--ink)] mb-1">节点类型</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full px-2 py-1.5 rounded border border-[var(--rule)] text-sm focus:border-violet-500 outline-none bg-white"
                >
                  <option value="scene">{typeLabels.scene}</option>
                  <option value="choice">{typeLabels.choice}</option>
                  <option value="condition">{typeLabels.condition}</option>
                  <option value="preset">{typeLabels.preset}</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ink)] mb-1">节点内容</label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-lg border border-[var(--rule)] text-sm focus:border-violet-500 outline-none resize-none"
                placeholder="描述场景内容..."
              />
            </div>
            {newType === 'scene' && (
              <div>
                <label className="block text-xs font-medium text-[var(--ink)] mb-1">
                  选项列表 (JSON，可选)
                </label>
                <textarea
                  value={newChoices}
                  onChange={(e) => setNewChoices(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--rule)] text-sm focus:border-violet-500 outline-none resize-none font-mono"
                  placeholder={'[{"text": "选项1", "nextNodeId": null}]'}
                />
              </div>
            )}
            <div className="flex justify-end">
              <button
                onClick={handleAdd}
                disabled={saving || !newContent.trim()}
                className="px-3 py-1.5 rounded-lg text-xs bg-violet-600 text-white hover:bg-violet-700 disabled:bg-gray-300"
              >
                {saving ? '创建中...' : '创建节点'}
              </button>
            </div>
          </div>
        </div>
      )}

      {nodes.length === 0 && !showAddForm && (
        <p className="text-sm text-[var(--muted)] text-center py-4">
          暂无剧情节点，点击上方添加
        </p>
      )}

      <div className="space-y-2">
        {nodes.map((node) => {
          const choices = parseChoices(node.choices);
          const isExpanded = expandedId === node.id;

          return (
            <div
              key={node.id}
              className="border border-[var(--rule)] rounded-lg overflow-hidden hover:border-violet-200 transition-colors"
            >
              <div
                className="flex items-center gap-3 p-3 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : node.id)}
              >
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[node.type] || 'bg-gray-100 text-gray-600'}`}>
                  {typeLabels[node.type] || node.type}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--ink)] truncate">{node.content}</p>
                </div>
                <span className="text-xs text-[var(--muted)]">#{node.id}</span>
                <svg
                  className={`w-4 h-4 text-[var(--muted)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {isExpanded && (
                <div className="border-t border-[var(--rule)] p-3 bg-gray-50">
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-[var(--ink)] mb-1">内容</label>
                    <p className="text-sm text-[var(--muted)] whitespace-pre-line">{node.content}</p>
                  </div>

                  {choices.length > 0 && (
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-[var(--ink)] mb-1">选项列表</label>
                      <div className="space-y-1">
                        {choices.map((choice, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            <span className="w-4 h-4 rounded-full bg-violet-200 text-violet-600 flex items-center justify-center text-[10px] font-bold">
                              {idx + 1}
                            </span>
                            <span className="text-[var(--muted)]">{choice.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {node.condition && (
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-[var(--ink)] mb-1">条件</label>
                      <p className="text-xs font-mono text-[var(--muted)] bg-white p-2 rounded border border-[var(--rule)]">
                        {node.condition}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleDelete(node.id)}
                      className="px-3 py-1 rounded text-xs text-red-500 hover:bg-red-50 transition-colors"
                    >
                      删除节点
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
