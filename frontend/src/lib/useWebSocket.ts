'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import api from '@/lib/api';

/** WebSocket 连接状态 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

/** 实时事件名 */
export type RealtimeEvent =
  | 'notification'
  | 'announcement'
  | 'game_update'
  | 'balance_update';

export interface UseWebSocketOptions {
  /** 收到 notification 事件时回调 */
  onNotification?: (data: any) => void;
  /** 收到 announcement 事件时回调 */
  onAnnouncement?: (data: any) => void;
  /** 收到 game_update 事件时回调 */
  onGameUpdate?: (data: any) => void;
  /** 收到 balance_update 事件时回调 */
  onBalanceUpdate?: (data: any) => void;
  /** 是否启用连接，默认 true */
  enabled?: boolean;
}

/**
 * 从环境变量推导 socket.io 连接地址
 * NEXT_PUBLIC_API_URL 形如 http://localhost:3001/api，去掉 /api 即为 WS 地址
 */
export function getSocketUrl(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  return apiUrl.replace(/\/api\/?$/, '');
}

/**
 * WebSocket Hook
 *
 * - 连接到后端 socket.io（与 HTTP 同端口，路径 /socket.io）
 * - 自动携带 JWT token（从 localStorage 读取）
 * - 监听事件：notification / announcement / game_update / balance_update
 * - 提供连接状态（connecting / connected / disconnected）
 * - 自动重连
 * - 断线重连后拉取离线期间的通知
 */
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    onNotification,
    onAnnouncement,
    onGameUpdate,
    onBalanceUpdate,
    enabled = true,
  } = options;

  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const socketRef = useRef<Socket | null>(null);
  /** 记录上次连接成功时间，用于重连后拉取离线通知 */
  const lastConnectedAtRef = useRef<Date | null>(null);
  /** 防止回调在渲染期间被替换导致监听失效，用 ref 保存最新回调 */
  const callbacksRef = useRef(options);
  callbacksRef.current = options;

  /** 拉取离线期间的通知 */
  const fetchMissedNotifications = useCallback(async () => {
    const since = lastConnectedAtRef.current;
    try {
      const res: any = await api.get('/notifications', {
        params: { page: 1, pageSize: 20 },
      });
      if (res?.success && Array.isArray(res.data?.list)) {
        const list = since
          ? res.data.list.filter(
              (n: any) => new Date(n.createdAt) > since,
            )
          : res.data.list;
        list.forEach((n: any) => {
          callbacksRef.current.onNotification?.(n);
        });
      }
    } catch {
      // 静默失败，不影响主流程
    }
  }, []);

  /** 建立连接 */
  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token) {
      setStatus('disconnected');
      return;
    }

    // 已存在连接则先清理
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
    }

    setStatus('connecting');
    const socket = io(getSocketUrl(), {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setStatus('connected');
      // 重连场景：拉取离线期间的通知
      if (lastConnectedAtRef.current) {
        fetchMissedNotifications();
      }
      lastConnectedAtRef.current = new Date();
    });

    socket.on('disconnect', () => {
      setStatus('disconnected');
    });

    socket.on('connect_error', () => {
      setStatus('connecting');
    });

    socket.io.on('reconnect_attempt', () => {
      setStatus('connecting');
      // 重连前刷新 token（防止旧 token 失效）
      const latestToken = localStorage.getItem('token');
      if (
        latestToken &&
        (socket.auth as any)?.token !== latestToken
      ) {
        socket.auth = { token: latestToken };
      }
    });

    // 事件监听
    socket.on('notification', (data: any) => {
      callbacksRef.current.onNotification?.(data);
    });
    socket.on('announcement', (data: any) => {
      callbacksRef.current.onAnnouncement?.(data);
    });
    socket.on('game_update', (data: any) => {
      callbacksRef.current.onGameUpdate?.(data);
    });
    socket.on('balance_update', (data: any) => {
      callbacksRef.current.onBalanceUpdate?.(data);
    });
  }, [fetchMissedNotifications]);

  useEffect(() => {
    if (!enabled) return;

    // 监听 token 变化（登录/登出后重连）
    const checkTokenAndConnect = () => {
      const token = localStorage.getItem('token');
      const currentSocket = socketRef.current;
      if (token && (!currentSocket || !currentSocket.connected)) {
        connect();
      } else if (!token && currentSocket) {
        currentSocket.removeAllListeners();
        currentSocket.disconnect();
        socketRef.current = null;
        setStatus('disconnected');
      }
    };

    checkTokenAndConnect();

    // 轮询检测 token 变化（localStorage 无原生事件）
    const tokenPoll = window.setInterval(checkTokenAndConnect, 2000);

    // 监听 storage 事件（多标签页同步）
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'token') {
        checkTokenAndConnect();
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.clearInterval(tokenPoll);
      window.removeEventListener('storage', onStorage);
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setStatus('disconnected');
    };
  }, [enabled, connect]);

  /** 主动重连 */
  const reconnect = useCallback(() => {
    connect();
  }, [connect]);

  /** 加入游戏会话房间 */
  const joinSession = useCallback((sessionId: number) => {
    socketRef.current?.emit('join_session', { sessionId });
  }, []);

  /** 离开游戏会话房间 */
  const leaveSession = useCallback((sessionId: number) => {
    socketRef.current?.emit('leave_session', { sessionId });
  }, []);

  return {
    socket: socketRef.current,
    status,
    isConnected: status === 'connected',
    reconnect,
    joinSession,
    leaveSession,
  };
}
