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
  }
}

module.exports = nextConfig