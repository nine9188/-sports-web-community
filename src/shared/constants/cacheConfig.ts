/**
 * React Query 캐시 정책 상수
 *
 * 사용 예시:
 * ```typescript
 * const { data } = useQuery({
 *   queryKey: matchKeys.events(matchId),
 *   queryFn: () => fetchMatchEvents(matchId),
 *   ...CACHE_STRATEGIES.FREQUENTLY_UPDATED,
 * });
 * ```
 */

export const CACHE_STRATEGIES = {
  /**
   * 실시간 데이터 (경기 중 이벤트, 라이브 스코어)
   * - staleTime: 30초
   * - gcTime: 5분
   */
  REAL_TIME: {
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
  },

  /**
   * 자주 업데이트되는 데이터 (경기 이벤트, 댓글)
   * - staleTime: 2분
   * - gcTime: 10분
   */
  FREQUENTLY_UPDATED: {
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  },

  /**
   * 가끔 업데이트되는 데이터 (통계, 라인업)
   * - staleTime: 5분
   * - gcTime: 30분
   */
  OCCASIONALLY_UPDATED: {
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  },

  /**
   * 안정적인 데이터 (팀 정보, 순위, 게시판 목록)
   * - staleTime: 30분
   * - gcTime: 2시간
   */
  STABLE_DATA: {
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60 * 2,
  },

  /**
   * 거의 변경되지 않는 데이터 (선수단, 리그 정보)
   * - staleTime: 1시간
   * - gcTime: 24시간
   */
  STATIC_DATA: {
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  },
} as const;

export type CacheStrategy = keyof typeof CACHE_STRATEGIES;
