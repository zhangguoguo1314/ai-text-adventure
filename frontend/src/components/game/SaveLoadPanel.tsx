'use client';

import { useState, useEffect } from 'react';

interface Save {
  id: number;
  description: string;
  isAuto: boolean;
  createdAt: string;
}

interface SaveLoadPanelProps {
  saves: Save[];
  onSave: (description?: string) => void;
  onLoad?: (saveId: number) => void;
  onRefresh: () => void;
}

export default function SaveLoadPanel({
  saves,
  onSave,
  onLoad,
  onRefresh,
}: SaveLoadPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [saveDesc, setSaveDesc] = useState('');

  const handleSave = () => {
    onSave(saveDesc || undefined);
    setSaveDesc('');
  };

  return (
    <>
      {/* 切换按钮 */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) onRefresh();
        }}
        className="px-3 py-2 rounded-lg bg-slate-800/80 text-slate-400 
                   hover:text-violet-400 border border-slate-700
                   transition-colors text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
          />
        </svg>
      </button>

      {/* 存档面板 */}
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-80 bg-slate-800/95 border border-slate-700 
                        rounded-xl shadow-xl backdrop-blur-sm z-50 overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-white font-medium mb-3">存档管理</h3>

            {/* 快速存档 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={saveDesc}
                onChange={(e) => setSaveDesc(e.target.value)}
                placeholder="存档备注（可选）"
                className="flex-1 px-3 py-2 rounded-lg bg-slate-700 text-slate-200 
                           placeholder-slate-500 text-sm
                           focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm
                           hover:bg-violet-500 transition-colors"
              >
                存档
              </button>
            </div>
          </div>

          {/* 存档列表 */}
          <div className="max-h-64 overflow-y-auto">
            {saves.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm">
                暂无存档
              </div>
            ) : (
              saves.map((save) => (
                <div
                  key={save.id}
                  className="p-3 hover:bg-slate-700/50 transition-colors 
                             border-b border-slate-700/50 last:border-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 text-sm truncate">
                        {save.description}
                      </p>
                      <p className="text-slate-500 text-xs mt-1">
                        {new Date(save.createdAt).toLocaleString('zh-CN')}
                        {save.isAuto && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-slate-700 text-slate-400">
                            自动
                          </span>
                        )}
                      </p>
                    </div>
                    {onLoad && (
                      <button
                        onClick={() => onLoad(save.id)}
                        className="ml-2 px-3 py-1.5 rounded-lg bg-violet-600/20 text-violet-400 
                                   text-xs hover:bg-violet-600/30 transition-colors"
                      >
                        读取
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
