'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface WorldEditorProps {
  scriptId: number;
  initialValue: string;
}

export default function WorldEditor({ scriptId, initialValue }: WorldEditorProps) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const saveContent = useCallback(async (content: string) => {
    try {
      const { default: api } = await import('@/lib/api');
      setSaving(true);
      await api.put(`/scripts/${scriptId}`, { worldSetting: content });
      setLastSaved(new Date());
    } catch {
      // Silently fail for autosave
    } finally {
      setSaving(false);
    }
  }, [scriptId]);

  const handleChange = useCallback(
    (newValue: string) => {
      setValue(newValue);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        saveContent(newValue);
      }, 3000);
    },
    [saveContent],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--ink)]">世界观 / 叙事规则</h3>
        <div className="flex items-center gap-2 text-xs">
          {saving && (
            <span className="flex items-center gap-1 text-violet-600">
              <div className="w-3 h-3 border border-violet-600 border-t-transparent rounded-full animate-spin" />
              保存中...
            </span>
          )}
          {!saving && lastSaved && (
            <span className="text-[var(--muted)]">
              已保存 {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {!saving && !lastSaved && (
            <span className="text-[var(--muted)]">支持 Markdown</span>
          )}
        </div>
      </div>
      <textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        rows={20}
        className="w-full px-4 py-3 rounded-lg border border-[var(--rule)] focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-sm resize-y font-mono transition-colors leading-relaxed"
        placeholder="使用 Markdown 描述世界观和叙事规则...&#10;&#10;# 世界名称&#10;&#10;## 核心规则&#10;- 规则1&#10;- 规则2&#10;&#10;## 背景设定&#10;详细描述..."
      />
    </div>
  );
}
