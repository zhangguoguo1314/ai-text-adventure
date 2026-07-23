'use client';

import { useEffect, useRef } from 'react';

interface NarrativeTextProps {
  content: string;
  isStreaming?: boolean;
}

export default function NarrativeText({ content, isStreaming }: NarrativeTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [content]);

  if (!content) return null;

  // 简单的富文本处理：支持 **加粗** 和 ---分隔线
  const renderContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // 分隔线
      if (line.trim() === '---') {
        return <hr key={i} className="border-slate-700 my-4" />;
      }

      // 处理加粗 **text**
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      const rendered = parts.map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <span key={j} className="font-bold text-violet-300">
              {part.slice(2, -2)}
            </span>
          );
        }
        return <span key={j}>{part}</span>;
      });

      return (
        <p key={i} className="mb-3 leading-relaxed text-slate-200 text-lg">
          {rendered}
        </p>
      );
    });
  };

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
      <div className="prose prose-invert max-w-none">
        {renderContent(content)}
        {isStreaming && (
          <span className="inline-block w-0.5 h-5 bg-violet-400 animate-pulse ml-0.5" />
        )}
      </div>
    </div>
  );
}
