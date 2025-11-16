/**
 * 지원하는 소셜 미디어 플랫폼 타입
 */
export type SocialPlatform =
  | 'twitter'
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'facebook'
  | 'linkedin';

/**
 * 각 플랫폼별 URL 정규식
 */
const URL_PATTERNS: Record<SocialPlatform, RegExp> = {
  twitter: /(?:twitter\.com|x\.com)\/(?:#!\/)?(\w+)\/status(?:es)?\/(\d+)/i,
  instagram: /(?:www\.)?instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/i,
  tiktok: /(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/(\d+)/i,
  youtube: /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
  facebook: /(?:www\.)?facebook\.com\/(?:[\w.-]+\/)?(?:posts|videos|photo\.php|permalink\.php)[\/?].*(?:[\/?]|id=|v=)(\d+)/i,
  linkedin: /(?:www\.)?linkedin\.com\/(?:feed\/update|posts)\/[\w-]+/i,
};

/**
 * URL에서 플랫폼을 감지
 */
export const detectPlatform = (url: string): SocialPlatform | null => {
  if (!url) return null;

  for (const [platform, pattern] of Object.entries(URL_PATTERNS)) {
    if (pattern.test(url)) {
      return platform as SocialPlatform;
    }
  }

  return null;
};

/**
 * 플랫폼별 URL 패턴 가져오기
 */
export const getPatternForPlatform = (platform: SocialPlatform): RegExp => {
  return URL_PATTERNS[platform];
};
