/**
 * React Query Key 팩토리
 *
 * Query Key를 일관되게 관리하기 위한 팩토리 함수들
 * 참고: https://tkdodo.eu/blog/effective-react-query-keys
 *
 * 사용 예시:
 * ```typescript
 * const { data } = useQuery({
 *   queryKey: matchKeys.events(matchId),
 *   queryFn: () => fetchMatchEvents(matchId),
 * });
 *
 * // 캐시 무효화
 * queryClient.invalidateQueries({ queryKey: matchKeys.detail(matchId) });
 * ```
 */

// ============================================
// 댓글
// ============================================
export const commentKeys = {
  all: ['comments'] as const,
  list: (postId: string) => [...commentKeys.all, 'list', postId] as const,
};

// ============================================
// 매치 (경기)
// ============================================
export const matchKeys = {
  all: ['match'] as const,
  detail: (matchId: string) => [...matchKeys.all, matchId] as const,
  events: (matchId: string) => [...matchKeys.detail(matchId), 'events'] as const,
  lineups: (matchId: string) => [...matchKeys.detail(matchId), 'lineups'] as const,
  stats: (matchId: string) => [...matchKeys.detail(matchId), 'stats'] as const,
  standings: (matchId: string) => [...matchKeys.detail(matchId), 'standings'] as const,
  power: (matchId: string, homeId: number, awayId: number) =>
    [...matchKeys.detail(matchId), 'power', homeId, awayId] as const,
  headToHead: (matchId: string) => [...matchKeys.detail(matchId), 'h2h'] as const,
};

// ============================================
// 팀
// ============================================
export const teamKeys = {
  all: ['team'] as const,
  detail: (teamId: string) => [...teamKeys.all, teamId] as const,
  info: (teamId: string) => [...teamKeys.detail(teamId), 'info'] as const,
  matches: (teamId: string) => [...teamKeys.detail(teamId), 'matches'] as const,
  squad: (teamId: string) => [...teamKeys.detail(teamId), 'squad'] as const,
  playerStats: (teamId: string) => [...teamKeys.detail(teamId), 'playerStats'] as const,
  standings: (teamId: string) => [...teamKeys.detail(teamId), 'standings'] as const,
};

// ============================================
// 선수
// ============================================
export const playerKeys = {
  all: ['player'] as const,
  detail: (playerId: string) => [...playerKeys.all, playerId] as const,
  info: (playerId: string) => [...playerKeys.detail(playerId), 'info'] as const,
  stats: (playerId: string) => [...playerKeys.detail(playerId), 'stats'] as const,
  fixtures: (playerId: string) => [...playerKeys.detail(playerId), 'fixtures'] as const,
  transfers: (playerId: string) => [...playerKeys.detail(playerId), 'transfers'] as const,
  trophies: (playerId: string) => [...playerKeys.detail(playerId), 'trophies'] as const,
  injuries: (playerId: string) => [...playerKeys.detail(playerId), 'injuries'] as const,
  rankings: (playerId: string) => [...playerKeys.detail(playerId), 'rankings'] as const,
};

// ============================================
// 라이브스코어
// ============================================
export const liveScoreKeys = {
  all: ['liveScore'] as const,
  matches: (date: string) => [...liveScoreKeys.all, 'matches', date] as const,
  liveCount: () => [...liveScoreKeys.all, 'liveCount'] as const,
};

// ============================================
// 리그
// ============================================
export const leagueKeys = {
  all: ['league'] as const,
  detail: (leagueId: string) => [...leagueKeys.all, leagueId] as const,
  standings: (leagueId: string) => [...leagueKeys.detail(leagueId), 'standings'] as const,
};

// ============================================
// Admin
// ============================================
export const adminKeys = {
  dashboard: () => ['admin', 'dashboard'] as const,
  users: () => ['admin', 'users'] as const,
  expHistory: (userId: string) => ['admin', 'expHistory', userId] as const,
  logs: (filters: object, page: number) => ['admin', 'logs', filters, page] as const,
  boards: () => ['admin', 'boards'] as const,
  reports: (filters: object) => ['admin', 'reports', filters] as const,
  notices: () => ['admin', 'notices'] as const,
  predictions: () => ['admin', 'predictions'] as const,
};

// ============================================
// Notifications
// ============================================
export const notificationKeys = {
  all: ['notifications'] as const,
  list: (userId?: string) => [...notificationKeys.all, 'list', userId] as const,
};

// ============================================
// Shop
// ============================================
export const shopKeys = {
  items: () => ['shop', 'items'] as const,
  userItems: (userId: string) => ['shop', 'userItems', userId] as const,
};

// ============================================
// Boards (게시판)
// ============================================
export const boardKeys = {
  all: ['boards'] as const,
  list: () => [...boardKeys.all, 'list'] as const,
  detail: (slug: string) => [...boardKeys.all, slug] as const,
  posts: (boardId: string, page?: number) => [...boardKeys.all, boardId, 'posts', page] as const,
};

// ============================================
// Posts (게시글)
// ============================================
export const postKeys = {
  all: ['posts'] as const,
  detail: (postId: string) => [...postKeys.all, postId] as const,
  popular: (period?: string) => [...postKeys.all, 'popular', period] as const,
  hot: () => [...postKeys.all, 'hot'] as const,
};
