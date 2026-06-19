/** @type {import('next').NextConfig} */

const nextConfig = {
  // output: 'export',
  // distDir: 'build',
  // basePath: '/',
  transpilePackages: [
    'rc-util',
    'rc-tree',
    'rc-pagination',
    'rc-picker',
    'rc-table',
    '@ant-design/icons',
    '@ant-design/icons-svg',
  ],
  reactStrictMode: false,
  allowedDevOrigins: ['192.168.0.103'],
  serverExternalPackages: [
    'typeorm',
    'pg',
    'redis',
    'bullmq',
    'typescript-ioc',
    'reflect-metadata',
    'fluent-ffmpeg',
    'ffmpeg-static',
    'ffprobe-static',
    'bcryptjs',
    'winston',
    'telegraf',
  ],
  images: {
    qualities: [100, 75],
    /** Кэш ответов /_next/image на сервере (сек.); фото товаров с uuid в имени редко меняются */
    minimumCacheTTL: 604800,
    localPatterns: [
      { pathname: '/items/**' },
      { pathname: '/covers/**' },
      { pathname: '/promotionals/**' },
      { pathname: '/comments/**' },
      { pathname: '/temp/**' },
    ],
  },
  experimental: {
    optimizePackageImports: ['antd', '@ant-design/icons'],
  },
};

export default nextConfig;
