'use client';

import Link from 'next/link';

interface GameHeaderProps {
  title: string;
  onSavePanel?: React.ReactNode;
}

export default function GameHeader({ title, onSavePanel }: GameHeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-slate-900/80 
                       border-b border-slate-700/50 backdrop-blur-sm">
      {/* 左侧：返回 + 标题 */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 
                     transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        <h1 className="text-white font-medium truncate max-w-xs">{title}</h1>
      </div>

      {/* 右侧：操作按钮 */}
      <div className="flex items-center gap-2 relative">
        {onSavePanel}
        <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 
                           transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}
