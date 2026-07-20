/**
 * 사이트 공통 설정 모듈
 *
 * URL, SEO 관련 설정을 단일 소스로 관리
 * 모든 페이지에서 이 모듈을 통해 URL을 생성해야 함
 */

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://4590fb.com';

export const logoOptions = [
  '/logo/4590football-logo.png',
] as const;

const logoVariant = 0;

export const siteConfig = {
  // 기본 설정
  url: siteUrl,
  name: '4590',
  ogTitle: '4590 - 축구 커뮤니티',
  description: '해외축구·국내축구 커뮤니티 4590(4590football). 실시간 라이브스코어, 경기 일정, 이적 소식을 축구 팬들과 함께 나누세요.',
  keywords: ['4590', '4590football', '축구 커뮤니티', '해외축구 커뮤니티', '라이브스코어', '해외축구', '국내축구', 'EPL', 'K리그', '라리가', '분데스리가', '세리에A', '리그앙'],
  locale: 'ko_KR',
  twitterHandle: '@4590football',

  // 로고 및 이미지
  logo: logoOptions[logoVariant],         // 풀로고용 (헤더, 정책 페이지 등)
  icon: '/logo/icon-04.png',              // 아이콘용 — 흰색 베이스 (기본은 invert 필요, 다크모드는 그대로)
  logoOptions,
  defaultOgImage: `${siteUrl}/og-image.png`,
  defaultOgImageSquare: `${siteUrl}/og-image-square.png`,

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
