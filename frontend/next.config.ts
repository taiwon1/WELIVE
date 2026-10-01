import type { NextConfig } from 'next';
import type { Configuration } from 'webpack';

const assetHost = process.env.NEXT_PUBLIC_ASSET_HOST;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  outputFileTracingRoot: process.cwd(),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.s3.ap-northeast-2.amazonaws.com',
      },
      ...(assetHost ? [{ protocol: 'https' as const, hostname: assetHost }] : []),
    ],
  },
  async rewrites() {
    const apiTarget = process.env.API_PROXY_TARGET || 'http://localhost:4000';
    return [{ source: '/api/:path*', destination: `${apiTarget}/api/:path*` }];
  },
  webpack(config: Configuration) {
    config.module?.rules?.push({
      test: /\.svg$/,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
};

export default nextConfig;
