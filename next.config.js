/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.api-sports.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'vnjjfhsuzoxcljqqwwvx.supabase.co',
        pathname: '/**',
      },
      // Supabase Storage 도메인 추가
      {
        protocol: 'https',
        hostname: 'vnjjfhsuzoxcljqqwwvx.supabase.co',
        pathname: '/storage/v1/object/public/**',
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
        hostname: 'image.fmkorea.com',
        pathname: '/**',
      },
      // NYT Athletic 이미지
      {
        protocol: 'https',
        hostname: 'static01.nyt.com',
        pathname: '/**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Next.js 16: eslint 설정은 더 이상 next.config.js에서 지원되지 않음
  // 대신 next lint 명령어 옵션을 사용하거나 package.json scripts에서 설정
  turbopack: {
    // Turbopack 설정 (Next.js 16 기본값)
    resolveAlias: {
      // webpack의 resolve.fallback을 Turbopack으로 마이그레이션
    },
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

module.exports = nextConfig;


