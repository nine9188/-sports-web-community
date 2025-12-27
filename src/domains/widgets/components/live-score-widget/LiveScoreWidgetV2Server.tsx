import React from 'react';
import { fetchBigMatches, MatchData as FootballMatchData } from '@/domains/livescore/actions/footballApi';
import { getTeamById } from '@/domains/livescore/constants/teams';
import { getLeagueById } from '@/domains/livescore/constants/league-mappings';
import LiveScoreWidgetV2 from './LiveScoreWidgetV2';
import type { League, Match } from './types';

// API 응답 타입 정의
interface MultiDayMatchesResponse {
  success: boolean;
  data?: {
    yesterday: { matches: FootballMatchData[] };
    today: { matches: FootballMatchData[] };
    tomorrow: { matches: FootballMatchData[] };
  };
  error?: string;
}

// 리그별로 경기를 그룹화하는 함수
function groupMatchesByLeague(matches: FootballMatchData[]): League[] {
  const leagueMap = new Map<number, FootballMatchData[]>();

  matches.forEach(match => {
    if (!match.league?.id) return;

    const leagueId = match.league.id;
    if (!leagueMap.has(leagueId)) {
      leagueMap.set(leagueId, []);
    }
    leagueMap.get(leagueId)!.push(match);
  });

  return Array.from(leagueMap.entries()).map(([leagueId, matches]) => {
    const leagueInfo = getLeagueById(leagueId);
    const firstMatch = matches[0];

    return {
      id: String(leagueId),
      name: leagueInfo?.nameKo || firstMatch.league?.name || '리그',
      icon: '⚽',
      logo: firstMatch.league?.logo,
      leagueIdNumber: leagueId, // 숫자 ID 추가
      matches: matches.map(match => {
        const homeTeamInfo = match.teams?.home?.id ? getTeamById(match.teams.home.id) : null;
        const awayTeamInfo = match.teams?.away?.id ? getTeamById(match.teams.away.id) : null;

        return {
          id: String(match.id),
          homeTeam: {
            id: match.teams?.home?.id || 0,
            name: homeTeamInfo?.name_ko || match.teams?.home?.name || '홈팀',
            logo: match.teams?.home?.logo,
          },
          awayTeam: {
            id: match.teams?.away?.id || 0,
            name: awayTeamInfo?.name_ko || match.teams?.away?.name || '원정팀',
            logo: match.teams?.away?.logo,
          },
          score: {
            home: match.goals?.home ?? 0,
            away: match.goals?.away ?? 0,
          },
          status: match.status?.code || 'NS',
          elapsed: match.status?.elapsed || 0,
        };
      }),
    };
  });
}

// 서버 컴포넌트
export default async function LiveScoreWidgetV2Server() {
  let leagues: League[] = [];

  try {
    const result = await fetchBigMatches() as MultiDayMatchesResponse;

    if (result.success && result.data) {
      // 오늘 경기만 가져오기 (또는 전체 경기)
      const todayMatches = result.data.today?.matches || [];

      // 리그별로 그룹화
      leagues = groupMatchesByLeague(todayMatches);
    } else {
      console.warn('⚠️ LiveScoreWidgetV2: API 응답이 성공하지 않음', result.error);
    }
  } catch (error) {
    console.error('❌ LiveScoreWidgetV2 서버 데이터 로딩 오류:', error);
    leagues = [];
  }

  return <LiveScoreWidgetV2 leagues={leagues} />;
}
