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

// 경기 시작 시간 추출 (HH:mm 형식)
function getKickoffTime(dateString?: string): string | undefined {
  if (!dateString) return undefined;
  try {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return undefined;
  }
}

// 경기 데이터를 Match 타입으로 변환
function convertToMatch(
  match: FootballMatchData,
  dateLabel: 'today' | 'tomorrow'
): Match {
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
    dateLabel,
    kickoffTime: getKickoffTime(match.time?.date),
  };
}

// 리그별로 경기를 그룹화하는 함수 (오늘+내일 통합)
function groupMatchesByLeague(
  todayMatches: FootballMatchData[],
  tomorrowMatches: FootballMatchData[]
): League[] {
  const leagueMap = new Map<number, { matches: Match[]; firstMatch: FootballMatchData }>();

  // 오늘 경기 추가
  todayMatches.forEach(match => {
    if (!match.league?.id) return;
    const leagueId = match.league.id;

    if (!leagueMap.has(leagueId)) {
      leagueMap.set(leagueId, { matches: [], firstMatch: match });
    }
    leagueMap.get(leagueId)!.matches.push(convertToMatch(match, 'today'));
  });

  // 내일 경기 추가 (같은 리그에 합침)
  tomorrowMatches.forEach(match => {
    if (!match.league?.id) return;
    const leagueId = match.league.id;

    if (!leagueMap.has(leagueId)) {
      leagueMap.set(leagueId, { matches: [], firstMatch: match });
    }
    leagueMap.get(leagueId)!.matches.push(convertToMatch(match, 'tomorrow'));
  });

  return Array.from(leagueMap.entries()).map(([leagueId, { matches, firstMatch }]) => {
    const leagueInfo = getLeagueById(leagueId);

    return {
      id: String(leagueId),
      name: leagueInfo?.nameKo || firstMatch.league?.name || '리그',
      icon: '⚽',
      logo: firstMatch.league?.logo,
      leagueIdNumber: leagueId,
      matches,
    };
  });
}

/**
 * 라이브스코어 데이터를 가져오는 함수 (병렬 fetch용)
 * page.tsx에서 Promise.all로 호출 가능
 */
export async function fetchLiveScoreData(): Promise<League[]> {
  try {
    const result = await fetchBigMatches() as MultiDayMatchesResponse;

    if (result.success && result.data) {
      const todayMatches = result.data.today?.matches || [];
      const tomorrowMatches = result.data.tomorrow?.matches || [];
      return groupMatchesByLeague(todayMatches, tomorrowMatches);
    } else {
      console.warn('⚠️ LiveScoreWidgetV2: API 응답이 성공하지 않음', result.error);
      return [];
    }
  } catch (error) {
    console.error('❌ LiveScoreWidgetV2 서버 데이터 로딩 오류:', error);
    return [];
  }
}

interface LiveScoreWidgetV2ServerProps {
  /** 미리 fetch된 데이터 (병렬 fetch 시 사용) */
  initialData?: League[];
}

// 서버 컴포넌트
export default async function LiveScoreWidgetV2Server({ initialData }: LiveScoreWidgetV2ServerProps = {}) {
  // initialData가 제공되면 바로 사용, 없으면 자체 fetch
  const leagues = initialData ?? await fetchLiveScoreData();

  return <LiveScoreWidgetV2 leagues={leagues} />;
}
