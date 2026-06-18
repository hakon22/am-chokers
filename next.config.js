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
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
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
};

export default nextConfig;
