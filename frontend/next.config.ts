import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Docker 部署使用 standalone 模式，大幅减小镜像体积
  output: 'standalone',

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
};

export default nextConfig;
