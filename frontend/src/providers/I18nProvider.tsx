'use client';

import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from 'react';
import { useLocale } from 'next-intl';
import {
  LOCALE_COOKIE,
  locales,
  defaultLocale,
  getValidLocale,
} from '@/i18n/routing';

interface I18nContextValue {
  /** 当前语言 */
  locale: string;
  /** 支持的语言列表 */
  locales: readonly string[];
  /** 默认语言 */
  defaultLocale: string;
  /**
   * 切换语言：写入 Cookie 后刷新页面，由服务端 (i18n/request.ts)
   * 重新加载对应语言文案。
   */
  changeLocale: (locale: string) => void;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

/**
 * 简化的 i18n Context Provider。
 *
 * 基于 next-intl 的 `useLocale` 提供当前语言，并封装「写入 Cookie + 刷新页面」
 * 的语言切换逻辑，供 LanguageSwitcher 等客户端组件使用。
 *
 * 必须位于 `NextIntlClientProvider` 内部。
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const currentLocale = useLocale();
  const locale = getValidLocale(currentLocale);

  const changeLocale = useCallback(
    (next: string) => {
      const target = getValidLocale(next);
      if (target === locale) return;
      // 写入语言偏好 Cookie（有效期一年），然后刷新页面让服务端重新加载
      document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=31536000; samesite=lax`;
      window.location.reload();
    },
    [locale],
  );

  return (
    <I18nContext.Provider
      value={{ locale, locales, defaultLocale, changeLocale }}
    >
      {children}
    </I18nContext.Provider>
  );
}

/**
 * 获取 i18n 上下文（当前语言与切换方法）。
 */
export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}
