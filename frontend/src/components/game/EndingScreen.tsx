'use client';

interface EndingScreenProps {
  title: string;
  description: string;
  endingType: 'good' | 'bad' | 'hidden' | 'normal';
  stats: {
    daysPlayed: number;
    choicesMade: number;
    achievementsUnlocked: number;
  };
  onRestart: () => void;
  onBackToLobby: () => void;
  onShare?: () => void;
}

const ENDING_CONFIG = {
  good: {
    label: '好结局',
    emoji: '🌟',
    gradient: 'from-amber-500 to-yellow-600',
    bgGlow: 'shadow-amber-500/20',
    badge: 'bg-amber-900/50 text-amber-300 border-amber-700/50',
    description: '恭喜你达成了好结局！',
  },
  bad: {
    label: '坏结局',
    emoji: '💔',
    gradient: 'from-red-500 to-rose-600',
    bgGlow: 'shadow-red-500/20',
    badge: 'bg-red-900/50 text-red-300 border-red-700/50',
    description: '这次冒险以悲剧收场...',
  },
  hidden: {
    label: '隐藏结局',
    emoji: '🔮',
    gradient: 'from-violet-500 to-purple-600',
    bgGlow: 'shadow-violet-500/20',
    badge: 'bg-violet-900/50 text-violet-300 border-violet-700/50',
    description: '你发现了隐藏的结局！',
  },
  normal: {
    label: '普通结局',
    emoji: '📖',
    gradient: 'from-slate-400 to-slate-500',
    bgGlow: 'shadow-slate-500/20',
    badge: 'bg-slate-800/50 text-slate-300 border-slate-600/50',
    description: '你完成了这段冒险。',
  },
};

export default function EndingScreen({
  title,
  description,
  endingType,
  stats,
  onRestart,
  onBackToLobby,
  onShare,
}: EndingScreenProps) {
  const config = ENDING_CONFIG[endingType];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className={`mx-4 max-w-md w-full rounded-2xl bg-slate-900/98 border border-slate-700/50 
                       shadow-2xl ${config.bgGlow} overflow-hidden`}>
        {/* 顶部渐变条 */}
        <div className={`h-2 bg-gradient-to-r ${config.gradient}`} />

        <div className="p-8">
          {/* 结局类型标签 */}
          <div className="flex justify-center mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${config.badge}`}>
              {config.label}
            </span>
          </div>

          {/* 大 emoji */}
          <div className="text-center mb-4">
            <span className="text-6xl block">{config.emoji}</span>
          </div>

          {/* 结局标题 */}
          <h2 className={`text-2xl font-bold text-center mb-2 bg-gradient-to-r ${config.gradient} 
                        bg-clip-text text-transparent`}>
            {title}
          </h2>

          {/* 结局描述 */}
          <p className="text-center text-slate-400 text-sm mb-6 leading-relaxed">
            {description}
          </p>

          {/* 分隔线 */}
          <div className="border-t border-slate-700/50 my-6" />

          {/* 统计数据 */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center p-3 rounded-lg bg-slate-800/50">
              <div className="text-2xl font-bold text-violet-400">{stats.daysPlayed}</div>
              <div className="text-xs text-slate-500 mt-1">游玩天数</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-800/50">
              <div className="text-2xl font-bold text-emerald-400">{stats.choicesMade}</div>
              <div className="text-xs text-slate-500 mt-1">做出选择</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-800/50">
              <div className="text-2xl font-bold text-amber-400">{stats.achievementsUnlocked}</div>
              <div className="text-xs text-slate-500 mt-1">达成成就</div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="space-y-3">
            <button
              onClick={onRestart}
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 
                         text-white font-medium text-sm
                         hover:from-violet-500 hover:to-purple-500 transition-all
                         active:scale-[0.98] shadow-lg shadow-violet-600/20"
            >
              🔄 重新开始
            </button>
            <button
              onClick={onBackToLobby}
              className="w-full px-6 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium text-sm
                         border border-slate-700/50 hover:bg-slate-700/80 transition-colors
                         active:scale-[0.98]"
            >
              🏠 返回大厅
            </button>
            {onShare && (
              <button
                onClick={onShare}
                className="w-full px-6 py-3 rounded-xl bg-slate-800/50 text-slate-400 text-sm
                           hover:text-slate-300 hover:bg-slate-700/50 border border-slate-700/30
                           transition-colors"
              >
                📤 分享结局
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
