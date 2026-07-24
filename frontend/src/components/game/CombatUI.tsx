'use client';

import { useState } from 'react';

export interface CombatEnemy {
  name: string;
  emoji: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
}

export interface CombatPlayer {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number;
}

export interface CombatSkill {
  id: string;
  name: string;
  emoji: string;
  mpCost: number;
  damage?: number;
  description: string;
}

export interface CombatItem {
  id: string;
  name: string;
  emoji: string;
  healAmount?: number;
  description: string;
}

interface CombatUIProps {
  enemy: CombatEnemy;
  player: CombatPlayer;
  skills: CombatSkill[];
  items: CombatItem[];
  combatLog: string[];
  onAttack: () => void;
  onDefend: () => void;
  onUseSkill: (skillId: string) => void;
  onUseItem: (itemId: string) => void;
  onFlee: () => void;
  result?: 'victory' | 'defeat' | null;
  reward?: string;
}

export default function CombatUI({
  enemy,
  player,
  skills,
  items,
  combatLog,
  onAttack,
  onDefend,
  onUseSkill,
  onUseItem,
  onFlee,
  result,
  reward,
}: CombatUIProps) {
  const [showSkillMenu, setShowSkillMenu] = useState(false);
  const [showItemMenu, setShowItemMenu] = useState(false);

  const enemyHpPercent = (enemy.hp / enemy.maxHp) * 100;
  const playerHpPercent = (player.hp / player.maxHp) * 100;
  const playerMpPercent = (player.mp / player.maxMp) * 100;

  const isFinished = result !== null && result !== undefined;

  return (
    <div className="mx-auto max-w-lg w-full">
      {/* 战斗界面 */}
      <div className="rounded-xl border border-red-900/50 bg-slate-900/90 backdrop-blur-sm overflow-hidden
                      shadow-lg shadow-red-900/20">
        {/* 战斗标题 */}
        <div className="px-4 py-2 bg-gradient-to-r from-red-900/50 to-slate-900/50 border-b border-red-900/30
                        flex items-center justify-center">
          <span className="text-red-400 text-sm font-medium flex items-center gap-2">
            <span className="animate-pulse">⚔️</span> 战斗
          </span>
        </div>

        <div className="p-4 space-y-4">
          {/* 敌方信息 */}
          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{enemy.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-red-300">{enemy.name}</span>
                  <span className="text-xs text-slate-500">
                    ATK {enemy.attack} | DEF {enemy.defense}
                  </span>
                </div>
                {/* HP 条 */}
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${enemyHpPercent}%`,
                      background: 'linear-gradient(to right, #dc2626, #ef4444)',
                    }}
                  />
                </div>
                <div className="text-right text-xs text-slate-500 mt-0.5">
                  {enemy.hp} / {enemy.maxHp}
                </div>
              </div>
            </div>
          </div>

          {/* 玩家信息 */}
          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-emerald-400">HP</span>
                  <span className="text-xs text-slate-500">
                    {player.hp} / {player.maxHp}
                  </span>
                </div>
                <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${playerHpPercent}%`,
                      background: 'linear-gradient(to right, #16a34a, #22c55e)',
                    }}
                  />
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-blue-400">MP</span>
                  <span className="text-xs text-slate-500">
                    {player.mp} / {player.maxMp}
                  </span>
                </div>
                <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-blue-500"
                    style={{ width: `${playerMpPercent}%` }}
                  />
                </div>
              </div>

              <div className="text-xs text-slate-500 space-y-0.5">
                <div>ATK {player.attack}</div>
                <div>DEF {player.defense}</div>
                <div>SPD {player.speed}</div>
              </div>
            </div>
          </div>

          {/* 战斗日志 */}
          {combatLog.length > 0 && (
            <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/50 max-h-32 overflow-y-auto">
              <div className="space-y-1">
                {combatLog.map((log, i) => (
                  <p
                    key={i}
                    className="text-xs text-slate-400 leading-relaxed animate-fade-in"
                  >
                    {log}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* 行动按钮 */}
          {!isFinished && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setShowSkillMenu(false); setShowItemMenu(false); onAttack(); }}
                  className="px-4 py-2.5 rounded-lg bg-red-600/80 text-white text-sm font-medium 
                             hover:bg-red-500 transition-colors border border-red-500/30
                             active:scale-[0.98]"
                >
                  ⚔️ 攻击
                </button>
                <button
                  onClick={() => { setShowSkillMenu(false); setShowItemMenu(false); onDefend(); }}
                  className="px-4 py-2.5 rounded-lg bg-blue-600/80 text-white text-sm font-medium 
                             hover:bg-blue-500 transition-colors border border-blue-500/30
                             active:scale-[0.98]"
                >
                  🛡️ 防御
                </button>
                <button
                  onClick={() => { setShowItemMenu(false); setShowSkillMenu(!showSkillMenu); }}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border
                    active:scale-[0.98]
                    ${showSkillMenu
                      ? 'bg-violet-600 text-white border-violet-500/30'
                      : 'bg-slate-700/80 text-slate-300 border-slate-600/50 hover:bg-slate-600/80'
                    }`}
                >
                  ⚡ 技能
                </button>
                <button
                  onClick={() => { setShowSkillMenu(false); setShowItemMenu(!showItemMenu); }}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border
                    active:scale-[0.98]
                    ${showItemMenu
                      ? 'bg-emerald-600 text-white border-emerald-500/30'
                      : 'bg-slate-700/80 text-slate-300 border-slate-600/50 hover:bg-slate-600/80'
                    }`}
                >
                  🧪 物品
                </button>
              </div>

              {/* 逃跑 */}
              <button
                onClick={() => { setShowSkillMenu(false); setShowItemMenu(false); onFlee(); }}
                className="w-full px-4 py-2 rounded-lg bg-slate-800/80 text-slate-500 text-sm 
                           hover:text-slate-300 hover:bg-slate-700/80 border border-slate-700/50
                           transition-colors"
              >
                🏃 逃跑
              </button>

              {/* 技能子菜单 */}
              {showSkillMenu && (
                <div className="p-3 rounded-lg bg-slate-800/80 border border-violet-700/30 animate-fade-in">
                  <h4 className="text-xs text-slate-400 mb-2">可用技能</h4>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {skills.length === 0 ? (
                      <p className="text-xs text-slate-600 text-center py-2">无可用技能</p>
                    ) : (
                      skills.map((skill) => (
                        <button
                          key={skill.id}
                          onClick={() => { onUseSkill(skill.id); setShowSkillMenu(false); }}
                          disabled={player.mp < skill.mpCost}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-md 
                                     bg-slate-700/50 text-slate-300 text-xs hover:bg-slate-700
                                     transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <span className="flex items-center gap-2">
                            <span>{skill.emoji}</span>
                            <span>{skill.name}</span>
                          </span>
                          <span className="text-blue-400">{skill.mpCost} MP</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 物品子菜单 */}
              {showItemMenu && (
                <div className="p-3 rounded-lg bg-slate-800/80 border border-emerald-700/30 animate-fade-in">
                  <h4 className="text-xs text-slate-400 mb-2">消耗品</h4>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {items.length === 0 ? (
                      <p className="text-xs text-slate-600 text-center py-2">无可用物品</p>
                    ) : (
                      items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => { onUseItem(item.id); setShowItemMenu(false); }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-md 
                                     bg-slate-700/50 text-slate-300 text-xs hover:bg-slate-700
                                     transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <span>{item.emoji}</span>
                            <span>{item.name}</span>
                          </span>
                          {item.healAmount && (
                            <span className="text-emerald-400">+{item.healAmount} HP</span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 胜利/失败结算 */}
          {isFinished && (
            <div className={`p-4 rounded-lg border text-center animate-fade-in
              ${result === 'victory'
                ? 'bg-emerald-900/30 border-emerald-700/50'
                : 'bg-red-900/30 border-red-700/50'
              }`}
            >
              <span className="text-3xl mb-2 block">{result === 'victory' ? '🎉' : '💀'}</span>
              <h3 className={`text-lg font-bold mb-1
                ${result === 'victory' ? 'text-emerald-400' : 'text-red-400'}`}>
                {result === 'victory' ? '战斗胜利' : '战斗失败'}
              </h3>
              {reward && (
                <p className="text-sm text-slate-400 mt-2">{reward}</p>
              )}
              <button
                onClick={result === 'victory' ? onAttack : onAttack}
                className="mt-3 px-6 py-2 rounded-lg bg-violet-600 text-white text-sm
                           hover:bg-violet-500 transition-colors"
              >
                {result === 'victory' ? '继续冒险' : '重新挑战'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
