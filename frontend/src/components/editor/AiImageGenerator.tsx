'use client';

import { useCallback } from 'react';
import { useAiImage } from '@/lib/useAiImage';

export type AiImageType = 'avatar' | 'scene' | 'cover';

export interface AiImageInputData {
  name?: string;
  personality?: string;
  description?: string;
  title?: string;
  desc?: string;
  category?: string;
  mood?: string;
  style?: string;
}

interface AiImageGeneratorProps {
  /** 生成类型 */
  type: AiImageType;
  /** 生成完成后的回调（返回图片 URL） */
  onGenerated: (url: string) => void;
  /** 输入数据 */
  inputData?: AiImageInputData;
}

const TYPE_LABEL: Record<AiImageType, string> = {
  avatar: '头像',
  scene: '场景插图',
  cover: '剧本封面',
};

const TYPE_SIZES: Record<AiImageType, string> = {
  avatar: 'w-28 h-28 rounded-full',
  scene: 'w-full max-w-xs aspect-square rounded-lg',
  cover: 'w-full max-w-sm aspect-[2/1] rounded-lg',
};

export default function AiImageGenerator({
  type,
  onGenerated,
  inputData,
}: AiImageGeneratorProps) {
  const { loading, error, imageUrl, reset, generateAvatar, generateScene, generateCover } =
    useAiImage();

  const handleGenerate = useCallback(async () => {
    reset();
    // hook 内部会更新 imageUrl 用于预览，这里无需捕获返回值
    if (type === 'avatar') {
      const name = inputData?.name?.trim() || '';
      const personality = inputData?.personality?.trim() || '';
      if (!name || !personality) return;
      await generateAvatar(name, personality, inputData?.style);
    } else if (type === 'scene') {
      const description = inputData?.description?.trim() || '';
      if (!description) return;
      await generateScene(description, inputData?.mood);
    } else {
      const title = inputData?.title?.trim() || '';
      const desc = inputData?.desc?.trim() || '';
      const category = inputData?.category || 'adventure';
      if (!title) return;
      await generateCover(title, desc, category);
    }
  }, [
    type,
    inputData,
    reset,
    generateAvatar,
    generateScene,
    generateCover,
  ]);

  const handleRegenerate = useCallback(() => {
    handleGenerate();
  }, [handleGenerate]);

  const handleApply = useCallback(() => {
    if (imageUrl) onGenerated(imageUrl);
  }, [imageUrl, onGenerated]);

  const label = TYPE_LABEL[type];
  const sizeClass = TYPE_SIZES[type];

  return (
    <div className="space-y-3">
      {/* 生成按钮 / 状态 */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.456-2.456L14.25 6l1.035-.259a3.375 3.375 0 002.456-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
              </svg>
              AI 生成{label}
            </>
          )}
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <p className="text-xs text-[var(--danger)]">{error}</p>
      )}

      {/* 预览区域 */}
      {imageUrl && (
        <div className="space-y-2">
          <div className="flex justify-center p-3 rounded-lg bg-[var(--bg3)] border border-[var(--rule)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={`AI 生成${label}`}
              className={`${sizeClass} object-cover border border-[var(--rule)] shadow-sm`}
              style={{ animation: 'fade-in 0.4s ease-out' }}
            />
          </div>
          <div className="flex justify-center gap-2">
            <button
              onClick={handleRegenerate}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg text-xs border border-[var(--rule)] text-[var(--muted)] hover:border-violet-300 hover:text-violet-600 disabled:opacity-50 transition-colors"
            >
              重新生成
            </button>
            <button
              onClick={handleApply}
              className="px-3 py-1.5 rounded-lg text-xs bg-violet-600 text-white hover:bg-violet-700 transition-colors"
            >
              应用此图片
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
