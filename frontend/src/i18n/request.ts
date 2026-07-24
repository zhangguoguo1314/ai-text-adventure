import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import {
  LOCALE_COOKIE,
  locales,
  defaultLocale,
  getValidLocale,
} from './routing';

/**
 * 解析 Accept-Language 请求头，返回受支持的语言，无法识别时回退到默认语言。
 */
function matchAcceptLanguage(acceptLanguage: string): string {
  if (!acceptLanguage) return defaultLocale;

  // 形如 "zh-CN,zh;q=0.9,en;q=0.8"，按权重取第一个受支持的语言
  const preferred = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, qPart] = part.trim().split(';q=');
      const q = qPart ? parseFloat(qPart) : 1;
      return { tag: tag.toLowerCase(), q };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of preferred) {
    if (tag.startsWith('zh')) return 'zh';
    if (tag.startsWith('en')) return 'en';
  }
  return defaultLocale;
}

/**
 * next-intl 请求级配置。
 *
 * 加载顺序：
 * 1. Cookie 中的语言偏好（由 LanguageSwitcher 写入）
 * 2. Accept-Language 请求头（浏览器语言探测）
 * 3. 默认语言（中文）
 *
 * 最终根据解析出的语言动态加载对应的 messages 文件。
 */
export default getRequestConfig(async () => {
  // 1. 优先读取 Cookie
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;

  let locale: string | undefined =
    cookieLocale && locales.includes(cookieLocale) ? cookieLocale : undefined;

  // 2. 回退到 Accept-Language 探测
  if (!locale) {
    const headerStore = await headers();
    const acceptLanguage = headerStore.get('accept-language') ?? '';
    locale = matchAcceptLanguage(acceptLanguage);
  }

  // 3. 校验并回退到默认语言
  locale = getValidLocale(locale);

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
