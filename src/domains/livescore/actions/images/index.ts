/**
 * 이미지 캐싱 서버 액션 (4590 표준)
 *
 * 4590 표준 핵심 원칙:
 * - 클라이언트는 API-Sports 이미지 URL을 절대 직접 사용하지 않는다
 * - 모든 이미지는 Supabase Storage에서 제공
 * - 이미지 URL은 서버에서 확정해서 내려준다
 *
 * 지원 타입:
 * - 팀 로고: getTeamLogoUrl, getTeamLogoUrls
 * - 리그 로고: getLeagueLogoUrl, getLeagueLogoUrls
 * - 선수 사진: getPlayerPhotoUrl, getPlayerPhotoUrls
 * - 감독 사진: getCoachPhotoUrl, getCoachPhotoUrls
 * - 경기장 사진: getVenueImageUrl, getVenueImageUrls
 *
 * 사용법:
 * ```typescript
 * import {
 *   getTeamLogoUrl,
 *   getLeagueLogoUrls,
 *   getPlayerPhotoUrls,
 *   getCoachPhotoUrl,
 *   getVenueImageUrl,
 * } from '@/domains/livescore/actions/images';
 *
 * // 단일 조회
 * const teamLogo = await getTeamLogoUrl(33);
 * const leagueLogo = await getLeagueLogoUrl(39, isDark);
 * const venueImage = await getVenueImageUrl(556);
 *
 * // 배치 조회 (성능 최적화)
 * const playerPhotos = await getPlayerPhotoUrls([306, 1485, 874]);
 * const teamLogos = await getTeamLogoUrls([33, 34, 40]);
 * ```
 */

// 팀 로고
export { getTeamLogoUrl, getTeamLogoUrls } from './getTeamLogoUrl';

// 리그 로고
export { getLeagueLogoUrl, getLeagueLogoUrls } from './getLeagueLogoUrl';

// 선수 사진
export { getPlayerPhotoUrl, getPlayerPhotoUrls } from './getPlayerPhotoUrl';

// 감독 사진
export { getCoachPhotoUrl, getCoachPhotoUrls } from './getCoachPhotoUrl';

// 경기장 사진
export { getVenueImageUrl, getVenueImageUrls } from './getVenueImageUrl';

// 공통 유틸 (내부용)
export { ensureAssetCached, ensureAssetsCached } from './ensureAssetCached';

// 상수
export {
  PLACEHOLDER_URLS,
  SUPABASE_STORAGE_URL,
  type AssetType,
} from './constants';
