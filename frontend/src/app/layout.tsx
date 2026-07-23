import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
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
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full">
        <QueryProvider>
          <div className="flex min-h-screen">
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
      </body>
    </html>
  );
}
