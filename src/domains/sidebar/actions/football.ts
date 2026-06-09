'use server';

import { cache } from 'react';
import { StandingsData } from '../types';
import { getTeamLogoUrls } from '@/domains/livescore/actions/images';
import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi';

// 사이드바에서 표시하는 5대 리그 ID 매핑 (API-Football ID)
const LEAGUE_IDS: Record<string, number> = {
  worldcup: 1,
  premier: 39,
  laliga: 140,
  bundesliga: 78,
  serieA: 135,
  ligue1: 61,
};

/**
 * 축구 리그 순위 데이터를 가져오는 서버 액션
 * React cache로 래핑하여 중복 요청 방지
 */
export const fetchStandingsData = cache(async (leagueId: string = 'premier'): Promise<StandingsData | null> => {
  try {
    // 리그 ID 확인
    const apiLeagueId = LEAGUE_IDS[leagueId];
    if (!apiLeagueId) {
      return null;
    }

    // 현재 시즌 계산
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const season = leagueId === 'worldcup' ? 2026 : (month >= 8 ? year : year - 1);

    // 표준 API 래퍼 사용 (standings: 30분 revalidate)
    const data = await fetchFromFootballApi('standings', {
      league: apiLeagueId,
      season: season
    });

    // 데이터 형식 확인
    if (!data?.response || !data.response[0] || !data.response[0].league) {
      return null;
    }

    // 리그 정보 및 스탠딩 데이터 추출
    const leagueInfo = data.response[0].league;
    const standingsGroups = Array.isArray(leagueInfo.standings) ? leagueInfo.standings : [];
    const standings = standingsGroups.flat();

    // 팀 ID 추출
    const teamIds = standings.map((team: { team: { id: number } }) => team.team.id);

    // 4590 표준: 팀 로고 URL 배치 조회
    const teamLogoUrls = await getTeamLogoUrls(teamIds);

    // 데이터 변환 - StandingsData 타입에 맞게 조정
    return {
      league: {
        id: leagueInfo.id,
        name: leagueInfo.name,
        logo: leagueInfo.logo,
        country: leagueInfo.country,
        flag: leagueInfo.flag || '',
        season: leagueInfo.season
      },
      standings: standingsGroups.map((group: Array<{
          rank: number;
          group?: string;
          team: {
            id: number;
            name: string;
            logo: string;
          };
          points: number;
          goalsDiff: number;
          form: string;
          all: {
            played: number;
            win: number;
            draw: number;
            lose: number;
          };
        }>) => group.map((team) => ({
          rank: team.rank,
          group: team.group || null,
          team: {
            team_id: team.team.id,
            name: team.team.name,
            logo: team.team.logo
          },
          points: team.points,
          goalsDiff: team.goalsDiff,
          all: {
            played: team.all.played,
            win: team.all.win,
            draw: team.all.draw,
            lose: team.all.lose
          }
        }))),
      // 4590 표준: 팀 로고 URL
      teamLogoUrls,
    };
  } catch {
    return null;
  }
}); 
