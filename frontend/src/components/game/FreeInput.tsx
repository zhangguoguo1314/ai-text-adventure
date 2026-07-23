'use client';

import { useState } from 'react';

interface FreeInputProps {
  onSubmit: (action: string) => void;
  disabled?: boolean;
}

export default function FreeInput({ onSubmit, disabled }: FreeInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="自由输入你想做的事情..."
          rows={1}
          className="w-full px-4 py-3 rounded-xl bg-slate-800/80 text-slate-200 
                     placeholder-slate-500 border border-slate-700
                     focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50
                     resize-none disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
        />
      </div>
      <button
        onClick={handleSubmit}
        disabled={disabled || !input.trim()}
        className="px-5 py-3 rounded-xl bg-violet-600 text-white font-medium
                   hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors flex-shrink-0"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
      </button>
    </div>
  );
}
