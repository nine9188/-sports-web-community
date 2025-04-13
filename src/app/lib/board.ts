import { revalidateTag } from 'next/cache';

/**
 * 게시판 데이터 캐시를 무효화하는 함수
 */
export const invalidateBoardsCache = () => {
  revalidateTag('boards');
}; 