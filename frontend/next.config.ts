import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// WSToolbox 适配：当 WSTOOLBOX=true 时使用静态导出模式
const isWstoolbox = process.env.WSTOOLBOX === 'true';

const nextConfig: NextConfig = {
  // Docker 部署使用 standalone 模式，WSToolbox 部署使用 export 模式
  output: isWstoolbox ? 'export' : 'standalone',

  // 静态导出模式需要禁用图片优化（不支持服务端优化）
  images: isWstoolbox ? {
    unoptimized: true,
  } : undefined,

  // WSToolbox 模式下使用 trailingSlash，确保静态文件路由正确
  trailingSlash: isWstoolbox ? true : undefined,

  // WSToolbox 模式下不需要 API 代理重写（由 Nginx 处理）
  async rewrites() {
    if (isWstoolbox) {
      return [];
    }
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
};

export default withNextIntl(nextConfig);
