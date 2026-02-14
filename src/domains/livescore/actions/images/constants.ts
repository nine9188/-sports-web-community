/**
 * 이미지 캐싱 상수 (4590 표준)
 *
 * 주의: 상수 파일이므로 'use server' 사용 안 함
 * 서버 액션에서 import해서 사용
 */

// Supabase Storage 기본 URL
export const SUPABASE_STORAGE_URL = 'https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public';

// API-Sports 기본 URL (원본 다운로드용)
export const API_SPORTS_BASE_URL = 'https://media.api-sports.io/football';

// 에셋 타입
export type AssetType = 'player_photo' | 'coach_photo' | 'team_logo' | 'league_logo' | 'venue_photo';

// 이미지 사이즈 타입
export type ImageSize = 'sm' | 'md' | 'lg';

// 사이즈별 리사이즈 설정 (px)
export const SIZE_CONFIG: Record<ImageSize, number> = {
  sm: 64,   // 리스트 아이템 (24-32px 표시, 2x DPR 커버)
  md: 128,  // 매치카드, 순위표 (48px 표시, 3x DPR 커버)
  lg: 256,  // 헤더, 히어로 (80-112px 표시, 3x DPR 커버)
};

// 경기장은 더 큰 사이즈 필요
export const VENUE_SIZE_CONFIG: Record<ImageSize, number> = {
  sm: 128,
  md: 256,
  lg: 512,
};

// 버킷 매핑
export const BUCKET_MAP: Record<AssetType, string> = {
  player_photo: 'players',
  coach_photo: 'coachs',
  team_logo: 'teams',
  league_logo: 'leagues',
  venue_photo: 'venues',
};

// API-Sports 경로 매핑
export const API_PATH_MAP: Record<AssetType, string> = {
  player_photo: 'players',
  coach_photo: 'coachs',
  team_logo: 'teams',
  league_logo: 'leagues',
  venue_photo: 'venues',
};

// 파일 확장자 매핑
export const EXTENSION_MAP: Record<AssetType, string> = {
  player_photo: 'webp',
  coach_photo: 'webp',
  team_logo: 'webp',
  league_logo: 'webp',
  venue_photo: 'webp',
};

// TTL (밀리초)
export const TTL_MAP: Record<AssetType, number> = {
  player_photo: 30 * 24 * 60 * 60 * 1000,  // 30일
  coach_photo: 30 * 24 * 60 * 60 * 1000,   // 30일
  team_logo: 90 * 24 * 60 * 60 * 1000,     // 90일
  league_logo: 90 * 24 * 60 * 60 * 1000,   // 90일
  venue_photo: 180 * 24 * 60 * 60 * 1000,  // 180일 (경기장은 거의 안 바뀜)
};

// Placeholder URL
export const PLACEHOLDER_URLS: Record<AssetType, string> = {
  player_photo: '/images/placeholder-player.svg',
  coach_photo: '/images/placeholder-coach.svg',
  team_logo: '/images/placeholder-team.svg',
  league_logo: '/images/placeholder-league.svg',
  venue_photo: '/images/placeholder-venue.svg',
};

// 에러 쿨다운 (1시간)
export const ERROR_COOLDOWN = 60 * 60 * 1000;

// 최대 재시도 횟수
export const MAX_RETRIES = 2;

// pending 대기 시간 (밀리초)
export const PENDING_WAIT_TIME = 500;

// 커스텀 에셋 보호 목록 (TTL 재다운로드 스킵)
// Storage에 직접 업로드한 이미지가 API-Sports 이미지로 덮어씌워지는 것을 방지
export const CUSTOM_ASSETS: Set<string> = new Set([
  'league_logo:61',  // 리그1 (커스텀 로고)
]);
