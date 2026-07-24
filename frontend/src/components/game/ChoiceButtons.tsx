'use client';

interface ChoiceEffect {
  attribute?: string;
  value?: number;
  npcId?: string;
  npcRelationChange?: number;
}

export interface ChoiceData {
  text: string;
  type?: 'combat' | 'dialogue' | 'exploration' | 'normal';
  condition?: {
    attribute: string;
    required: number;
    current?: number;
  };
  effects?: ChoiceEffect[];
}

interface ChoiceButtonsProps {
  choices: ChoiceData[] | string[];
  onSelect: (choice: string, index: number) => void;
  disabled?: boolean;
}

const TYPE_CONFIG: Record<string, { emoji: string; label: string; gradient: string; border: string }> = {
  combat: {
    emoji: '⚔️',
    label: '战斗',
    gradient: 'from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500',
    border: 'border-red-500/30 hover:shadow-red-500/25',
  },
  dialogue: {
    emoji: '💬',
    label: '对话',
    gradient: 'from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500',
    border: 'border-blue-500/30 hover:shadow-blue-500/25',
  },
  exploration: {
    emoji: '🔍',
    label: '探索',
    gradient: 'from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500',
    border: 'border-emerald-500/30 hover:shadow-emerald-500/25',
  },
  normal: {
    emoji: '',
    label: '',
    gradient: 'from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500',
    border: 'border-violet-500/30 hover:shadow-violet-500/25',
  },
};

function isChoiceData(choice: string | ChoiceData): choice is ChoiceData {
  return typeof choice === 'object' && choice !== null && 'text' in choice;
}

function ChoiceButton({
  text,
  type,
  condition,
  effects,
  index,
  disabled,
  onSelect,
}: {
  text: string;
  type: string;
  condition: ChoiceData['condition'];
  effects: ChoiceEffect[] | undefined;
  index: number;
  disabled: boolean;
  onSelect: (text: string, index: number) => void;
}) {
  const isLocked = condition && condition.current !== undefined && condition.current < condition.required;
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.normal;

  return (
    <div className="relative group/choice">
      <button
        onClick={() => !isLocked && onSelect(text, index)}
        disabled={disabled || isLocked}
        className={`w-full p-4 rounded-xl text-white text-left transition-all duration-200
                   bg-gradient-to-r ${config.gradient}
                   hover:shadow-lg
                   disabled:cursor-not-allowed
                   active:scale-[0.98]
                   border ${config.border}
                   ${isLocked ? 'opacity-40 grayscale' : ''}`}
      >
        <div className="flex items-center gap-2">
          {/* 选项类型标记 */}
          {config.emoji && (
            <span className="text-base flex-shrink-0">{config.emoji}</span>
          )}

          {/* 锁定图标 */}
          {isLocked && (
            <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          )}

          <span className={`text-violet-300 mr-1 font-mono ${isLocked ? 'text-slate-500' : ''}`}>
            {String.fromCharCode(65 + index)}.
          </span>
          <span className={`${isLocked ? 'text-slate-400' : ''}`}>{text}</span>
        </div>

        {/* 条件不足提示 */}
        {isLocked && condition && (
          <div className="mt-1.5 text-xs text-red-400/70">
            需要 {condition.attribute}{' >= '}{condition.required}
            {condition.current !== undefined && ` (当前: ${condition.current})`}
          </div>
        )}
      </button>

      {/* 效果预览悬浮提示 - 使用 CSS group hover */}
      {effects && effects.length > 0 && !isLocked && (
        <div className="absolute left-0 bottom-full mb-2 w-full p-3 rounded-lg 
                      bg-slate-800/95 border border-slate-700 shadow-xl z-50
                      opacity-0 invisible group-hover/choice:opacity-100 group-hover/choice:visible
                      transition-all duration-200 pointer-events-none">
          <p className="text-xs text-slate-400 mb-2">可能的影响：</p>
          <div className="flex flex-wrap gap-1.5">
            {effects.map((effect, i) => (
              <div key={i} className="flex items-center gap-1">
                {effect.attribute && (
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    (effect.value ?? 0) > 0
                      ? 'bg-emerald-900/50 text-emerald-300'
                      : 'bg-red-900/50 text-red-300'
                  }`}>
                    {effect.attribute} {effect.value! > 0 ? '+' : ''}{effect.value}
                  </span>
                )}
                {effect.npcId && effect.npcRelationChange && (
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    effect.npcRelationChange > 0
                      ? 'bg-blue-900/50 text-blue-300'
                      : 'bg-red-900/50 text-red-300'
                  }`}>
                    好感度 {effect.npcRelationChange > 0 ? '+' : ''}{effect.npcRelationChange}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChoiceButtons({
  choices,
  onSelect,
  disabled,
}: ChoiceButtonsProps) {
  if (!choices || choices.length === 0) return null;

  return (
    <div className="space-y-3 w-full">
      {choices.map((choice, index) => {
        let text: string;
        let type: string = 'normal';
        let condition: ChoiceData['condition'] = undefined;
        let effects: ChoiceEffect[] | undefined;

        if (isChoiceData(choice)) {
          text = choice.text;
          type = choice.type || 'normal';
          condition = choice.condition || undefined;
          effects = choice.effects;
        } else {
          text = choice;
        }

        return (
          <ChoiceButton
            key={index}
            text={text}
            type={type}
            condition={condition}
            effects={effects}
            index={index}
            disabled={!!disabled}
            onSelect={onSelect}
          />
        );
      })}
    </div>
  );
}
