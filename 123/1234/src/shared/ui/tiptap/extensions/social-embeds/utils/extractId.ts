import { SocialPlatform, getPatternForPlatform } from './detectPlatform';

/**
 * URL에서 ID 또는 임베드에 필요한 정보 추출
 */
export const extractId = (url: string, platform: SocialPlatform): string | null => {
  if (!url || !platform) return null;

  const pattern = getPatternForPlatform(platform);
  const match = url.match(pattern);

  if (!match) return null;

  switch (platform) {
    case 'twitter':
      // 트위터는 status ID (두 번째 그룹)
      return match[2] || null;

    case 'instagram':
    case 'tiktok':
    case 'youtube':
      // 첫 번째 캡처 그룹
      return match[1] || null;

    case 'facebook':
      // 페이스북은 post ID
      return match[1] || null;

    case 'linkedin':
      // 링크드인은 전체 URL 사용
      return url;

    default:
      return null;
  }
};
