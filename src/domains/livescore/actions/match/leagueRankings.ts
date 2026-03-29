'use server';

import { cache } from 'react';
import { PlayerRanking } from '@/domains/livescore/types/player';
import { getPlayerPhotoUrls, getTeamLogoUrls } from '@/domains/livescore/actions/images';
import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi';
import { getCurrentSeasonForLeague } from '@/domains/livescore/constants/league-mappings';
import { getPlayersKoreanNames } from '@/domains/livescore/actions/player/getKoreanName';

interface ApiRankingItem {
  player?: {
    id?: number;
    name?: string;
    photo?: string;
    nationality?: string;
  };
  statistics?: Array<{
    team?: {
      id?: number;
      name?: string;
      logo?: string;
    };
    goals?: {
      total?: number;
      assists?: number;
    };
    games?: {
      appearences?: number;
      minutes?: number;
    };
  }>;
}

export interface LeagueRankingsData {
  topScorers: PlayerRanking[];
  topAssists: PlayerRanking[];
  playerPhotoUrls: Record<number, string>;
  teamLogoUrls: Record<number, string>;
  playerKoreanNames: Record<number, string | null>;
}

/**
 * 리그의 득점/도움 순위 데이터 가져오기 (리그 상세 페이지용)
 */
async function fetchLeagueRankings(leagueId: number): Promise<LeagueRankingsData> {
  const empty: LeagueRankingsData = {
    topScorers: [],
    topAssists: [],
    playerPhotoUrls: {},
    teamLogoUrls: {},
    playerKoreanNames: {},
  };

  try {
    if (!leagueId) return empty;

    const currentSeason = getCurrentSeasonForLeague(leagueId);

    // 득점/도움 순위 병렬 fetch
    const [scorersRes, assistsRes] = await Promise.all([
      fetchFromFootballApi(`players/topscorers`, { league: leagueId, season: currentSeason })
        .catch(() => ({ response: [] })),
      fetchFromFootballApi(`players/topassists`, { league: leagueId, season: currentSeason })
        .catch(() => ({ response: [] })),
    ]);

    const parseRankings = (response: { response?: unknown[] }): PlayerRanking[] => {
      if (!response?.response || !Array.isArray(response.response)) return [];

      return response.response
        .filter((item: unknown) => {
          const r = item as ApiRankingItem;
          return r.player?.id;
        })
        .slice(0, 10)
        .map((item: unknown) => {
          const r = item as ApiRankingItem;
          return {
            player: {
              id: r.player?.id || 0,
              name: r.player?.name || '',
              photo: r.player?.photo || '',
            },
            statistics: [{
              team: {
                id: r.statistics?.[0]?.team?.id || 0,
                name: r.statistics?.[0]?.team?.name || '',
                logo: r.statistics?.[0]?.team?.logo || '',
              },
              goals: {
                total: r.statistics?.[0]?.goals?.total || 0,
                assists: r.statistics?.[0]?.goals?.assists || 0,
              },
              games: {
                appearences: r.statistics?.[0]?.games?.appearences || 0,
                minutes: r.statistics?.[0]?.games?.minutes || 0,
              },
              cards: { yellow: 0, red: 0 },
            }],
          };
        });
    };

    const topScorers = parseRankings(scorersRes as { response?: unknown[] });
    const topAssists = parseRankings(assistsRes as { response?: unknown[] });

    // 4590 표준: 이미지 URL 배치 조회
    const allPlayerIds = new Set<number>();
    const allTeamIds = new Set<number>();

    for (const ranking of [...topScorers, ...topAssists]) {
      if (ranking.player?.id) allPlayerIds.add(ranking.player.id);
      if (ranking.statistics?.[0]?.team?.id) allTeamIds.add(ranking.statistics[0].team.id);
    }

    const [playerPhotoUrls, teamLogoUrls, playerKoreanNames] = await Promise.all([
      allPlayerIds.size > 0 ? getPlayerPhotoUrls([...allPlayerIds]) : {},
      allTeamIds.size > 0 ? getTeamLogoUrls([...allTeamIds]) : {},
      allPlayerIds.size > 0 ? getPlayersKoreanNames([...allPlayerIds]) : {},
    ]);

    return { topScorers, topAssists, playerPhotoUrls, teamLogoUrls, playerKoreanNames };
  } catch {
    return empty;
  }
}

export const fetchCachedLeagueRankings = cache(fetchLeagueRankings);
