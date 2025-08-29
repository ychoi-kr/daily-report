/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  eslint: {
    dirs: ['src'],
  },
  // typedRoutes: true, // 一旦無効化（ルート作成後に有効化予定）
};

module.exports = nextConfig;
