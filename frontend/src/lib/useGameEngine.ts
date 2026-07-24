'use client';

import { useState, useCallback, useRef } from 'react';
import api from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/* ========== 扩展类型定义 ========== */

export interface GameState {
  id: number;
  scriptId: number;
  script: any;
  gameState: {
    currentNodeId: number | null;
    attributes: Record<string, any>;
    npcRelations: Record<string, number>;
    inventory: InventoryItem[];
    skills: Skill[];
    history: { role: string; content: string }[];
    flags: Record<string, any>;
  };
  totalTokens: number;
  totalCost: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  emoji: string;
  type: 'weapon' | 'armor' | 'consumable' | 'quest' | 'special';
  quantity: number;
  description: string;
  bonus?: Record<string, number>;
}

export interface Skill {
  id: string;
  name: string;
  emoji: string;
  level: number;
  maxLevel: number;
  description: string;
  cooldown?: number;
  maxCooldown?: number;
  mpCost?: number;
  type: 'combat' | 'exploration' | 'social';
}

export interface NpcRelation {
  id: string;
  name: string;
  relation: number;
  avatar?: string;
}

export interface WorldState {
  location: string;
  timeOfDay: string;
  day: number;
  chapter: number;
  gold: number;
  karma: number;
}

export interface CombatState {
  active: boolean;
  enemy: {
    name: string;
    emoji: string;
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
  } | null;
  player: {
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    attack: number;
    defense: number;
    speed: number;
  } | null;
  log: string[];
  result: 'victory' | 'defeat' | null;
  reward?: string;
}

export interface DialogueState {
  active: boolean;
  npcId: string;
  npcName: string;
  npcAvatar?: string;
  relationLevel: string;
  text: string;
  choices?: Array<{
    text: string;
    karmaEffect?: number;
    relationEffect?: number;
  }>;
  giftItems?: Array<{
    id: string;
    name: string;
    emoji: string;
  }>;
}

export interface EndingState {
  active: boolean;
  title: string;
  description: string;
  type: 'good' | 'bad' | 'hidden' | 'normal';
  stats: {
    daysPlayed: number;
    choicesMade: number;
    achievementsUnlocked: number;
  };
}

export interface ItemChange {
  id: string;
  name: string;
  emoji: string;
  quantity: number;
  timestamp: number;
}

export interface GameToast {
  id: string;
  type: 'item' | 'achievement' | 'skill' | 'karma' | 'npc' | 'info';
  emoji: string;
  title: string;
  description?: string;
  timestamp: number;
}

interface SaveData {
  id: number;
  gameState: any;
  description: string;
  isAuto: boolean;
  createdAt: string;
}

/* ========== Hook ========== */

