'use client';

interface ChoiceButtonsProps {
  choices: string[];
  onSelect: (choice: string, index: number) => void;
  disabled?: boolean;
}

export default function ChoiceButtons({
  choices,
  onSelect,
  disabled,
}: ChoiceButtonsProps) {
  if (!choices || choices.length === 0) return null;

  return (
    <div className="space-y-3 w-full">
      {choices.map((choice, index) => (
        <button
          key={index}
          onClick={() => onSelect(choice, index)}
          disabled={disabled}
          className="w-full p-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 
                     text-white text-left transition-all duration-200
                     hover:from-violet-500 hover:to-purple-500 
                     hover:shadow-lg hover:shadow-violet-500/25
                     disabled:opacity-50 disabled:cursor-not-allowed
                     active:scale-[0.98]
                     border border-violet-500/30"
        >
          <span className="text-violet-300 mr-2 font-mono">
            {String.fromCharCode(65 + index)}.
          </span>
          {choice}
        </button>
      ))}
    </div>
  );
}
