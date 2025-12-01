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
  },
};

export default nextConfig;
