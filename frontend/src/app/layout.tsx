import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ToastProvider } from "@/components/common/Toast";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "AI Text Adventure - AI 互动文字冒险",
  description: "用 AI 创造属于你的互动文字冒险游戏",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
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
      </head>
      <body className="min-h-full">
        <ThemeProvider>
          <ToastProvider>
            <QueryProvider>
              <div className="flex min-h-screen theme-transition">
                {/* 侧边栏 */}
                <Sidebar />
                {/* 主内容区域 */}
                <main className="flex-1 lg:ml-60 transition-all duration-300">
                  <div className="p-4 md:p-6 lg:p-8">
                    {children}
                  </div>
                </main>
              </div>
            </QueryProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
