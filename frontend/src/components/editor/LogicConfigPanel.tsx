'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { ScriptLogicConfig, CharacterCreationConfig } from '@/types';
import NarrativeRulesEditor from './NarrativeRulesEditor';
import OpeningTextEditor from './OpeningTextEditor';
import CharacterConfigEditor from './CharacterConfigEditor';
import StoryArcEditor from './StoryArcEditor';
import EndingConditionEditor from './EndingConditionEditor';
import EventChainEditor from './EventChainEditor';

interface LogicConfigPanelProps {
  scriptId: number;
  scriptData: any;
  onRefreshScript: () => void;
}

type SubTabKey =
  | 'narrative'
  | 'character'
  | 'arcs'
  | 'endings'
  | 'events'
  | 'opening';

/** 默认逻辑配置（后端未初始化时使用） */
function createDefaultLogicConfig(): ScriptLogicConfig {
  return {
    eventChains: [],
    endingTriggers: [],
    storyArcs: [],
    npcTriggerConfig: [],
    customRules: '',
    characterCreation: {
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
    },
    attributeThresholds: [],
  };
}

/**
 * 剧本逻辑配置整合面板
 *
 * 将叙事规则、角色创建、故事章节、结局配置、事件链、开场白
 * 整合到一个面板中，使用子 Tab 切换。
 * - 子Tab：叙事规则 | 角色创建 | 故事章节 | 结局配置 | 事件链 | 开场白
 * - 顶部显示"剧本逻辑配置"标题和说明
 * - 底部有"AI一键生成全部逻辑"按钮
 */
