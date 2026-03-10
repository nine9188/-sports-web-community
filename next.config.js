const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // CSS 최적화: critical CSS 인라인
  experimental: {
    optimizeCss: true,
  },
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
      {
        pathname: '/images/**',
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
      // RSS 뉴스 이미지
      {
        protocol: 'https',
        hostname: 'img.mydaily.co.kr',
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
  async headers() {
    const securityHeaders = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
    ];

    return [
      {
        // 모든 페이지에 보안 헤더 적용
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        // 정적 이미지/아이콘 (placeholder SVG 등)
        source: '/:path*\\.(svg|png|jpg|jpeg|webp|ico)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // 폰트 파일
        source: '/:path*\\.(woff|woff2|ttf|otf)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
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

module.exports = withBundleAnalyzer(nextConfig);


