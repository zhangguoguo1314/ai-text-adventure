import { defineRouting } from 'next-intl/routing';

/**
 * 语言切换使用的 Cookie 名称。
 * 服务端 (i18n/request.ts) 读取它判断当前语言，
 * 客户端 (LanguageSwitcher) 写入它来切换语言。
 */
export const LOCALE_COOKIE = 'NEXT_LOCALE';

/**
 * next-intl 路由配置。
 *
 * 说明：本项目采用「基于 Cookie 的非路由式」国际化方案，不引入
 * middleware、不使用 `[locale]` 动态段，从而保持所有既有路由不变。
 * 这里通过 `defineRouting` 统一定义支持的语言、默认语言、路径前缀
 * 映射与 Cookie 名称，供 request.ts 与客户端组件复用。
 *
 * - locales: 支持的语言列表
 * - defaultLocale: 默认语言（中文）
 * - localePrefix: 路径前缀策略，默认语言无前缀，其余语言带前缀（如 /en）
 * - localeCookie: 语言偏好 Cookie 配置
 */
export const routing = defineRouting({
  locales: ['zh', 'en'],
  defaultLocale: 'zh',
  // 默认语言不带前缀，其余语言带前缀；切换语言时不改变 URL，仅更新 Cookie
  localePrefix: 'as-needed',
  localeCookie: {
    name: LOCALE_COOKIE,
    sameSite: 'lax',
  },
  // 同时基于 Cookie / Accept-Language 进行语言探测
  localeDetection: true,
});

/** 支持的语言列表 */
export const locales = routing.locales as readonly string[];

/** 默认语言 */
export const defaultLocale = routing.defaultLocale;

/** 所有语言的可读名称（用于语言切换器下拉菜单显示） */
export const localeLabels: Record<string, string> = {
  zh: '中文',
  en: 'English',
};

/**
 * 校验给定值是否为受支持的语言，否则回退到默认语言。
 */
export function getValidLocale(locale: string | undefined | null): string {
  if (locale && locales.includes(locale)) {
    return locale;
  }
  return defaultLocale;
}
