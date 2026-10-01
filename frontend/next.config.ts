import type { NextConfig } from 'next';
import type { Configuration } from 'webpack';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['sprint-be-project.s3.ap-northeast-2.amazonaws.com'],
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
