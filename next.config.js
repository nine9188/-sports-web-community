/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    localPatterns: [
      {
        pathname: '/api/proxy-image',
      },
      {
        pathname: '/logo/**',
      },
      {
        pathname: '/icons/**',
      },
    ],
    remotePatterns: [
      // API-Sports (선수/감독 이미지)
      {
        protocol: 'https',
        hostname: 'media.api-sports.io',
        pathname: '/**',
      },
      // Supabase Storage (팀/리그/업로드 이미지)
      {
        protocol: 'https',
        hostname: 'vnjjfhsuzoxcljqqwwvx.supabase.co',
        pathname: '/**',
      },
      // YouTube 썸네일
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        pathname: '/**',
      },
      // 기타 허용된 도메인
      {
        protocol: 'https',
        hostname: 'cdn.footballist.co.kr',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'image.fmkorea.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'static01.nyt.com',
        pathname: '/**',
      },
      // 외부 URL 이미지는 /api/proxy-image를 통해 프록시 처리
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


