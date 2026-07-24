'use client';

export interface NpcRelation {
  id: string;
  name: string;
  relation: number; // 0-100
  avatar?: string; // emoji 或 URL
}

interface NpcRelationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  npcs: NpcRelation[];
  onTalkTo: (npcId: string) => void;
}

interface RelationLevel {
  min: number;
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  barColor: string;
}

const RELATION_LEVELS: RelationLevel[] = [
  { min: 0, label: '陌生人', color: 'bg-slate-500', bgColor: 'bg-slate-900/50', textColor: 'text-slate-400', barColor: 'bg-slate-500' },
  { min: 20, label: '熟人', color: 'bg-slate-300', bgColor: 'bg-slate-800/50', textColor: 'text-slate-300', barColor: 'bg-slate-400' },
  { min: 40, label: '朋友', color: 'bg-emerald-500', bgColor: 'bg-emerald-900/30', textColor: 'text-emerald-400', barColor: 'bg-emerald-500' },
  { min: 60, label: '亲密', color: 'bg-blue-500', bgColor: 'bg-blue-900/30', textColor: 'text-blue-400', barColor: 'bg-blue-500' },
  { min: 80, label: '挚友', color: 'bg-purple-500', bgColor: 'bg-purple-900/30', textColor: 'text-purple-400', barColor: 'bg-purple-500' },
];

function getRelationLevel(relation: number): RelationLevel {
  for (let i = RELATION_LEVELS.length - 1; i >= 0; i--) {
    if (relation >= RELATION_LEVELS[i].min) return RELATION_LEVELS[i];
  }
  return RELATION_LEVELS[0];
}

function getInitial(name: string) {
  return name.charAt(0);
}

export default function NpcRelationPanel({
  isOpen,
  onClose,
  npcs,
  onTalkTo,
}: NpcRelationPanelProps) {
  if (!isOpen) return null;

  const sortedNpcs = [...npcs].sort((a, b) => b.relation - a.relation);

  return (
    <>
      {/* 遮罩 */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />

      {/* 面板 */}
      <div className="fixed right-0 top-0 h-full z-50 w-80 bg-slate-900/98 border-l border-slate-700 
                     backdrop-blur-sm overflow-y-auto animate-slide-in-right">
        {/* 头部 */}
        <div className="sticky top-0 bg-slate-900/98 border-b border-slate-700/50 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🤝</span> NPC 关系
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* NPC 列表 */}
        <div className="p-4">
          {sortedNpcs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <span className="text-4xl mb-3">👤</span>
              <p className="text-sm">尚未遇到任何 NPC</p>
              <p className="text-xs text-slate-600 mt-1">在冒险中探索，结识新伙伴</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedNpcs.map((npc) => {
                const level = getRelationLevel(npc.relation);

                return (
                  <div
                    key={npc.id}
                    className={`p-3 rounded-lg border ${level.bgColor} ${level.textColor}
                               border-slate-700/30 hover:border-slate-600/50 transition-all`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {/* 头像首字母 */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center 
                                      text-lg font-bold border-2 ${level.color}/30
                                      bg-slate-800 ${level.textColor}`}>
                        {npc.avatar || getInitial(npc.name)}
                      </div>

                      {/* 名字 + 好感度标签 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-200 truncate">{npc.name}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${level.color} ${level.textColor}`}>
                            {level.label}
                          </span>
                        </div>
                      </div>

                      {/* 数值 */}
                      <span className="text-sm text-slate-400 tabular-nums">{npc.relation}</span>
                    </div>

                    {/* 进度条 */}
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${level.barColor}`}
                        style={{ width: `${npc.relation}%` }}
                      />
                    </div>

                    {/* 对话按钮 */}
                    <button
                      onClick={() => onTalkTo(npc.id)}
                      className="w-full px-3 py-1.5 rounded-md bg-slate-800/80 text-slate-400 text-xs 
                                 hover:text-violet-400 hover:bg-slate-700/80 border border-slate-700/50
                                 transition-colors"
                    >
                      💬 对话
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
