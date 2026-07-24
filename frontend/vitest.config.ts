import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/**
 * Vitest 配置
 *
 * - 使用 jsdom 环境模拟浏览器 DOM
 * - 通过 @vitejs/plugin-react 支持 JSX/TSX 转换
 * - 配置 @ 别名指向 src 目录，与 tsconfig.json 保持一致
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // 测试环境：jsdom，提供 window / document 等 DOM API
    environment: 'jsdom',
    // 全局注册 jest-dom 的自定义匹配器（toBeInTheDocument 等）
    setupFiles: ['./vitest.setup.ts'],
    // 包含的测试文件
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // 默认不监视，CI 友好
    globals: true,
  },
});
