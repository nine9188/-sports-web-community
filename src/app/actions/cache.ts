'use server';

import { invalidateBoardsCache as invalidateServerBoardsCache, invalidateAllCache } from '../lib/caching.server';

/**
 * 게시판 데이터 캐시를 무효화하는 서버 액션
 * 클라이언트 컴포넌트에서 호출 가능
 */
export async function invalidateBoardsCache(): Promise<boolean> {
  try {
    return invalidateServerBoardsCache();
  } catch (error) {
    console.error('서버 측 캐시 무효화 오류:', error);
    return false;
  }
}

/**
 * 모든 캐시를 무효화하는 서버 액션
 * 클라이언트 컴포넌트에서 호출 가능
 */
export async function invalidateAllCaches(): Promise<boolean> {
  try {
    return invalidateAllCache();
  } catch (error) {
    console.error('전체 캐시 무효화 오류:', error);
    return false;
  }
} 