const { withSentryConfig } = require("@sentry/nextjs");
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

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
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // 클라이언트 빌드에서 Next.js 기본 폴리필 제외 (최신 브라우저 타겟)
    if (!isServer) {
      // polyfill-module.js를 빈 모듈로 대체
      config.resolve.alias = {
        ...config.resolve.alias,
        'next/dist/build/polyfills/polyfill-module.js': false,
      };
    }

    return config;
  },
};

module.exports = withBundleAnalyzer(withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: true,
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
}));


