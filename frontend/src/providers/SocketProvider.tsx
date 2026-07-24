'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import {
  getSocketUrl,
  type ConnectionStatus,
  type RealtimeEvent,
} from '@/lib/useWebSocket';
import { useAppStore } from '@/store/appStore';

interface SocketContextValue {
  /** 全局 socket 实例 */
  socket: Socket | null;
  /** 连接状态 */
  status: ConnectionStatus;
  /** 是否已连接 */
  connected: boolean;
  /** 主动重连 */
  reconnect: () => void;
  /** 加入游戏会话房间 */
  joinSession: (sessionId: number) => void;
  /** 离开游戏会话房间 */
  leaveSession: (sessionId: number) => void;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

/**
 * 全局 WebSocket 连接 Provider
 *
 * 在应用启动时（有 token 的情况下）自动连接 socket.io，
 * 并通过 Context 向下游提供 socket 实例与连接状态。
 *
 * 配合 useSocket / useRealtime 两个 hook 使用。
 */
export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const socketRef = useRef<Socket | null>(null);
  const lastConnectedAtRef = useRef<Date | null>(null);

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
    const newSocket = io(getSocketUrl(), {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });
    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setStatus('connected');
      lastConnectedAtRef.current = new Date();
    });

    newSocket.on('disconnect', () => {
      setStatus('disconnected');
    });

    newSocket.on('connect_error', () => {
      setStatus('connecting');
    });

    newSocket.io.on('reconnect_attempt', () => {
      setStatus('connecting');
      const latestToken = localStorage.getItem('token');
      if (
        latestToken &&
        (newSocket.auth as any)?.token !== latestToken
      ) {
        newSocket.auth = { token: latestToken };
      }
    });
  }, []);

  /** 断开连接 */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
    }
    setStatus('disconnected');
  }, []);

  useEffect(() => {
    /** 检测 token 并按需连接/断开 */
    const checkTokenAndConnect = () => {
      const token = localStorage.getItem('token');
      const current = socketRef.current;
      if (token && (!current || !current.connected)) {
        connect();
      } else if (!token && current) {
        disconnect();
      }
    };

    checkTokenAndConnect();

    // 轮询检测 token 变化
    const tokenPoll = window.setInterval(checkTokenAndConnect, 2000);

    // 多标签页同步
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
    };
  }, [connect, disconnect]);

  const reconnect = useCallback(() => {
    connect();
  }, [connect]);

  const joinSession = useCallback((sessionId: number) => {
    socketRef.current?.emit('join_session', { sessionId });
  }, []);

  const leaveSession = useCallback((sessionId: number) => {
    socketRef.current?.emit('leave_session', { sessionId });
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        status,
        connected: status === 'connected',
        reconnect,
        joinSession,
        leaveSession,
      }}
    >
      {children}
      {/* 实时余额同步：收到 balance_update 后更新全局余额状态 */}
      <RealtimeBalanceSync />
    </SocketContext.Provider>
  );
}

/**
 * 内部组件：监听 balance_update 事件并同步到 appStore，
 * 使侧边栏 UU 余额在游戏扣费 / 管理员调整后实时刷新。
 */
function RealtimeBalanceSync() {
  const updateBalance = useAppStore((s) => s.updateBalance);
  useRealtime('balance_update', useCallback((data: any) => {
    if (data && typeof data.permanentBalance === 'number') {
      updateBalance(data.permanentBalance, data.tempBalance ?? 0);
    }
  }, [updateBalance]));
  return null;
}

/** 获取全局 socket 实例与连接状态 */
export function useSocket(): SocketContextValue {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket 必须在 SocketProvider 内部使用');
  }
  return context;
}

/**
 * 监听指定的实时事件
 *
 * @param event 事件名（notification / announcement / game_update / balance_update）
 * @param handler 事件回调
 */
export function useRealtime(
  event: RealtimeEvent,
  handler: (data: any) => void,
): void {
  const { socket } = useSocket();
  // 用 ref 保存最新的 handler，避免 effect 频繁重建监听
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!socket) return;
    const listener = (data: any) => handlerRef.current(data);
    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [socket, event]);
}
