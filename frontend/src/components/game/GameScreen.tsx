'use client';

import { useEffect, useState } from 'react';
import { useGameEngine } from '@/lib/useGameEngine';
import GameHeader from '@/components/game/GameHeader';
import NarrativeText from '@/components/game/NarrativeText';
import ChoiceButtons from '@/components/game/ChoiceButtons';
import FreeInput from '@/components/game/FreeInput';
import AttributePanel from '@/components/game/AttributePanel';
import SaveLoadPanel from '@/components/game/SaveLoadPanel';

interface GameScreenProps {
  sessionId: string;
  scriptTitle?: string;
}

export default function GameScreen({ sessionId, scriptTitle }: GameScreenProps) {
  const {
    narrative,
    narratives,
    choices,
    isLoading,
    attributes,
    error,
    sendAction,
    getSaves,
    saveGame,
    setError,
    cleanup,
  } = useGameEngine(sessionId);

  const [saves, setSaves] = useState<any[]>([]);

  // 加载存档列表
  const refreshSaves = async () => {
    const list = await getSaves();
    setSaves(list);
  };

  // 处理选择
  const handleChoice = (choice: string, index: number) => {
    sendAction(choice, String(index));
  };

  // 处理自由输入
  const handleFreeInput = (action: string) => {
    sendAction(action);
  };

  // 清理
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 
                    text-white flex flex-col">
      {/* 顶部栏 */}
      <GameHeader
        title={scriptTitle || 'AI 文字冒险'}
        onSavePanel={
          <SaveLoadPanel
            saves={saves}
            onSave={async (desc) => {
              await saveGame(desc);
              await refreshSaves();
            }}
            onRefresh={refreshSaves}
          />
        }
      />

      {/* 主要游戏区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 叙事历史 */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-16 py-6 scrollbar-thin">
          {/* 历史叙事 */}
          {narratives.map((n, i) => (
            <NarrativeText key={i} content={n.content} />
          ))}

          {/* 当前叙事（流式） */}
          <NarrativeText content={narrative} isStreaming={isLoading} />

          {/* 错误提示 */}
          {error && (
            <div className="mt-4 p-4 rounded-lg bg-red-900/30 border border-red-700/50 text-red-300">
              {error}
            </div>
          )}

          {/* Loading 动画 */}
          {isLoading && !narrative && (
            <div className="flex items-center gap-2 text-slate-500 mt-4">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm ml-2">正在生成故事...</span>
            </div>
          )}
        </div>

        {/* 底部操作区域 */}
        <div className="px-4 md:px-8 lg:px-16 pb-6 space-y-4">
          {/* 选项按钮 */}
          {choices.length > 0 && !isLoading && (
            <ChoiceButtons choices={choices} onSelect={handleChoice} />
          )}

          {/* 自由输入 */}
          {!isLoading && (
            <FreeInput onSubmit={handleFreeInput} />
          )}
        </div>
      </div>

      {/* 属性面板 */}
      <AttributePanel attributes={attributes} />
    </div>
  );
}
