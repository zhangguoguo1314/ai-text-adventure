'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { StyleTemplate } from '@/types';

interface StyleSelectorProps {
  selectedStyle: number | null;
  onSelect: (id: number, name: string) => void;
  onNext: () => void;
  canNext: boolean;
}

export default function StyleSelector({
  selectedStyle,
  onSelect,
  onNext,
  canNext,
}: StyleSelectorProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['style-templates'],
    queryFn: async () => {
      const res: any = await api.get('/style-templates');
      return res.data as StyleTemplate[];
    },
  });

  const templates = data || [];

  return (
    <div>
      <h2 className="text-lg font-semibold text-[var(--ink)] mb-1">选择叙事文风</h2>
      <p className="text-sm text-[var(--muted)] mb-6">
        选择一种叙事风格，它将影响 AI 生成内容时的语气和文风
      </p>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-violet-600 text-sm">加载文风模板...</span>
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-red-500">
          加载文风模板失败，请刷新重试
        </div>
      )}

      {!isLoading && !error && templates.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {templates.map((template) => {
            const isSelected = selectedStyle === template.id;
            return (
              <button
                key={template.id}
                onClick={() => onSelect(template.id, template.name)}
                className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-violet-500 bg-violet-50 shadow-sm'
                    : 'border-[var(--rule)] hover:border-violet-300 hover:bg-violet-50/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{template.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[var(--ink)] text-sm">{template.name}</h3>
                    {template.preview && (
                      <p className="mt-1 text-xs text-[var(--muted)] line-clamp-2">
                        {template.preview}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {!isLoading && !error && templates.length === 0 && (
        <div className="text-center py-12 text-[var(--muted)]">
          暂无文风模板，请先在管理后台添加
        </div>
      )}

      <div className="flex justify-end mt-6">
        <button
          onClick={onNext}
          disabled={!canNext}
          className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            canNext
              ? 'bg-violet-600 text-white hover:bg-violet-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          下一步
        </button>
      </div>
    </div>
  );
}
