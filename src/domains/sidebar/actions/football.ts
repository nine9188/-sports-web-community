'use server';

import { StandingsData } from '../types';
import { MAJOR_LEAGUE_IDS } from '@/domains/livescore/constants/league-mappings';

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
 */
export async function fetchStandingsData(leagueId: string = 'premier'): Promise<StandingsData | null> {
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

    // API 키 확인
    if (!process.env.FOOTBALL_API_KEY) {
      return null;
    }

    // API 호출 - next.js 캐시 사용 (10분으로 줄임)
    const response = await fetch(
      `https://v3.football.api-sports.io/standings?league=${apiLeagueId}&season=${season}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        next: { revalidate: 600 } // 10분 캐싱으로 변경
      }
    );

    // 응답 확인
    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
    }

    // JSON 데이터 파싱
    const data = await response.json();
    
    // 데이터 형식 확인
    if (!data.response || !data.response[0] || !data.response[0].league) {
      return null;
    }

    // 리그 정보 및 스탠딩 데이터 추출
    const leagueInfo = data.response[0].league;
    const standings = leagueInfo.standings?.[0] || [];

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
      ]
    };
  } catch {
    return null;
  }
} 