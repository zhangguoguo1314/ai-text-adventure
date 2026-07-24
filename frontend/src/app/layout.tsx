import type { Metadata } from "next";
import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { I18nProvider } from "@/providers/I18nProvider";
import QueryProvider from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { SocketProvider } from "@/providers/SocketProvider";
import { ToastProvider } from "@/components/common/Toast";
import Sidebar from "@/components/layout/Sidebar";
import AnnouncementBanner from "@/components/common/AnnouncementBanner";

export const metadata: Metadata = {
  title: "AI Text Adventure - AI 互动文字冒险",
  description: "用 AI 创造属于你的互动文字冒险游戏",
  manifest: "/manifest.json",
  themeColor: "#7c3aed",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AI冒险",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 从请求配置（Cookie / Accept-Language）解析当前语言与对应文案
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/* 防闪烁内联脚本：在 HTML 渲染前读取 localStorage 设置 dark class */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var isDark = false;
                  if (theme === 'dark') {
                    isDark = true;
                  } else if (theme === 'system' || !theme) {
                    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  }
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
        {/* PWA Service Worker 注册 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.warn('Service Worker 注册失败:', err);
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <I18nProvider>
            <ThemeProvider>
              <ToastProvider>
                <QueryProvider>
                  <SocketProvider>
                    <div className="flex min-h-screen theme-transition">
                      {/* 侧边栏 */}
                      <Sidebar />
                      {/* 主内容区域 */}
                      <main className="flex-1 lg:ml-60 transition-all duration-300">
                        {/* 顶部公告横幅 */}
                        <AnnouncementBanner />
                        <div className="p-4 md:p-6 lg:p-8">
                          {children}
                        </div>
                      </main>
                    </div>
                  </SocketProvider>
                </QueryProvider>
              </ToastProvider>
            </ThemeProvider>
          </I18nProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
