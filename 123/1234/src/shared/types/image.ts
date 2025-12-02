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