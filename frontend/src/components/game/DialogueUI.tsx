'use client';

import { useState, useRef, useEffect } from 'react';

export interface DialogueData {
  npcId: string;
  npcName: string;
  npcAvatar?: string; // emoji
  relationLevel: string;
  text: string;
  choices?: DialogueChoice[];
  giftItems?: GiftItem[];
}

export interface DialogueChoice {
  text: string;
  karmaEffect?: number;
  relationEffect?: number;
}

export interface GiftItem {
  id: string;
  name: string;
  emoji: string;
}

interface DialogueUIProps {
  dialogue: DialogueData;
  onSelectChoice: (choiceIndex: number) => void;
  onSendGift: (itemId: string) => void;
  onEndDialogue: () => void;
}

export default function DialogueUI({
  dialogue,
  onSelectChoice,
  onSendGift,
  onEndDialogue,
}: DialogueUIProps) {
  const [showGiftMenu, setShowGiftMenu] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dialogue.text]);

  return (
    <div className="mx-auto max-w-lg w-full">
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/90 backdrop-blur-sm overflow-hidden
                      shadow-lg">
        {/* NPC 头部 */}
        <div className="px-4 py-3 border-b border-slate-700/30 flex items-center gap-3">
          {/* NPC 头像 */}
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-violet-500/30 
                          flex items-center justify-center text-xl flex-shrink-0">
            {dialogue.npcAvatar || dialogue.npcName.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">{dialogue.npcName}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-violet-900/50 text-violet-300 
                               border border-violet-700/50">
                {dialogue.relationLevel}
              </span>
            </div>
          </div>

          {/* 关闭按钮 */}
          <button
            onClick={onEndDialogue}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
            title="结束对话"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 对话内容 */}
        <div className="p-4 space-y-4">
          {/* NPC 对话气泡 */}
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/50 
                            flex items-center justify-center text-sm flex-shrink-0 mt-1">
              {dialogue.npcAvatar || dialogue.npcName.charAt(0)}
            </div>
            <div className="flex-1 bg-slate-800/80 rounded-xl rounded-tl-none px-4 py-3 
                           border border-slate-700/30">
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {dialogue.text}
              </p>
            </div>
          </div>

          {/* 对话选项 */}
          {dialogue.choices && dialogue.choices.length > 0 && (
            <div className="space-y-2 animate-fade-in">
              {dialogue.choices.map((choice, i) => (
                <button
                  key={i}
                  onClick={() => onSelectChoice(i)}
                  className="w-full p-3 rounded-lg text-left text-sm transition-all
                             bg-slate-800/50 text-slate-300 border border-slate-700/30
                             hover:bg-violet-600/20 hover:border-violet-500/30 hover:text-violet-300
                             active:scale-[0.98]"
                >
                  <span className="text-violet-500 mr-2 font-mono text-xs">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {choice.text}
                  {/* 效果提示 */}
                  <div className="flex gap-2 mt-1.5">
                    {choice.karmaEffect && (
                      <span className={`text-[10px] ${choice.karmaEffect > 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                        善恶 {choice.karmaEffect > 0 ? '+' : ''}{choice.karmaEffect}
                      </span>
                    )}
                    {choice.relationEffect && (
                      <span className={`text-[10px] ${choice.relationEffect > 0 ? 'text-blue-400' : 'text-red-400'}`}>
                        好感 {choice.relationEffect > 0 ? '+' : ''}{choice.relationEffect}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* 送礼按钮 */}
          {dialogue.giftItems && dialogue.giftItems.length > 0 && (
            <div className="animate-fade-in">
              {!showGiftMenu ? (
                <button
                  onClick={() => setShowGiftMenu(true)}
                  className="w-full px-4 py-2 rounded-lg bg-amber-900/20 text-amber-400 text-sm 
                             border border-amber-700/30 hover:bg-amber-900/30 transition-colors"
                >
                  🎁 赠送礼物
                </button>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">选择礼物</span>
                    <button
                      onClick={() => setShowGiftMenu(false)}
                      className="text-xs text-slate-500 hover:text-slate-300"
                    >
                      取消
                    </button>
                  </div>
                  {dialogue.giftItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { onSendGift(item.id); setShowGiftMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md 
                                 bg-slate-800/50 text-slate-300 text-xs hover:bg-slate-700/50
                                 transition-colors border border-slate-700/30"
                    >
                      <span>{item.emoji}</span>
                      <span>{item.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 滚动锚点 */}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
}
