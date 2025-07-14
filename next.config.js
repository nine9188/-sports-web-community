/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.api-sports.io',
        pathname: '/**',
      },
      // Vercel 자체 도메인 (프록시 이미지용)
      {
        protocol: 'https',
        hostname: process.env.VERCEL_URL || 'sports-web-community.vercel.app',
        pathname: '/api/images',
      },
      // 추가 Vercel 도메인 패턴
      {
        protocol: 'https',
        hostname: '*.vercel.app',
        pathname: '/api/images',
      },
      // 로컬 개발 환경용 (http)
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/api/images',
      },
      {
        protocol: 'https',
        hostname: 'vnjjfhsuzoxcljqqwwvx.supabase.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.footballist.co.kr',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.sportmonks.com',
        pathname: '/**',
      },
    ],
  },
  reactStrictMode: false,
};

module.exports = nextConfig;


