'use client';

import { useState, useCallback, useRef } from 'react';
import api from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface GameState {
  id: number;
  scriptId: number;
  script: any;
  gameState: {
    currentNodeId: number | null;
    attributes: Record<string, any>;
    npcRelations: Record<string, number>;
    inventory: string[];
    history: { role: string; content: string }[];
  };
  totalTokens: number;
  totalCost: number;
}

interface SaveData {
  id: number;
  gameState: any;
  description: string;
  isAuto: boolean;
  createdAt: string;
}

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

  // 玩家行动（SSE 流式接收）
  const sendAction = useCallback(
    async (action: string, choiceId?: string) => {
      if (!sessionId) return;

      setIsLoading(true);
      setError(null);
      setNarrative('');
      setChoices([]);

      // 如果有上一个 abort controller，取消它
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

              if (data.type === 'text') {
                fullNarrative += data.content;
                setNarrative(fullNarrative);
              } else if (data.type === 'choices') {
                setChoices(data.data || []);
              } else if (data.type === 'attribute_change') {
                setAttributes((prev) => ({
                  ...prev,
                  ...data.data,
                }));
              } else if (data.type === 'error') {
                setError(data.content || '发生错误');
                if (data.code === 402) {
                  setError(`余额不足：${data.content}`);
                }
              }
            } catch {
              // 非 JSON 数据，可能是纯文本
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
    [sessionId],
  );

  // 清理
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
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
  };
}
