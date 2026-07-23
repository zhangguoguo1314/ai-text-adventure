'use client';

import { useEffect, useState, use } from 'react';
import GameScreen from '@/components/game/GameScreen';
import { useGameEngine } from '@/lib/useGameEngine';
import { useAuthStore } from '@/store/authStore';

export default function PlayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [scriptTitle, setScriptTitle] = useState<string>('');
  const { isAuthenticated } = useAuthStore();
  const { loadSession } = useGameEngine(id);

  useEffect(() => {
    if (!isAuthenticated) return;

    loadSession(id)
      .then((data: any) => {
        if (data?.script?.title) {
          setScriptTitle(data.script.title);
        }
      })
      .catch(() => {
        // 加载失败，可能需要先开始游戏
      });
  }, [id, isAuthenticated, loadSession]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-xl font-bold mb-2">请先登录</h2>
          <p className="text-slate-400">你需要登录后才能游玩游戏</p>
        </div>
      </div>
    );
  }

  return <GameScreen sessionId={id} scriptTitle={scriptTitle} />;
}
