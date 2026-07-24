'use client';

interface QuickActionBarProps {
  inventoryCount: number;
  skillCount: number;
  npcCount: number;
  currentLocation: string;
  onOpenInventory: () => void;
  onOpenSkills: () => void;
  onOpenNpc: () => void;
  onOpenMap: () => void;
  disabled?: boolean;
}

export default function QuickActionBar({
  inventoryCount,
  skillCount,
  npcCount,
  currentLocation,
  onOpenInventory,
  onOpenSkills,
  onOpenNpc,
  onOpenMap,
  disabled,
}: QuickActionBarProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-2">
      {/* 背包 */}
      <button
        onClick={onOpenInventory}
        disabled={disabled}
        className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg 
                   bg-slate-800/80 text-slate-400 hover:text-amber-400 
                   hover:bg-slate-700/80 border border-slate-700/50
                   transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        title="背包"
      >
        <span>🎒</span>
        <span className="hidden sm:inline">背包</span>
        {inventoryCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center 
                         justify-center px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold">
            {inventoryCount}
          </span>
        )}
      </button>

      {/* 技能 */}
      <button
        onClick={onOpenSkills}
        disabled={disabled}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg 
                   bg-slate-800/80 text-slate-400 hover:text-cyan-400 
                   hover:bg-slate-700/80 border border-slate-700/50
                   transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        title="技能"
      >
        <span>⚡</span>
        <span className="hidden sm:inline">技能</span>
        {skillCount > 0 && (
          <span className="text-[10px] text-slate-500">{skillCount}</span>
        )}
      </button>

      {/* NPC 关系 */}
      <button
        onClick={onOpenNpc}
        disabled={disabled}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg 
                   bg-slate-800/80 text-slate-400 hover:text-emerald-400 
                   hover:bg-slate-700/80 border border-slate-700/50
                   transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        title="NPC 关系"
      >
        <span>🤝</span>
        <span className="hidden sm:inline">关系</span>
        {npcCount > 0 && (
          <span className="text-[10px] text-slate-500">{npcCount}</span>
        )}
      </button>

      {/* 地图 */}
      <button
        onClick={onOpenMap}
        disabled={disabled}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg 
                   bg-slate-800/80 text-slate-400 hover:text-violet-400 
                   hover:bg-slate-700/80 border border-slate-700/50
                   transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        title={`地图 - ${currentLocation}`}
      >
        <span>🗺️</span>
        <span className="hidden sm:inline">地图</span>
        <span className="text-[10px] text-slate-500 hidden md:inline truncate max-w-20">
          {currentLocation}
        </span>
      </button>
    </div>
  );
}
