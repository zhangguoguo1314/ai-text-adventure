'use client';

export interface Skill {
  id: string;
  name: string;
  emoji: string;
  level: number;
  maxLevel: number;
  description: string;
  cooldown?: number; // 当前冷却（秒）
  maxCooldown?: number; // 最大冷却（秒）
  mpCost?: number;
  type: 'combat' | 'exploration' | 'social';
}

interface SkillPanelProps {
  isOpen: boolean;
  onClose: () => void;
  skills: Skill[];
  onUseSkill: (skillId: string) => void;
  inCombat?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  combat: '战斗',
  exploration: '探索',
  social: '社交',
};

const TYPE_COLORS: Record<string, string> = {
  combat: 'bg-red-900/50 text-red-300 border-red-700/50',
  exploration: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50',
  social: 'bg-blue-900/50 text-blue-300 border-blue-700/50',
};

export default function SkillPanel({
  isOpen,
  onClose,
  skills,
  onUseSkill,
  inCombat,
}: SkillPanelProps) {
  if (!isOpen) return null;

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
              <span>⚡</span> 技能
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

        {/* 技能列表 */}
        <div className="p-4">
          {skills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <span className="text-4xl mb-3">📖</span>
              <p className="text-sm">尚未学习任何技能</p>
              <p className="text-xs text-slate-600 mt-1">在冒险中探索，解锁新技能</p>
            </div>
          ) : (
            <div className="space-y-3">
              {skills.map((skill) => {
                const isOnCooldown = (skill.cooldown ?? 0) > 0;
                const isUsable = inCombat
                  ? skill.type === 'combat' && !isOnCooldown
                  : !isOnCooldown;

                return (
                  <div
                    key={skill.id}
                    className={`p-3 rounded-lg border transition-all
                      ${isOnCooldown
                        ? 'bg-slate-800/30 border-slate-700/20 opacity-60'
                        : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50'
                      }`}
                  >
                    {/* 技能头部 */}
                    <div className="flex items-start gap-3">
                      {/* emoji 图标 */}
                      <span className={`text-2xl flex-shrink-0 w-12 h-12 flex items-center justify-center 
                                       rounded-lg border
                                       ${isOnCooldown
                                         ? 'bg-slate-800 border-slate-700/30 grayscale'
                                         : 'bg-slate-800/80 border-slate-700/50'
                                       }`}>
                        {skill.emoji}
                      </span>

                      {/* 信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-medium ${isOnCooldown ? 'text-slate-500' : 'text-slate-200'}`}>
                            {skill.name}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] border ${TYPE_COLORS[skill.type] || ''}`}>
                            {TYPE_LABELS[skill.type]}
                          </span>
                        </div>

                        {/* 等级 */}
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-xs text-slate-500">Lv.{skill.level}</span>
                          <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden max-w-20">
                            <div
                              className="h-full bg-violet-500 rounded-full transition-all duration-500"
                              style={{ width: `${(skill.level / skill.maxLevel) * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-600">{skill.maxLevel}</span>
                        </div>

                        <p className="text-xs text-slate-500 line-clamp-2">{skill.description}</p>
                      </div>
                    </div>

                    {/* 底部信息 + 操作 */}
                    <div className="mt-3 pt-2 border-t border-slate-700/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* MP 消耗 */}
                        {skill.mpCost && (
                          <span className="text-xs text-blue-400">
                            💧 {skill.mpCost} MP
                          </span>
                        )}
                        {/* 冷却 */}
                        {skill.maxCooldown && skill.maxCooldown > 0 && (
                          <span className={`text-xs ${isOnCooldown ? 'text-amber-400' : 'text-slate-500'}`}>
                            {isOnCooldown
                              ? `⏳ 冷却中 ${skill.cooldown}s`
                              : `⏱️ ${skill.maxCooldown}s`
                            }
                          </span>
                        )}
                      </div>

                      {/* 使用按钮 */}
                      {isUsable && (
                        <button
                          onClick={() => onUseSkill(skill.id)}
                          className="px-3 py-1 rounded-md bg-violet-600 text-white text-xs 
                                     hover:bg-violet-500 transition-colors"
                        >
                          使用
                        </button>
                      )}
                    </div>
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
