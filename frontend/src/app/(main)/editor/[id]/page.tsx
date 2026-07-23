'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ScriptEditor from '@/components/editor/ScriptEditor';
import WorldEditor from '@/components/editor/WorldEditor';
import NpcPanel from '@/components/editor/NpcPanel';
import AttributePanel from '@/components/editor/AttributePanel';
import NodeEditor from '@/components/editor/NodeEditor';
import api from '@/lib/api';
import { ScriptNpc, ScriptAttribute, ScriptNode } from '@/types';

type TabKey = 'world' | 'npcs' | 'attributes' | 'nodes';

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  // New script wizard
  if (id === 'new') {
    return <ScriptEditor />;
  }

  // Existing script editor
  return <ExistingEditor scriptId={Number(id)} />;
}

function ExistingEditor({ scriptId }: { scriptId: number }) {
  const [activeTab, setActiveTab] = useState<TabKey>('world');

  const { data: scriptData, refetch: refetchScript } = useQuery({
    queryKey: ['script', scriptId],
    queryFn: async () => {
      const res: any = await api.get(`/scripts/${scriptId}`);
      return res.data;
    },
    enabled: !isNaN(scriptId),
  });

  const { data: npcsData, refetch: refetchNpcs } = useQuery({
    queryKey: ['script-npcs', scriptId],
    queryFn: async () => {
      const res: any = await api.get(`/scripts/${scriptId}/npcs`);
      return res.data as ScriptNpc[];
    },
    enabled: !isNaN(scriptId),
  });

  const { data: attrsData, refetch: refetchAttrs } = useQuery({
    queryKey: ['script-attrs', scriptId],
    queryFn: async () => {
      const res: any = await api.get(`/scripts/${scriptId}/attributes`);
      return res.data as ScriptAttribute[];
    },
    enabled: !isNaN(scriptId),
  });

  const { data: nodesData, refetch: refetchNodes } = useQuery({
    queryKey: ['script-nodes', scriptId],
    queryFn: async () => {
      const res: any = await api.get(`/scripts/${scriptId}/nodes`);
      return res.data as ScriptNode[];
    },
    enabled: !isNaN(scriptId),
  });

  const refreshAll = () => {
    refetchScript();
    refetchNpcs();
    refetchAttrs();
    refetchNodes();
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'world', label: '世界观' },
    { key: 'npcs', label: 'NPC' },
    { key: 'attributes', label: '属性' },
    { key: 'nodes', label: '节点' },
  ];

  if (!scriptData) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-violet-600 text-sm">加载剧本...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ink)]">{scriptData.title || '剧本编辑器'}</h1>
          {scriptData.status && (
            <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full ${
              scriptData.status === 'draft'
                ? 'bg-gray-100 text-gray-600'
                : scriptData.status === 'published'
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {scriptData.status === 'draft' ? '草稿' : scriptData.status === 'published' ? '已发布' : scriptData.status}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg border border-[var(--rule)] text-sm text-[var(--muted)] hover:border-violet-300 hover:text-violet-600 transition-colors">
            预览
          </button>
          <button className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors">
            保存
          </button>
          <button className="px-4 py-2 rounded-lg bg-[var(--success)] text-white text-sm font-medium hover:opacity-90 transition-colors">
            发布
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-4 border-b border-[var(--rule)]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-violet-600 text-violet-600'
                : 'border-transparent text-[var(--muted)] hover:text-violet-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-[var(--rule)] p-6 min-h-[60vh]">
        {activeTab === 'world' && (
          <WorldEditor scriptId={scriptId} initialValue={scriptData.worldSetting || ''} />
        )}
        {activeTab === 'npcs' && (
          <NpcPanel scriptId={scriptId} npcs={npcsData || []} onRefresh={refetchNpcs} />
        )}
        {activeTab === 'attributes' && (
          <AttributePanel scriptId={scriptId} attributes={attrsData || []} onRefresh={refetchAttrs} />
        )}
        {activeTab === 'nodes' && (
          <NodeEditor scriptId={scriptId} nodes={nodesData || []} onRefresh={refetchNodes} />
        )}
      </div>
    </div>
  );
}
