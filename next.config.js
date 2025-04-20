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
  output: 'standalone',
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
  }
}

module.exports = nextConfig