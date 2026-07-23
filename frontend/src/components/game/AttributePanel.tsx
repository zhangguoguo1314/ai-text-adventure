'use client';

import { useState } from 'react';

interface AttributePanelProps {
  attributes: Record<string, any>;
}

export default function AttributePanel({ attributes }: AttributePanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const entries = Object.entries(attributes);
  if (entries.length === 0) return null;

  return (
    <>
      {/* 切换按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-4 top-1/2 -translate-y-1/2 z-50
                   px-3 py-2 rounded-l-lg bg-slate-800/90 border border-r-0 border-slate-700
                   text-slate-400 hover:text-violet-400 transition-colors
                   backdrop-blur-sm"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={
              isOpen
                ? 'M13 5l7 7-7 7M5 5l7 7-7 7'
                : 'M11 19l-7-7 7-7m8 14l-7-7 7-7'
            }
          />
        </svg>
      </button>

      {/* 属性面板 */}
      <div
        className={`fixed right-0 top-0 h-full z-40 w-72 bg-slate-900/95 border-l border-slate-700
                    backdrop-blur-sm transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            属性面板
          </h3>

          <div className="space-y-4">
            {entries.map(([key, value]) => (
              <div key={key} className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-2">{key}</div>
                <div className="text-2xl font-bold text-violet-400">
                  {typeof value === 'number' ? value : String(value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 遮罩（可选） */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
