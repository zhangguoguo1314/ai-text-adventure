'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import CharacterCreation from '@/components/game/CharacterCreation';

export default function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { isAuthenticated } = useAuthStore();
  const [script, setScript] = useState<any>(null);
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startingGame, setStartingGame] = useState(false);
  const [showCharCreation, setShowCharCreation] = useState(false);

  // 加载剧本详情（含模板信息）
  useEffect(() => {
    api
      .get(`/scripts/${id}`)
      .then((res: any) => {
        setScript(res.data);
        // 如果剧本有关联的模板且有charConfig，加载模板信息
        if (res.data?.styleId) {
          return api.get(`/templates/${res.data.styleId}`);
        }
      })
      .then((res: any) => {
        if (res?.data) {
          setTemplate(res.data);
        }
      })
      .catch(() => {
        setScript(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handlePlay = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!script) return;

    // 检查是否有角色创建配置
    const charConfig = template?.charConfig;
    if (charConfig && typeof charConfig === 'object') {
      try {
        const parsed = typeof charConfig === 'string' ? JSON.parse(charConfig) : charConfig;
        if (parsed && Object.keys(parsed).length > 0) {
          setShowCharCreation(true);
          return;
        }
      } catch {
        // 解析失败，直接开始游戏
      }
    }

    // 没有角色创建配置，直接开始
    await startGame();
  };

  const startGame = async (characterConfig?: any) => {
    if (!script) return;

    setStartingGame(true);
    try {
      const res: any = await api.post('/game/start', {
        scriptId: script.id,
        characterConfig: characterConfig || undefined,
      });
      const sessionId = res.data.sessionId;
      router.push(`/play/${sessionId}`);
    } catch (err: any) {
      alert(err.response?.data?.message || '开始游戏失败');
    } finally {
      setStartingGame(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  if (!script) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <p className="text-[var(--muted)]">剧本不存在或已被删除</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl overflow-hidden">
        {/* 头部 */}
        <div className="h-48 bg-gradient-to-r from-violet-500 to-purple-600 flex items-end p-6">
          <div>
            <h1 className="text-2xl font-bold text-white">{script.title}</h1>
            <p className="text-white/70 text-sm mt-1">
              {script.author?.nickname || '未知作者'}
            </p>
          </div>
        </div>

        {/* 信息 */}
        <div className="p-6 space-y-4">
          <p className="text-[var(--muted)] leading-relaxed">
            {script.desc || '暂无描述'}
          </p>

          <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
            <span>{script.playCount || 0} 次游玩</span>
            <span>{script._count?.favorites || 0} 次收藏</span>
          </div>

          {/* 标签 */}
          {script.category && (
            <div className="flex gap-2">
              <span className="px-3 py-1 rounded-full bg-violet-50 text-violet-600 text-xs font-medium">
                {script.category}
              </span>
            </div>
          )}

          {/* NPC 列表 */}
          {script.npcs && script.npcs.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-[var(--ink)] mb-2">登场角色</h3>
              <div className="flex gap-3">
                {script.npcs.map((npc: any) => (
                  <div
                    key={npc.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50"
                  >
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm">
                      {npc.name?.[0]}
                    </div>
                    <span className="text-sm">{npc.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={handlePlay}
              disabled={startingGame}
              className="flex-1 py-3 rounded-lg bg-violet-600 text-white font-medium 
                         hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors flex items-center justify-center gap-2"
            >
              {startingGame ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  正在开始...
                </>
              ) : (
                '开始游玩'
              )}
            </button>
            <button className="px-6 py-3 rounded-lg border border-[var(--rule)] text-[var(--ink)] hover:bg-violet-50">
              收藏
            </button>
          </div>
        </div>
      </div>

      {/* 角色创建弹窗 */}
      {showCharCreation && template?.charConfig && (
        <CharacterCreation
          charConfig={typeof template.charConfig === 'string' ? JSON.parse(template.charConfig) : template.charConfig}
          scriptTitle={script?.title}
          onComplete={(config) => {
            setShowCharCreation(false);
            startGame(config);
          }}
          onSkip={() => {
            setShowCharCreation(false);
            startGame();
          }}
        />
      )}
    </div>
  );
}
