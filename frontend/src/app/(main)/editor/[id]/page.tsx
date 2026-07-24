'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ScriptEditor from '@/components/editor/ScriptEditor';
import WorldEditor from '@/components/editor/WorldEditor';
import NpcPanel from '@/components/editor/NpcPanel';
import AttributePanel from '@/components/editor/AttributePanel';
import NodeEditor from '@/components/editor/NodeEditor';
import AiImageGenerator from '@/components/editor/AiImageGenerator';
import LogicConfigPanel from '@/components/editor/LogicConfigPanel';
import api from '@/lib/api';
import { ScriptNpc, ScriptAttribute, ScriptNode } from '@/types';

type TabKey = 'world' | 'npcs' | 'attributes' | 'nodes' | 'logic';

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
    { key: 'logic', label: '剧本逻辑' },
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
      <div
        className={`rounded-xl shadow-sm border p-6 min-h-[60vh] ${
          activeTab === 'logic'
            ? 'bg-slate-950 border-slate-800'
            : 'bg-white border-[var(--rule)]'
        }`}
      >
        {activeTab === 'world' && (
          <div className="space-y-6">
            <CoverSection
              scriptId={scriptId}
              title={scriptData.title}
              desc={scriptData.desc || ''}
              category={scriptData.category || 'adventure'}
              cover={scriptData.cover || null}
              onSaved={refetchScript}
            />
            <WorldEditor scriptId={scriptId} initialValue={scriptData.worldSetting || ''} />
          </div>
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
        {activeTab === 'logic' && (
          <LogicConfigPanel
            scriptId={scriptId}
            scriptData={scriptData}
            onRefreshScript={refetchScript}
          />
        )}
      </div>
    </div>
  );
}

/* ===== 剧本封面区块（含 AI 生成） ===== */

interface CoverSectionProps {
  scriptId: number;
  title: string;
  desc: string;
  category: string;
  cover: string | null;
  onSaved: () => void;
}

function CoverSection({ scriptId, title, desc, category, cover, onSaved }: CoverSectionProps) {
  const [showGen, setShowGen] = useState(false);

  const handleApply = async (url: string) => {
    try {
      await api.put(`/scripts/${scriptId}`, { cover: url });
      setShowGen(false);
      onSaved();
    } catch {
      // 保存失败
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--ink)]">剧本封面</h3>
        {!showGen && (
          <button
            onClick={() => setShowGen(true)}
            className="inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.456-2.456L14.25 6l1.035-.259a3.375 3.375 0 002.456-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
            </svg>
            AI 生成封面
          </button>
        )}
      </div>

      {/* 当前封面预览 */}
      {cover && !showGen && (
        <div className="flex justify-center p-3 rounded-lg bg-[var(--bg3)] border border-[var(--rule)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt="剧本封面"
            className="w-full max-w-sm aspect-[2/1] object-cover rounded-lg border border-[var(--rule)] shadow-sm"
          />
        </div>
      )}

      {!cover && !showGen && (
        <div className="flex justify-center items-center w-full max-w-sm aspect-[2/1] mx-auto rounded-lg bg-[var(--bg3)] border border-dashed border-[var(--rule)] text-[var(--muted)] text-sm">
          暂无封面
        </div>
      )}

      {/* AI 生成封面 */}
      {showGen && (
        <div className="p-4 rounded-lg border border-violet-200 bg-violet-50">
          <AiImageGenerator
            type="cover"
            inputData={{ title, desc, category }}
            onGenerated={handleApply}
          />
          <button
            onClick={() => setShowGen(false)}
            className="mt-2 text-xs text-[var(--muted)] hover:text-violet-600"
          >
            收起
          </button>
        </div>
      )}
    </div>
  );
}
