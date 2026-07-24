'use client';

import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/providers/I18nProvider';
import { localeLabels } from '@/i18n/routing';

interface LanguageSwitcherProps {
  /** 适配深色侧边栏（紫色背景）时的浅色样式，默认 true */
  onDark?: boolean;
  /** 紧凑模式：仅显示图标 + 当前语言缩写，适合侧边栏窄空间 */
  compact?: boolean;
}

/**
 * 语言切换组件
 *
 * - 下拉菜单显示各语言可读名称（中文 / English）
 * - 切换时写入 Cookie 并刷新页面（由 I18nProvider.changeLocale 完成）
 * - 高亮当前语言
 * - 通过 CSS 变量适配明暗主题
 */
export default function LanguageSwitcher({
  onDark = true,
  compact = false,
}: LanguageSwitcherProps) {
  const { locale, locales, changeLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 点击外部 / Esc 关闭
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const triggerText = onDark ? 'text-violet-200' : 'text-[var(--ink)]';
  const triggerHover = onDark
    ? 'hover:bg-violet-800 hover:text-white'
    : 'hover:bg-[var(--bg3)]';

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="切换语言"
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex items-center gap-1.5 rounded-lg transition-colors ${
          compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'
        } ${triggerText} ${triggerHover}`}
      >
        {/* 地球图标 */}
        <svg
          className="w-4 h-4 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="truncate">{localeLabels[locale] || locale}</span>
        <svg
          className={`w-3 h-3 flex-shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* 下拉菜单：向上展开，使用 CSS 变量适配明暗主题 */}
      {open && (
        <ul
          role="listbox"
          className="absolute bottom-full left-0 mb-2 w-36 rounded-lg border border-[var(--rule)] bg-[var(--bg2)] shadow-xl overflow-hidden animate-fade-in z-50"
        >
          {locales.map((loc) => {
            const isActive = loc === locale;
            return (
              <li key={loc} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    changeLocale(loc);
                  }}
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'text-[var(--accent)] font-medium bg-[var(--accent)]/10'
                      : 'text-[var(--ink)] hover:bg-[var(--bg3)]'
                  }`}
                >
                  <span>{localeLabels[loc] || loc}</span>
                  {isActive && (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
