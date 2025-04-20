/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.api-sports.io'
      }
    ],
    domains: [
      'vnjjfhsuzoxcljqqwwvx.supabase.co',
      'via.placeholder.com',
    ],
    unoptimized: true,
  },
  // output 설정 제거 - 기본 모드로 전환
  // punycode 모듈 경고 무시 설정
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      punycode: false,
    };
    
    // 불필요한 경고 필터링
    config.ignoreWarnings = [
      { module: /node_modules\/punycode/ },
      { file: /node_modules\/punycode/ }
    ];
    
    // 수정된 설정 반환
    return config;
  },
  // 빌드 시 쿠키 관련 경고를 표시하지 않도록 설정
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // 경로 그룹에 대한 특별 처리 추가
  serverExternalPackages: ['punycode'],
  // Vercel 배포에서 경로 그룹 처리 개선
  experimental: {
    optimizePackageImports: ['react-icons'],
    serverActions: {
      allowedOrigins: ['localhost:3000']
    }
  },
  // 루트 경로에서 shorts로 리다이렉트
  async redirects() {
    return [
      {
        source: '/',
        destination: '/shorts',
        permanent: true,
      }
    ];
  }
}

module.exports = nextConfig