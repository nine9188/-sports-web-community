// Match 관련 React Query 훅
export {
  matchKeys,
  useMatchDetail,
  useMatchEvents,
  useMatchLineups,
  useMatchStats,
  useMatchStandings,
  useMatchPower,
  useMatchTabData,
} from './useMatchQueries';

// Team 관련 React Query 훅
export {
  teamKeys,
  useTeamInfo,
  useTeamMatches,
  useTeamSquad,
  useTeamPlayerStats,
  useTeamStandings,
  useTeamTabData,
} from './useTeamQueries';

// Player 관련 React Query 훅
export {
  usePlayerInfo,
  usePlayerStats,
  usePlayerFixtures,
  usePlayerTransfers,
  usePlayerTrophies,
  usePlayerInjuries,
  usePlayerRankings,
  usePlayerTabData,
  usePlayerAllTabs,
} from './usePlayerQueries';
export type { PlayerTabType } from './usePlayerQueries';

// LiveScore 관련 React Query 훅
export {
  liveScoreKeys,
  useMatches,
  useTodayLiveCount,
  usePrefetchAdjacentDates,
  useLiveScore,
} from './useLiveScoreQueries';
