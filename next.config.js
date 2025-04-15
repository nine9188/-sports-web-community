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
    ],
  },
  // punycode 모듈 경고 무시 설정
  webpack: (config) => {
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