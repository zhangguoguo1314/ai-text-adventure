'use client';

import { useEffect, useState, useCallback } from 'react';
import { useGameEngine } from '@/lib/useGameEngine';
import GameHeader from '@/components/game/GameHeader';
import TopStatusBar from '@/components/game/TopStatusBar';
import NarrativeText from '@/components/game/NarrativeText';
import ChoiceButtons from '@/components/game/ChoiceButtons';
import FreeInput from '@/components/game/FreeInput';
import AttributePanel from '@/components/game/AttributePanel';
import SaveLoadPanel from '@/components/game/SaveLoadPanel';
import QuickActionBar from '@/components/game/QuickActionBar';
import InventoryPanel from '@/components/game/InventoryPanel';
import SkillPanel from '@/components/game/SkillPanel';
import NpcRelationPanel from '@/components/game/NpcRelationPanel';
import CombatUI from '@/components/game/CombatUI';
import DialogueUI from '@/components/game/DialogueUI';
import EndingScreen from '@/components/game/EndingScreen';
import ItemNotification from '@/components/game/ItemNotification';
import GameEventHandlers from '@/components/game/GameEventHandlers';

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
    // 扩展状态
    worldState,
    inventory,
    skills,
    npcRelations,
    combatState,
    dialogueState,
    endingState,
    itemChanges,
    toasts,
    // 扩展方法
    useItem,
    useSkill,
    combatAction,
    dialogueAction,
    exitCombat,
    exitDialogue,
    exitEnding,
    dismissToast,
    dismissItemChange,
  } = useGameEngine(sessionId);

  const [saves, setSaves] = useState<any[]>([]);

  // 面板开关状态
  const [showInventory, setShowInventory] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const [showNpc, setShowNpc] = useState(false);

  // 加载存档列表
  const refreshSaves = useCallback(async () => {
    const list = await getSaves();
    setSaves(list);
  }, [getSaves]);

  // 处理选择
  const handleChoice = (choice: string, index: number) => {
    sendAction(choice, String(index));
  };

  // 处理自由输入
  const handleFreeInput = useCallback((action: string) => {
    sendAction(action);
  }, [sendAction]);

  // 处理背包物品操作
  const handleUseItem = useCallback((itemId: string) => {
    useItem(itemId);
  }, [useItem]);

  const handleEquipItem = useCallback((itemId: string) => {
    useItem(itemId);
  }, [useItem]);

  const handleDropItem = useCallback((_itemId: string) => {
    // 丢弃物品 - 可以扩展为独立的 API
  }, []);

  // 处理技能使用
  const handleUseSkill = useCallback((skillId: string) => {
    useSkill(skillId);
  }, [useSkill]);

  // 处理 NPC 对话
  const handleTalkTo = useCallback((npcId: string) => {
    setShowNpc(false);
    dialogueAction(npcId);
  }, [dialogueAction]);

  // 处理对话选择
  const handleDialogueChoice = useCallback((choiceIndex: number) => {
    if (dialogueState) {
      dialogueAction(dialogueState.npcId, choiceIndex);
    }
  }, [dialogueState, dialogueAction]);

  // 处理送礼
  const handleSendGift = useCallback((giftId: string) => {
    if (dialogueState) {
      dialogueAction(dialogueState.npcId, undefined, giftId);
    }
  }, [dialogueState, dialogueAction]);

  // 战斗行动
  const handleCombatAttack = useCallback(() => {
    combatAction('attack');
  }, [combatAction]);

  const handleCombatDefend = useCallback(() => {
    combatAction('defend');
  }, [combatAction]);

  const handleCombatUseSkill = useCallback((skillId: string) => {
    combatAction('skill', skillId);
  }, [combatAction]);

  const handleCombatUseItem = useCallback((itemId: string) => {
    combatAction('item', itemId);
  }, [combatAction]);

  const handleCombatFlee = useCallback(() => {
    combatAction('flee');
  }, [combatAction]);

  // 结局操作
  const handleRestart = useCallback(() => {
    exitEnding();
    sendAction('restart');
  }, [exitEnding, sendAction]);

  const handleBackToLobby = useCallback(() => {
    exitEnding();
    window.location.href = '/';
  }, [exitEnding]);

  // 地图操作（占位）
  const handleOpenMap = useCallback(() => {
    // 可以扩展为地图弹窗
  }, []);

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

      {/* 状态栏 */}
      <TopStatusBar worldState={worldState} />

      {/* 主要游戏区域 */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* 叙事历史 + 战斗/对话覆盖层 */}
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

          {/* 战斗界面 */}
          {combatState.active && combatState.enemy && combatState.player && (
            <div className="mt-6">
              <CombatUI
                enemy={combatState.enemy}
                player={combatState.player}
                skills={skills
                  .filter((s) => s.type === 'combat')
                  .map((s) => ({
                    id: s.id,
                    name: s.name,
                    emoji: s.emoji,
                    mpCost: s.mpCost || 0,
                    description: s.description,
                  }))}
                items={inventory
                  .filter((item) => item.type === 'consumable')
                  .map((item) => ({
                    id: item.id,
                    name: item.name,
                    emoji: item.emoji,
                    healAmount: item.bonus?.HP || item.bonus?.hp,
                    description: item.description,
                  }))}
                combatLog={combatState.log}
                onAttack={handleCombatAttack}
                onDefend={handleCombatDefend}
                onUseSkill={handleCombatUseSkill}
                onUseItem={handleCombatUseItem}
                onFlee={handleCombatFlee}
                result={combatState.result}
                reward={combatState.reward}
              />
            </div>
          )}

          {/* 对话界面 */}
          {dialogueState && dialogueState.active && (
            <div className="mt-6">
              <DialogueUI
                dialogue={{
                  npcId: dialogueState.npcId,
                  npcName: dialogueState.npcName,
                  npcAvatar: dialogueState.npcAvatar,
                  relationLevel: dialogueState.relationLevel,
                  text: dialogueState.text,
                  choices: dialogueState.choices,
                  giftItems: dialogueState.giftItems,
                }}
                onSelectChoice={handleDialogueChoice}
                onSendGift={handleSendGift}
                onEndDialogue={exitDialogue}
              />
            </div>
          )}

          {/* 结局画面 */}
          {endingState && endingState.active && (
            <EndingScreen
              title={endingState.title}
              description={endingState.description}
              endingType={endingState.type}
              stats={endingState.stats}
              onRestart={handleRestart}
              onBackToLobby={handleBackToLobby}
            />
          )}
        </div>

        {/* 底部操作区域 */}
        <div className="px-4 md:px-8 lg:px-16 pb-4 space-y-3">
          {/* 选项按钮 */}
          {choices.length > 0 && !isLoading && !combatState.active && !dialogueState?.active && (
            <ChoiceButtons choices={choices} onSelect={handleChoice} />
          )}

          {/* 快捷操作栏 */}
          {!combatState.active && !dialogueState?.active && !endingState?.active && (
            <QuickActionBar
              inventoryCount={inventory.length}
              skillCount={skills.length}
              npcCount={npcRelations.length}
              currentLocation={worldState.location || '未知之地'}
              onOpenInventory={() => setShowInventory(true)}
              onOpenSkills={() => setShowSkills(true)}
              onOpenNpc={() => setShowNpc(true)}
              onOpenMap={handleOpenMap}
              disabled={isLoading}
            />
          )}

          {/* 自由输入 */}
          {!isLoading && !combatState.active && !dialogueState?.active && !endingState?.active && (
            <FreeInput onSubmit={handleFreeInput} />
          )}
        </div>
      </div>

      {/* 属性面板 */}
      <AttributePanel attributes={attributes} />

      {/* 右侧面板 - 背包 */}
      <InventoryPanel
        isOpen={showInventory}
        onClose={() => setShowInventory(false)}
        items={inventory}
        onUseItem={handleUseItem}
        onEquipItem={handleEquipItem}
        onDropItem={handleDropItem}
      />

      {/* 右侧面板 - 技能 */}
      <SkillPanel
        isOpen={showSkills}
        onClose={() => setShowSkills(false)}
        skills={skills}
        onUseSkill={handleUseSkill}
        inCombat={combatState.active}
      />

      {/* 右侧面板 - NPC 关系 */}
      <NpcRelationPanel
        isOpen={showNpc}
        onClose={() => setShowNpc(false)}
        npcs={npcRelations}
        onTalkTo={handleTalkTo}
      />

      {/* 物品获取/丢失通知 */}
      <ItemNotification
        items={itemChanges}
        onDismiss={dismissItemChange}
      />

      {/* 游戏事件通知（成就、技能、善恶值等） */}
      <GameEventHandlers
        events={toasts}
        onDismiss={dismissToast}
      />
    </div>
  );
}
