/**
 * API Sports 이미지 타입 정의
 */

// 지원하는 이미지 타입 (enum으로 타입 안정성 강화)
export enum ImageType {
  Players = 'players',
  Teams = 'teams',
  Leagues = 'leagues',
  Coachs = 'coachs',
  Venues = 'venues',
}

// 이미지 캐싱 결과 타입
export interface ImageCacheResult {
  success: boolean;
  url?: string;
  error?: string;
  cached?: boolean;
  notFound?: boolean;  // API-Sports에도 없는 경우
}

// 배치 이미지 캐싱 결과 타입
export interface BatchImageCacheResult {
  success: boolean;
  cached: number;
  failed: number;
  results: Array<{
    id: number;
    cached: boolean;
    error?: string;
  }>;
}

// 이미지 캐싱 요청 타입
export interface ImageCacheRequest {
  type: 'players' | 'teams' | 'leagues' | 'coachs' | 'venues';
  id: string | number;
}

// 이미지 캐시 상태
export type ImageCacheStatus = 'loading' | 'success' | 'error' | 'not-found';

// 이미지 캐시 엔트리
export interface ImageCacheEntry {
  url: string | null;
  status: ImageCacheStatus;
  timestamp: number;
}

// 캐시 만료 시간 (밀리초)
export const IMAGE_CACHE_TTL = {
  SUCCESS: 24 * 60 * 60 * 1000,    // 성공: 24시간
  NOT_FOUND: 30 * 60 * 1000,       // 없음: 30분 (나중에 추가될 수 있음)
  ERROR: 5 * 60 * 1000,            // 에러: 5분
} as const; 