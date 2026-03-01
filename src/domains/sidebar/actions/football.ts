'use server';

import { cache } from 'react';
import { StandingsData } from '../types';
import { MAJOR_LEAGUE_IDS } from '@/domains/livescore/constants/league-mappings';
import { getTeamLogoUrls } from '@/domains/livescore/actions/images';
import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi';

// 리그 ID 매핑
const LEAGUE_IDS: Record<string, number> = {
  premier: MAJOR_LEAGUE_IDS.PREMIER_LEAGUE,    // 프리미어 리그
  laliga: MAJOR_LEAGUE_IDS.LA_LIGA,            // 라리가
  bundesliga: MAJOR_LEAGUE_IDS.BUNDESLIGA,      // 분데스리가
  serieA: MAJOR_LEAGUE_IDS.SERIE_A,            // 세리에 A
  ligue1: MAJOR_LEAGUE_IDS.LIGUE_1             // 리그 1
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
    const season = month >= 8 ? year : year - 1;

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
    const standings = leagueInfo.standings?.[0] || [];

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
      standings: [
        standings.map((team: {
          rank: number;
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
        }) => ({
          rank: team.rank,
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
        }))
      ],
      // 4590 표준: 팀 로고 URL
      teamLogoUrls,
    };
  } catch {
    return null;
  }
}); 