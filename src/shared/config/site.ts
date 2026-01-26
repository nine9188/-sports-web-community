/**
 * 사이트 공통 설정 모듈
 *
 * URL, SEO 관련 설정을 단일 소스로 관리
 * 모든 페이지에서 이 모듈을 통해 URL을 생성해야 함
 */

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://4590football.com';

export const siteConfig = {
  // 기본 설정
  url: siteUrl,
  name: '4590 Football',
  description: '실시간 축구 경기 일정과 스코어, 팀·선수 정보를 확인하고, 축구 팬들과 함께 소통할 수 있는 커뮤니티 플랫폼입니다.',
  keywords: ['축구', '축구 커뮤니티', '실시간 스코어', '프리미어리그', 'EPL', '라리가', '세리에A', '분데스리가', 'K리그'],
  locale: 'ko_KR',
  twitterHandle: '@4590football',

  // 로고 및 이미지
  logo: '/logo/4590football-logo.png',
  defaultOgImage: `${siteUrl}/og-image.png`,

  // URL 빌더
  getUrl: (path: string) => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${siteUrl}${normalizedPath}`;
  },

  // OG 이미지 URL 빌더 (절대 URL 처리)
  getOgImage: (path?: string | null) => {
    if (!path) return `${siteUrl}/og-image.png`;
    if (path.startsWith('http')) return path;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${siteUrl}${normalizedPath}`;
  },

  // canonical URL 빌더
  getCanonical: (path: string) => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${siteUrl}${normalizedPath}`;
  },

  // 기본 OG 이미지 설정 객체
  getDefaultOgImageObject: (alt?: string) => ({
    url: `${siteUrl}/og-image.png`,
    width: 1200,
    height: 630,
    alt: alt || '4590 Football',
  }),
} as const;

export type SiteConfig = typeof siteConfig;
