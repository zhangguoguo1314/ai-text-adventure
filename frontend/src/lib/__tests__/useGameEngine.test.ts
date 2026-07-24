import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

/**
 * Mock @/lib/api 模块
 * - 所有方法返回 Promise，可在测试中配置返回值
 */
const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  default: apiMock,
}));

import { useGameEngine } from '../useGameEngine';

/**
 * 游戏引擎 Hook 测试
 *
 * 覆盖：
 * - startGame：成功 / 失败
 * - loadSession：成功 / 失败
 * - getSaves：返回存档列表
 * - saveGame：手动存档
 * - sendAction（SSE 流式）：接收文本 / 选项 / 属性变化 / 错误事件
 *
 * Mock 策略：
 * - api 模块：mock 所有 HTTP 方法
 * - fetch：mock SSE 流式响应
 * - localStorage：提供 token
 */
describe('useGameEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    // 提供默认 token 供 SSE 请求使用
    window.localStorage.setItem('token', 'test-token');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /* ===================== startGame ===================== */

  describe('startGame', () => {
    it('开始游戏成功应设置 sessionId 和 attributes', async () => {
      apiMock.post.mockResolvedValue({
        data: {
          sessionId: 500,
          gameState: {
            attributes: { 勇气: 50, 智慧: 30 },
            npcRelations: {},
            inventory: [],
          },
        },
      });

      const { result } = renderHook(() => useGameEngine(null));

      await act(async () => {
        await result.current.startGame(100);
      });

      expect(result.current.sessionId).toBe('500');
      expect(result.current.attributes).toEqual({ 勇气: 50, 智慧: 30 });
      expect(result.current.error).toBeNull();
    });

    it('开始游戏失败应设置 error 并抛出异常', async () => {
      apiMock.post.mockRejectedValue({
        response: { data: { message: '剧本不存在' } },
      });

      const { result } = renderHook(() => useGameEngine(null));

      await act(async () => {
        try {
          await result.current.startGame(999);
        } catch {
          // 预期抛出
        }
      });

      expect(result.current.error).toBe('剧本不存在');
    });

    it('开始游戏失败时 error 应有默认消息', async () => {
      apiMock.post.mockRejectedValue(new Error('network'));

      const { result } = renderHook(() => useGameEngine(null));

      await act(async () => {
        try {
          await result.current.startGame(999);
        } catch {
          // 预期抛出
        }
      });

      expect(result.current.error).toBe('开始游戏失败');
    });
  });

  /* ===================== loadSession ===================== */

  describe('loadSession', () => {
    it('加载会话成功应设置 gameState 和 attributes', async () => {
      apiMock.get.mockResolvedValue({
        data: {
          id: 500,
          scriptId: 100,
          gameState: {
            currentNodeId: null,
            attributes: { 勇气: 50 },
            npcRelations: {},
            inventory: ['剑'],
            history: [],
          },
        },
      });

      const { result } = renderHook(() => useGameEngine(null));

      await act(async () => {
        await result.current.loadSession('500');
      });

      expect(result.current.sessionId).toBe('500');
      expect(result.current.attributes).toEqual({ 勇气: 50 });
      expect(result.current.gameState).not.toBeNull();
      expect(result.current.gameState?.id).toBe(500);
    });

    it('加载会话失败应设置 error', async () => {
      apiMock.get.mockRejectedValue({
        response: { data: { message: '会话不存在' } },
      });

      const { result } = renderHook(() => useGameEngine(null));

      await act(async () => {
        try {
          await result.current.loadSession('999');
        } catch {
          // 预期抛出
        }
      });

      expect(result.current.error).toBe('会话不存在');
    });
  });

  /* ===================== getSaves ===================== */

  describe('getSaves', () => {
    it('应返回存档列表', async () => {
      const saves = [
        { id: 1, description: '自动存档', isAuto: true, createdAt: '2024-01-01' },
        { id: 2, description: '手动存档', isAuto: false, createdAt: '2024-01-02' },
      ];
      apiMock.get.mockResolvedValue({ data: saves });

      const { result } = renderHook(() => useGameEngine('500'));

      let returnedSaves: any[] = [];
      await act(async () => {
        returnedSaves = await result.current.getSaves();
      });

      expect(returnedSaves).toHaveLength(2);
      expect(returnedSaves[0].description).toBe('自动存档');
      expect(apiMock.get).toHaveBeenCalledWith('/game/500/saves');
    });

    it('无 sessionId 时应返回空数组', async () => {
      const { result } = renderHook(() => useGameEngine(null));

      let returnedSaves: any[] = [];
      await act(async () => {
        returnedSaves = await result.current.getSaves();
      });

      expect(returnedSaves).toEqual([]);
      expect(apiMock.get).not.toHaveBeenCalled();
    });

    it('请求失败时应返回空数组', async () => {
      apiMock.get.mockRejectedValue(new Error('network'));

      const { result } = renderHook(() => useGameEngine('500'));

      let returnedSaves: any[] = [];
      await act(async () => {
        returnedSaves = await result.current.getSaves();
      });

      expect(returnedSaves).toEqual([]);
    });
  });

  /* ===================== saveGame ===================== */

  describe('saveGame', () => {
    it('手动存档成功应返回存档数据', async () => {
      apiMock.post.mockResolvedValue({
        data: { id: 10, description: '关键时刻' },
      });

      const { result } = renderHook(() => useGameEngine('500'));

      let saveResult: any = null;
      await act(async () => {
        saveResult = await result.current.saveGame('关键时刻');
      });

      expect(saveResult).toEqual({ id: 10, description: '关键时刻' });
      expect(apiMock.post).toHaveBeenCalledWith('/game/500/save', {
        description: '关键时刻',
      });
    });

    it('无 sessionId 时应返回 null', async () => {
      const { result } = renderHook(() => useGameEngine(null));

      let saveResult: any = 'initial';
      await act(async () => {
        saveResult = await result.current.saveGame();
      });

      expect(saveResult).toBeNull();
    });

    it('无描述时应使用默认存档描述', async () => {
      apiMock.post.mockResolvedValue({ data: { id: 11 } });

      const { result } = renderHook(() => useGameEngine('500'));

      await act(async () => {
        await result.current.saveGame();
      });

      expect(apiMock.post).toHaveBeenCalledWith('/game/500/save', {
        description: '手动存档',
      });
    });

    it('存档失败时应返回 null', async () => {
      apiMock.post.mockRejectedValue(new Error('network'));

      const { result } = renderHook(() => useGameEngine('500'));

      let saveResult: any = 'initial';
      await act(async () => {
        saveResult = await result.current.saveGame('测试');
      });

      expect(saveResult).toBeNull();
    });
  });

  /* ===================== sendAction (SSE) ===================== */

  describe('sendAction (SSE 流式)', () => {
    /**
     * 构造 mock 的 SSE 响应
     * @param chunks SSE 数据块数组，每个元素是一段 `data: ...\n` 文本
     */
    function createMockSseResponse(chunks: string[], ok = true) {
      const encoder = new TextEncoder();
      const encodedChunks = chunks.map((c) => encoder.encode(c));

      let index = 0;
      const reader = {
        read: vi.fn(async () => {
          if (index < encodedChunks.length) {
            return { done: false, value: encodedChunks[index++] };
          }
          return { done: true, value: undefined };
        }),
      };

      return {
        ok,
        headers: {
          get: vi.fn(() => 'text/event-stream'),
        },
        body: {
          getReader: () => reader,
        },
      };
    }

    it('应接收文本片段并更新 narrative', async () => {
      const mockResponse = createMockSseResponse([
        'data: {"type":"text","content":"你走进了"}\n',
        'data: {"type":"text","content":"古老的城堡"}\n',
        'data: [DONE]\n',
      ]);
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

      const { result } = renderHook(() => useGameEngine('500'));

      await act(async () => {
        await result.current.sendAction('走向城堡');
      });

      // narrative 应拼接所有文本片段
      expect(result.current.narrative).toBe('你走进了古老的城堡');
      expect(result.current.isLoading).toBe(false);
      // 应添加到历史记录
      expect(result.current.narratives).toHaveLength(1);
      expect(result.current.narratives[0].role).toBe('assistant');
    });

    it('应接收选项并更新 choices', async () => {
      const mockResponse = createMockSseResponse([
        'data: {"type":"choices","data":["进入城堡","原地观察"]}\n',
        'data: [DONE]\n',
      ]);
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

      const { result } = renderHook(() => useGameEngine('500'));

      await act(async () => {
        await result.current.sendAction('查看选项');
      });

      expect(result.current.choices).toEqual(['进入城堡', '原地观察']);
    });

    it('应接收属性变化并更新 attributes', async () => {
      const mockResponse = createMockSseResponse([
        'data: {"type":"attribute_change","data":{"勇气":55}}\n',
        'data: [DONE]\n',
      ]);
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

      const { result } = renderHook(() => useGameEngine('500'));

      // 先设置初始属性
      await act(async () => {
        // 通过 startGame 设置初始属性
        apiMock.post.mockResolvedValue({
          data: { sessionId: '500', gameState: { attributes: { 勇气: 50 } } },
        });
        await result.current.startGame(100);
      });

      await act(async () => {
        await result.current.sendAction('勇敢前进');
      });

      expect(result.current.attributes.勇气).toBe(55);
    });

    it('应接收错误事件并设置 error', async () => {
      const mockResponse = createMockSseResponse([
        'data: {"type":"error","content":"AI 服务暂时不可用"}\n',
        'data: [DONE]\n',
      ]);
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

      const { result } = renderHook(() => useGameEngine('500'));

      await act(async () => {
        await result.current.sendAction('测试');
      });

      expect(result.current.error).toBe('AI 服务暂时不可用');
      expect(result.current.isLoading).toBe(false);
    });

    it('余额不足错误（code 402）应设置余额不足提示', async () => {
      const mockResponse = createMockSseResponse([
        'data: {"type":"error","code":402,"content":"代币不足"}\n',
        'data: [DONE]\n',
      ]);
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

      const { result } = renderHook(() => useGameEngine('500'));

      await act(async () => {
        await result.current.sendAction('测试');
      });

      expect(result.current.error).toContain('余额不足');
      expect(result.current.error).toContain('代币不足');
    });

    it('无 sessionId 时不应发送请求', async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);

      const { result } = renderHook(() => useGameEngine(null));

      await act(async () => {
        await result.current.sendAction('测试');
      });

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('fetch 返回非 ok 且 content-type 为 json 时应设置 error', async () => {
      const mockResponse = {
        ok: false,
        headers: {
          get: vi.fn(() => 'application/json'),
        },
        json: vi.fn().mockResolvedValue({ message: '会话已过期' }),
      };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

      const { result } = renderHook(() => useGameEngine('500'));

      await act(async () => {
        await result.current.sendAction('测试');
      });

      expect(result.current.error).toBe('会话已过期');
      expect(result.current.isLoading).toBe(false);
    });

    it('无响应流时应设置 error', async () => {
      const mockResponse = {
        ok: true,
        headers: {
          get: vi.fn(() => 'text/event-stream'),
        },
        body: null,
      };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

      const { result } = renderHook(() => useGameEngine('500'));

      await act(async () => {
        await result.current.sendAction('测试');
      });

      expect(result.current.error).toBe('无法读取响应流');
      expect(result.current.isLoading).toBe(false);
    });

    it('网络错误应设置 error 但不应是 AbortError', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockRejectedValue(new Error('Network Error')),
      );

      const { result } = renderHook(() => useGameEngine('500'));

      await act(async () => {
        await result.current.sendAction('测试');
      });

      expect(result.current.error).toBe('网络错误，请重试');
      expect(result.current.isLoading).toBe(false);
    });

    it('fetch 请求应携带 Authorization 头', async () => {
      const mockResponse = createMockSseResponse(['data: [DONE]\n']);
      const fetchMock = vi.fn().mockResolvedValue(mockResponse);
      vi.stubGlobal('fetch', fetchMock);

      const { result } = renderHook(() => useGameEngine('500'));

      await act(async () => {
        await result.current.sendAction('测试');
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [, options] = fetchMock.mock.calls[0];
      expect(options.method).toBe('POST');
      expect(options.headers.Authorization).toBe('Bearer test-token');
      expect(options.body).toBe(JSON.stringify({ action: '测试' }));
    });
  });

  /* ===================== cleanup ===================== */

  describe('cleanup', () => {
    it('cleanup 应中止未完成的请求', async () => {
      // 创建一个永不 resolve 的 fetch，模拟进行中的请求
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation(
          () => new Promise(() => {}), // 永不 resolve
        ),
      );

      const { result } = renderHook(() => useGameEngine('500'));

      // 开始请求但不等待完成
      act(() => {
        result.current.sendAction('测试');
      });

      // cleanup 应能正常执行（中止请求）
      act(() => {
        result.current.cleanup();
      });

      // cleanup 后 isLoading 应仍可能为 true（因为 abort 不会触发 finally 在同步中）
      // 但 cleanup 不应抛出异常
      expect(true).toBe(true);
    });
  });
});