export default function LogicConfigPanel({
  scriptId,
  scriptData,
  onRefreshScript,
}: LogicConfigPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTabKey>('narrative');
  const [logicConfig, setLogicConfig] = useState<ScriptLogicConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [genSuccess, setGenSuccess] = useState<string | null>(null);
  // 用于在 AI 生成后强制子组件重新挂载以获取最新数据
  const [refreshKey, setRefreshKey] = useState(0);

  /* ===== 拉取逻辑配置 ===== */
  const fetchLogic = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get(`/scripts/${scriptId}/logic`);
      setLogicConfig(res?.data || createDefaultLogicConfig());
    } catch {
      // 后端可能尚未初始化逻辑配置，使用默认值
      setLogicConfig(createDefaultLogicConfig());
    } finally {
      setLoading(false);
    }
  }, [scriptId]);

  // 初始加载（loading 已通过 useState 初始化为 true，effect 内不同步调用 setState）
  useEffect(() => {
    let cancelled = false;
    api
      .get(`/scripts/${scriptId}/logic`)
      .then((res: any) => {
        if (!cancelled) setLogicConfig(res?.data || createDefaultLogicConfig());
      })
      .catch(() => {
        if (!cancelled) setLogicConfig(createDefaultLogicConfig());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [scriptId]);

  /* ===== AI 一键生成全部逻辑 ===== */
  const handleAiGenerateAll = async () => {
    if (!confirm('将使用 AI 重新生成全部逻辑配置（事件链/结局/章节/角色创建等），现有配置可能被覆盖。是否继续？')) {
      return;
    }
    setGenerating(true);
    setGenError(null);
    setGenSuccess(null);
    try {
      await api.post(`/scripts/${scriptId}/generate-incremental`, {
        items: ['logicConfig', 'narrativeRules', 'openingText', 'charConfig', 'storyArcs', 'endings', 'eventChains'],
        mergeMode: false,
      });
      // 重新拉取逻辑配置和剧本数据
      await fetchLogic();
      onRefreshScript();
      setRefreshKey((k) => k + 1);
      setGenSuccess('AI 生成完成，请检查各项配置');
    } catch (err: any) {
      setGenError(err.response?.data?.message || 'AI 生成失败，请稍后重试');
    } finally {
      setGenerating(false);
    }
  };

  /* ===== 子 Tab 配置 ===== */
  const subTabs: { key: SubTabKey; label: string; icon: string }[] = [
    { key: 'narrative', label: '叙事规则', icon: '📖' },
    { key: 'character', label: '角色创建', icon: '🎭' },
    { key: 'arcs', label: '故事章节', icon: '🗺️' },
    { key: 'endings', label: '结局配置', icon: '🏁' },
    { key: 'events', label: '事件链', icon: '🔗' },
    { key: 'opening', label: '开场白', icon: '🎬' },
  ];

  /* ===== 加载中 ===== */
  if (loading || !logicConfig) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-violet-400 text-sm">加载逻辑配置...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 顶部标题与说明 */}
      <div className="rounded-xl bg-gradient-to-br from-violet-950/60 to-slate-900 border border-violet-800/40 p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-600/20 border border-violet-600/40 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">剧本逻辑配置</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-2xl">
                剧本自产系统的核心配置区。通过可视化配置定义叙事规则、角色创建、
                故事章节、结局触发器和事件链，让 AI 在结构化骨架上自由演绎。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 子 Tab 导航 */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-700 pb-px">
        {subTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeSubTab === tab.key
                ? 'border-violet-500 text-violet-300'
                : 'border-transparent text-slate-400 hover:text-violet-300'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* 子 Tab 内容 —— 全部保持挂载以保留编辑状态，用 hidden 控制显隐 */}
      <div className="rounded-xl bg-slate-900/50 border border-slate-700/60 p-5 min-h-[400px]">
        <div className={activeSubTab === 'narrative' ? '' : 'hidden'}>
          <NarrativeRulesEditor
            key={`narrative-${refreshKey}`}
            scriptId={scriptId}
            initialValue={scriptData?.narrativeRules || ''}
          />
        </div>

        <div className={activeSubTab === 'character' ? '' : 'hidden'}>
          <CharacterConfigEditor
            key={`character-${refreshKey}`}
            scriptId={scriptId}
            initialConfig={
              (logicConfig.characterCreation as CharacterCreationConfig) ||
              createDefaultLogicConfig().characterCreation
            }
            onSaved={fetchLogic}
          />
        </div>

        <div className={activeSubTab === 'arcs' ? '' : 'hidden'}>
          <StoryArcEditor
            key={`arcs-${refreshKey}`}
            scriptId={scriptId}
            initialArcs={logicConfig.storyArcs || []}
            onSaved={fetchLogic}
          />
        </div>

        <div className={activeSubTab === 'endings' ? '' : 'hidden'}>
          <EndingConditionEditor
            key={`endings-${refreshKey}`}
            scriptId={scriptId}
            initialEndings={logicConfig.endingTriggers || []}
            onSaved={fetchLogic}
          />
        </div>

        <div className={activeSubTab === 'events' ? '' : 'hidden'}>
          <EventChainEditor
            key={`events-${refreshKey}`}
            scriptId={scriptId}
            initialChains={logicConfig.eventChains || []}
            onSaved={fetchLogic}
          />
        </div>

        <div className={activeSubTab === 'opening' ? '' : 'hidden'}>
          <OpeningTextEditor
            key={`opening-${refreshKey}`}
            scriptId={scriptId}
            initialValue={scriptData?.openingText || ''}
          />
        </div>
      </div>

      {/* AI 生成反馈 */}
      {genError && (
        <div className="px-3 py-2 rounded-lg bg-red-950/40 border border-red-800/50 text-xs text-red-300">
          {genError}
        </div>
      )}
      {genSuccess && (
        <div className="px-3 py-2 rounded-lg bg-green-950/40 border border-green-800/50 text-xs text-green-300">
          {genSuccess}
        </div>
      )}

      {/* 底部：AI 一键生成 */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <p className="text-xs text-slate-500">
          提示：AI 生成会根据现有世界观和叙事规则，自动填充各项逻辑配置
        </p>
        <button
          onClick={handleAiGenerateAll}
          disabled={generating}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-900/30"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          {generating ? 'AI 生成中...' : 'AI 一键生成全部逻辑'}
        </button>
      </div>
    </div>
  );
}
