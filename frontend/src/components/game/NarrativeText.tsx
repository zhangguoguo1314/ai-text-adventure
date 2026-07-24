'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface NarrativeTextProps {
  content: string;
  isStreaming?: boolean;
}

/** 匹配 [image:url] 标记，url 不能包含 ] 字符（data URL 中的 ] 已被编码） */
const IMAGE_PATTERN = '\\[image:([^\\]]+)\\]';

export default function NarrativeText({ content, isStreaming }: NarrativeTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [content]);

  if (!content) return null;

  // 渲染一段文本中的 **加粗** 效果
  const renderInlineText = (text: string, keyPrefix: string): ReactNode[] => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <span key={`${keyPrefix}-${j}`} className="font-bold text-violet-300">
            {part.slice(2, -2)}
          </span>
        );
      }
      return <span key={`${keyPrefix}-${j}`}>{part}</span>;
    });
  };

  // 解析单行：分离 [image:url] 标记与普通文本
  const renderLine = (line: string, lineKey: number): ReactNode => {
    const segments: ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    // 每次创建新的正则实例，避免修改模块级常量
    const imageRegex = new RegExp(IMAGE_PATTERN, 'g');
    let segIndex = 0;

    while ((match = imageRegex.exec(line)) !== null) {
      const [fullMatch, url] = match;
      const before = line.slice(lastIndex, match.index);
      if (before) {
        segments.push(
          <span key={`${lineKey}-s${segIndex}`}>
            {renderInlineText(before, `${lineKey}-s${segIndex}`)}
          </span>,
        );
        segIndex++;
      }
      segments.push(
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${lineKey}-s${segIndex}`}
          src={url.trim()}
          alt="场景插图"
          className="my-3 rounded-lg border border-slate-700/60 max-w-full shadow-lg"
          style={{ animation: 'fade-in 0.5s ease-out' }}
          loading="lazy"
        />,
      );
      segIndex++;
      lastIndex = match.index + fullMatch.length;
    }

    const trailing = line.slice(lastIndex);
    if (trailing) {
      segments.push(
        <span key={`${lineKey}-s${segIndex}`}>
          {renderInlineText(trailing, `${lineKey}-s${segIndex}`)}
        </span>,
      );
    }

    // 整行都是图片标记时，直接返回图片片段（避免空段落）
    const isPureImage =
      segments.length > 0 && lastIndex > 0 && !line.replace(imageRegex, '').trim();
    if (isPureImage) {
      return <div key={lineKey}>{segments}</div>;
    }

    return (
      <p key={lineKey} className="mb-3 leading-relaxed text-slate-200 text-lg">
        {segments.length > 0 ? segments : renderInlineText(line, `${lineKey}-plain`)}
      </p>
    );
  };

  // 简单的富文本处理：支持 **加粗**、---分隔线、[image:url] 场景插图
  const renderContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // 分隔线
      if (line.trim() === '---') {
        return <hr key={i} className="border-slate-700 my-4" />;
      }
      return renderLine(line, i);
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
