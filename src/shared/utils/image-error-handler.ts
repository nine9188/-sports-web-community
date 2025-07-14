/**
 * 이미지 로딩 에러 처리 및 재시도 로직
 */

import { ImageType, getFallbackImageUrl } from './image-proxy';

interface ImageRetryState {
  retryCount: number;
  lastAttempt: number;
  maxRetries: number;
  backoffDelay: number;
}

// 이미지별 재시도 상태를 관리하는 Map
const imageRetryStates = new Map<string, ImageRetryState>();

/**
 * 타임아웃을 지원하는 fetch 유틸리티
 * 
 * @param url - 요청 URL
 * @param options - fetch 옵션
 * @param timeout - 타임아웃 (ms)
 * @returns fetch Response
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 5000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(id);
  }
}

/**
 * 이미지 로딩 실패 시 재시도 로직 (백오프 로직 개선)
 * 
 * @param imageUrl - 실패한 이미지 URL
 * @param onRetry - 재시도 시 호출할 콜백
 * @param maxRetries - 최대 재시도 횟수 (기본: 3)
 * @returns 재시도 여부
 */
export function handleImageRetry(
  imageUrl: string,
  onRetry: (newUrl: string) => void,
  maxRetries = 3
): boolean {
  const now = Date.now();
  const state = imageRetryStates.get(imageUrl) || {
    retryCount: 0,
    lastAttempt: now,
    maxRetries,
    backoffDelay: 1000, // 1초 시작
  };

  // 최대 재시도 횟수 초과
  if (state.retryCount >= state.maxRetries) {
    return false;
  }

  const delay = state.backoffDelay;

  // setTimeout은 딜레이만 담당하고, 실제 상태 업데이트는 콜백에서 수행
  setTimeout(() => {
    const newState: ImageRetryState = {
      retryCount: state.retryCount + 1,
      lastAttempt: Date.now(),
      maxRetries,
      backoffDelay: Math.min(state.backoffDelay * 2, 10000), // 최대 10초
    };
    imageRetryStates.set(imageUrl, newState);
    onRetry(imageUrl);
  }, delay);

  return true;
}

/**
 * 이미지 타입별 폴백 이미지 가져오기 (enum 기반으로 개선)
 * 
 * @param imageUrl - 원본 이미지 URL
 * @returns 폴백 이미지 URL
 */
export function getImageFallback(imageUrl: string): string {
  // URL에서 이미지 타입 추론 (enum 기반)
  if (imageUrl.includes('/teams/')) {
    return getFallbackImageUrl(ImageType.Teams);
  }
  if (imageUrl.includes('/leagues/')) {
    return getFallbackImageUrl(ImageType.Leagues);
  }
  if (imageUrl.includes('/coachs/')) {
    return getFallbackImageUrl(ImageType.Coachs);
  }
  
  // 기본값: 선수 이미지
  return getFallbackImageUrl(ImageType.Players);
}

/**
 * 특정 이미지의 재시도 상태 초기화
 * 
 * @param imageUrl - 이미지 URL
 */
export function resetImageRetryState(imageUrl: string): void {
  imageRetryStates.delete(imageUrl);
}

/**
 * 모든 이미지의 재시도 상태 초기화
 */
export function clearAllImageRetryStates(): void {
  imageRetryStates.clear();
}

/**
 * 이미지 로딩 상태 관리를 위한 훅 타입
 */
export interface ImageLoadingState {
  isLoading: boolean;
  hasError: boolean;
  retryCount: number;
  currentUrl: string;
}

/**
 * 이미지 로딩 상태 초기값
 */
export const createInitialImageState = (url: string): ImageLoadingState => ({
  isLoading: true,
  hasError: false,
  retryCount: 0,
  currentUrl: url,
});

/**
 * 이미지 로딩 성공 시 상태 업데이트
 */
export const handleImageLoadSuccess = (
  state: ImageLoadingState
): ImageLoadingState => ({
  ...state,
  isLoading: false,
  hasError: false,
});

/**
 * 이미지 로딩 실패 시 상태 업데이트
 */
export const handleImageLoadError = (
  state: ImageLoadingState,
  fallbackUrl?: string
): ImageLoadingState => ({
  ...state,
  isLoading: false,
  hasError: true,
  retryCount: state.retryCount + 1,
  currentUrl: fallbackUrl || state.currentUrl,
});

/**
 * 이미지 재시도 시 상태 업데이트
 */
export const handleImageRetryAttempt = (
  state: ImageLoadingState,
  newUrl: string
): ImageLoadingState => ({
  ...state,
  isLoading: true,
  hasError: false,
  currentUrl: newUrl,
});

/**
 * API-Sports 이미지 유효성 미리 검증 (fetchWithTimeout 사용)
 * 
 * @param imageUrl - 검증할 이미지 URL
 * @param timeout - 타임아웃 (ms)
 * @returns 이미지 유효성
 */
export async function validateImageUrl(
  imageUrl: string, 
  timeout = 5000
): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(imageUrl, { method: 'HEAD' }, timeout);
    return response.ok && response.headers.get('content-type')?.startsWith('image/') === true;
  } catch {
    return false;
  }
} 