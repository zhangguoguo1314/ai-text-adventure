'use client';

import KarmaIndicator from './KarmaIndicator';

export interface GameWorldState {
  location: string;
  timeOfDay: string;
  day: number;
  chapter: number;
  gold: number;
  karma: number;
}

interface TopStatusBarProps {
  worldState: GameWorldState;
}

const TIME_EMOJI: Record<string, string> = {
  '早晨': '🌅',
  '中午': '☀️',
  '下午': '🌤️',
  '傍晚': '🌇',
  '夜晚': '🌙',
};

function getTimeEmoji(time: string) {
  if (TIME_EMOJI[time]) return TIME_EMOJI[time];
  return '🕐';
}

export default function TopStatusBar({ worldState }: TopStatusBarProps) {
  const { location, timeOfDay, day, chapter, gold, karma } = worldState;

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-slate-900/60 border-b border-slate-700/30">
      {/* 左侧信息 */}
      <div className="flex items-center gap-3 text-sm">
        {/* 位置 */}
        <div className="flex items-center gap-1.5 text-slate-400">
          <span>📍</span>
          <span className="text-slate-300">{location || '未知之地'}</span>
        </div>

        {/* 分隔符 */}
        <span className="text-slate-700">|</span>

        {/* 时间 */}
        <div className="flex items-center gap-1.5 text-slate-400">
          <span>{getTimeEmoji(timeOfDay)}</span>
          <span className="text-slate-300">{timeOfDay || '未知'}</span>
        </div>

        {/* 分隔符 */}
        <span className="text-slate-700">|</span>

        {/* 天数 */}
        <div className="flex items-center gap-1.5 text-slate-400">
          <span>📅</span>
          <span className="text-slate-300">第 {day || 1} 天</span>
        </div>

        {/* 分隔符 */}
        <span className="text-slate-700">|</span>

        {/* 章节 */}
        <div className="flex items-center gap-1.5 text-slate-400">
          <span>📖</span>
          <span className="text-slate-300">第 {chapter || 1} 章</span>
        </div>
      </div>

      {/* 右侧信息 */}
      <div className="flex items-center gap-4">
        {/* 善恶值 */}
        <KarmaIndicator value={karma ?? 0} />

        {/* 金币 */}
        <div className="flex items-center gap-1.5 text-sm">
          <span>💰</span>
          <span className="text-amber-400 font-medium tabular-nums">
            {gold ?? 0}
          </span>
        </div>
      </div>
    </div>
  );
}
