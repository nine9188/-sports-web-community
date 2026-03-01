// Match Query Keys (shared에서 re-export)
export { matchKeys } from '@/shared/constants/queryKeys';

// Player 관련 React Query 훅
export {
  usePlayerInfo,
  usePlayerTabData,
} from './usePlayerQueries';
export type { PlayerTabType } from './usePlayerQueries';

// LiveScore Query Keys (shared에서 re-export)
export { liveScoreKeys } from '@/shared/constants/queryKeys';

// LiveScore 관련 React Query 훅
export {
  useMatches,
  useLiveScore,
} from './useLiveScoreQueries';

// LiveScore 멀티데이 공유 훅 (메인페이지 위젯/헤더/모달 공유)
export {
  useMultiDayMatches,
  useTodayMatchCount,
} from './useLiveScoreData';