export function useGameEngine(initialSessionId: string | null) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [narrative, setNarrative] = useState('');
  const [narratives, setNarratives] = useState<{ role: string; content: string }[]>([]);
  const [choices, setChoices] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [attributes, setAttributes] = useState<Record<string, any>>({});
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 扩展状态
  const [worldState, setWorldState] = useState<WorldState>({
    location: '',
    timeOfDay: '',
    day: 1,
    chapter: 1,
    gold: 0,
    karma: 0,
  });
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [npcRelations, setNpcRelations] = useState<NpcRelation[]>([]);
  const [combatState, setCombatState] = useState<CombatState>({
    active: false,
    enemy: null,
    player: null,
    log: [],
    result: null,
  });
  const [dialogueState, setDialogueState] = useState<DialogueState | null>(null);
  const [endingState, setEndingState] = useState<EndingState | null>(null);
  const [itemChanges, setItemChanges] = useState<ItemChange[]>([]);
  const [toasts, setToasts] = useState<GameToast[]>([]);
  const [flags, setFlags] = useState<Record<string, any>>({});

  // 开始新游戏
  const startGame = useCallback(async (scriptId: number) => {
    try {
      const res: any = await api.post('/game/start', { scriptId });
      const data = res.data;
      setSessionId(String(data.sessionId));
      setAttributes(data.gameState.attributes || {});
      return data;
    } catch (err: any) {
      const msg = err.response?.data?.message || '开始游戏失败';
      setError(msg);
      throw err;
    }
  }, []);

  // 加载已有游戏状态
  const loadSession = useCallback(
    async (sid: string) => {
      try {
        const res: any = await api.get(`/game/${sid}`);
        const data = res.data;
        setGameState(data);
        setSessionId(String(data.id));
        setAttributes(data.gameState.attributes || {});
        if (data.gameState.inventory) setInventory(data.gameState.inventory);
        if (data.gameState.skills) setSkills(data.gameState.skills);
        return data;
      } catch (err: any) {
        const msg = err.response?.data?.message || '加载游戏失败';
        setError(msg);
        throw err;
      }
    },
    [],
  );

  // 获取存档列表
  const getSaves = useCallback(async () => {
    if (!sessionId) return [];
    try {
      const res: any = await api.get(`/game/${sessionId}/saves`);
      return res.data as SaveData[];
    } catch {
      return [];
    }
  }, [sessionId]);

  // 手动存档
  const saveGame = useCallback(
    async (description?: string) => {
      if (!sessionId) return null;
      try {
        const res: any = await api.post(`/game/${sessionId}/save`, {
          description: description || '手动存档',
        });
        return res.data;
      } catch {
        return null;
      }
    },
    [sessionId],
  );

  // 添加 toast 通知
  const addToast = useCallback((toast: Omit<GameToast, 'id' | 'timestamp'>) => {
    const newToast: GameToast = {
      ...toast,
      id: `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now(),
    };
    setToasts((prev) => [...prev.slice(-4), newToast]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 物品变化通知
  const addDismissItemChange = useCallback((id: string) => {
    setItemChanges((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // 使用物品
  const useItem = useCallback(
    async (itemId: string) => {
      if (!sessionId) return;
      setIsLoading(true);
      try {
        const res: any = await api.post(`/game/${sessionId}/use-item`, { itemId });
        const data = res.data;
        if (data.attributes) setAttributes((prev) => ({ ...prev, ...data.attributes }));
        if (data.inventory) setInventory(data.inventory);
      } catch (err: any) {
        setError(err.response?.data?.message || '使用物品失败');
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId],
  );

  // 使用技能
  const useSkill = useCallback(
    async (skillId: string) => {
      if (!sessionId) return;
      setIsLoading(true);
      try {
        const res: any = await api.post(`/game/${sessionId}/use-skill`, { skillId });
        const data = res.data;
        if (data.attributes) setAttributes((prev) => ({ ...prev, ...data.attributes }));
        if (data.skills) setSkills(data.skills);
      } catch (err: any) {
        setError(err.response?.data?.message || '使用技能失败');
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId],
  );

  // 战斗行动
  const combatAction = useCallback(
    async (action: string, targetId?: string) => {
      if (!sessionId) return;
      try {
        const res: any = await api.post(`/game/${sessionId}/combat/action`, { action, targetId });
        const data = res.data;
        if (data.combat) {
          setCombatState(data.combat);
        }
        if (data.attributes) setAttributes((prev) => ({ ...prev, ...data.attributes }));
      } catch (err: any) {
        setError(err.response?.data?.message || '战斗行动失败');
      }
    },
    [sessionId],
  );

  // 对话行动
  const dialogueAction = useCallback(
    async (npcId: string, choiceIndex?: number, giftId?: string) => {
      if (!sessionId) return;
      setIsLoading(true);
      try {
        const res: any = await api.post(`/game/${sessionId}/dialogue`, {
          npcId,
          choiceIndex,
          giftId,
        });
        const data = res.data;
        if (data.dialogue) {
          setDialogueState(data.dialogue);
        } else {
          setDialogueState(null);
        }
        if (data.attributes) setAttributes((prev) => ({ ...prev, ...data.attributes }));
        if (data.npcRelations) setNpcRelations(data.npcRelations);
      } catch (err: any) {
        setError(err.response?.data?.message || '对话失败');
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId],
  );

  // 玩家行动（SSE 流式接收） - 增强版
  const sendAction = useCallback(
    async (action: string, choiceId?: string) => {
      if (!sessionId) return;

      setIsLoading(true);
      setError(null);
      setNarrative('');
      setChoices([]);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const token = localStorage.getItem('token');

      try {
        const response = await fetch(
          `${API_BASE}/game/${sessionId}/chat`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ action, choiceId }),
            signal: controller.signal,
          },
        );

        if (!response.ok && response.headers.get('content-type')?.includes('application/json')) {
          const errorData = await response.json();
          setError(errorData.message || '请求失败');
          setIsLoading(false);
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          setError('无法读取响应流');
          setIsLoading(false);
          return;
        }

        const decoder = new TextDecoder();
        let fullNarrative = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n').filter((l) => l.startsWith('data: '));

          for (const line of lines) {
            const dataStr = line.slice(6);

            if (dataStr === '[DONE]') continue;

            try {
              const data = JSON.parse(dataStr);

              switch (data.type) {
                case 'text':
                  fullNarrative += data.content;
                  setNarrative(fullNarrative);
                  break;

                case 'choices':
                  setChoices(data.data || []);
                  break;

                case 'attribute_change':
                  setAttributes((prev) => ({
                    ...prev,
                    ...data.data,
                  }));
                  break;

                case 'item_change': {
                  // 物品获取/丢失
                  const itemData = data.data;
                  const newItemChange: ItemChange = {
                    id: `item-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                    name: itemData.name || '未知物品',
                    emoji: itemData.emoji || '📦',
                    quantity: itemData.quantity || 1,
                    timestamp: Date.now(),
                  };
                  setItemChanges((prev) => [...prev.slice(-4), newItemChange]);

                  // 更新背包
                  if (itemData.inventory) setInventory(itemData.inventory);
                  break;
                }

                case 'combat_trigger': {
                  // 进入战斗模式
                  const combatData = data.data;
                  setCombatState({
                    active: true,
                    enemy: combatData?.enemy || null,
                    player: combatData?.player || null,
                    log: combatData?.log || [`⚔️ ${combatData?.enemy?.name || '敌人'}出现了！`],
                    result: null,
                  });
                  break;
                }

                case 'combat_result': {
                  // 战斗结果更新
                  const resultData = data.data;
                  setCombatState((prev) => ({
                    ...prev,
                    enemy: resultData?.enemy || prev.enemy,
                    player: resultData?.player || prev.player,
                    log: resultData?.log ? [...prev.log, ...resultData.log] : prev.log,
                    result: resultData?.result || null,
                    reward: resultData?.reward,
                  }));
                  break;
                }

                case 'combat_end': {
                  // 战斗结束
                  const endData = data.data;
                  setCombatState((prev) => ({
                    ...prev,
                    active: false,
                    result: endData?.result || prev.result,
                    reward: endData?.reward,
                  }));
                  if (endData?.attributes) {
                    setAttributes((prev) => ({ ...prev, ...endData.attributes }));
                  }
                  break;
                }

                case 'ending': {
                  // 结局达成
                  const endingData = data.data;
                  setEndingState({
                    active: true,
                    title: endingData?.title || '冒险结束',
                    description: endingData?.description || '',
                    type: endingData?.type || 'normal',
                    stats: endingData?.stats || {
                      daysPlayed: worldState.day,
                      choicesMade: 0,
                      achievementsUnlocked: 0,
                    },
                  });
                  break;
                }

                case 'dialogue': {
                  // NPC 对话
                  setDialogueState({
                    active: true,
                    npcId: data.data?.npcId || '',
                    npcName: data.data?.npcName || '未知NPC',
                    npcAvatar: data.data?.npcAvatar,
                    relationLevel: data.data?.relationLevel || '陌生人',
                    text: data.data?.text || '',
                    choices: data.data?.choices,
                    giftItems: data.data?.giftItems,
                  });
                  break;
                }

                case 'dialogue_end': {
                  // 对话结束
                  setDialogueState(null);
                  break;
                }

                case 'skill_learn': {
                  // 学习新技能
                  const skillData = data.data;
                  if (skillData?.skills) {
                    setSkills(skillData.skills);
                  }
                  addToast({
                    type: 'skill',
                    emoji: skillData?.emoji || '⚡',
                    title: `习得新技能：${skillData?.name || '未知'}`,
                    description: skillData?.description,
                  });
                  break;
                }

                case 'flag_change': {
                  // 标记变化
                  if (data.data) {
                    setFlags((prev) => ({ ...prev, ...data.data }));
                  }
                  break;
                }

                case 'karma_change': {
                  // 善恶值变化
                  const karmaVal = data.data?.value ?? data.data;
                  setWorldState((prev) => ({ ...prev, karma: prev.karma + (typeof karmaVal === 'number' ? karmaVal : 0) }));
                  addToast({
                    type: 'karma',
                    emoji: '⚖️',
                    title: `善恶值变化 ${(karmaVal as number) > 0 ? '+' : ''}${karmaVal}`,
                  });
                  break;
                }

                case 'location_change': {
                  // 位置变化
                  setWorldState((prev) => ({
                    ...prev,
                    location: data.data?.location || data.data || '',
                  }));
                  break;
                }

                case 'time_change': {
                  // 时间变化
                  const timeData = data.data;
                  setWorldState((prev) => ({
                    ...prev,
                    timeOfDay: timeData?.timeOfDay || timeData?.time || '',
                    day: timeData?.day || prev.day,
                    chapter: timeData?.chapter || prev.chapter,
                  }));
                  break;
                }

                case 'npc_relation_change': {
                  // NPC 关系变化
                  if (data.data) {
                    setNpcRelations(data.data);
                    const npcName = data.data[0]?.name;
                    if (npcName) {
                      addToast({
                        type: 'npc',
                        emoji: '🤝',
                        title: `${npcName} 的好感度发生了变化`,
                      });
                    }
                  }
                  break;
                }

                case 'achievement': {
                  // 成就通知
                  const achData = data.data;
                  addToast({
                    type: 'achievement',
                    emoji: achData?.emoji || '🏆',
                    title: `达成成就：${achData?.name || '未知'}`,
                    description: achData?.description,
                  });
                  break;
                }

                case 'gold_change': {
                  // 金币变化
                  const goldVal = data.data?.value ?? data.data;
                  setWorldState((prev) => ({ ...prev, gold: prev.gold + (typeof goldVal === 'number' ? goldVal : 0) }));
                  break;
                }

                case 'inventory_update': {
                  // 背包更新
                  if (data.data) setInventory(data.data);
                  break;
                }

                case 'skills_update': {
                  // 技能更新
                  if (data.data) setSkills(data.data);
                  break;
                }

                case 'error':
                  setError(data.content || '发生错误');
                  if (data.code === 402) {
                    setError(`余额不足：${data.content}`);
                  }
                  break;

                default:
                  break;
              }
            } catch {
              // 非 JSON 数据
            }
          }
        }

        // 将完成的叙述添加到历史
        if (fullNarrative) {
          setNarratives((prev) => [...prev, { role: 'assistant', content: fullNarrative }]);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError('网络错误，请重试');
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [sessionId, worldState.day, addToast],
  );

  // 退出战斗
  const exitCombat = useCallback(() => {
    setCombatState({
      active: false,
      enemy: null,
      player: null,
      log: [],
      result: null,
    });
  }, []);

  // 退出对话
  const exitDialogue = useCallback(() => {
    setDialogueState(null);
  }, []);

  // 退出结局
  const exitEnding = useCallback(() => {
    setEndingState(null);
  }, []);

  // 清理
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    // 原有
    gameState,
    narrative,
    narratives,
    choices,
    isLoading,
    attributes,
    error,
    sessionId,
    startGame,
    loadSession,
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
    flags,

    // 扩展方法
    useItem,
    useSkill,
    combatAction,
    dialogueAction,
    exitCombat,
    exitDialogue,
    exitEnding,
    addToast,
    dismissToast,
    dismissItemChange: addDismissItemChange,
  };
}
