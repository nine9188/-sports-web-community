import type { BettingOddsItem, BettingOddsObject } from '../types';

/**
 * 배당률 파싱 헬퍼 함수
 */
export function parseBettingOdds(bettingOdds: unknown): BettingOddsObject | null {
  if (!bettingOdds) return null;

  if (Array.isArray(bettingOdds)) {
    const items = bettingOdds as BettingOddsItem[];
    return {
      home: items.find(odd => odd.value === 'Home')?.odd ?? 0,
      draw: items.find(odd => odd.value === 'Draw')?.odd ?? 0,
      away: items.find(odd => odd.value === 'Away')?.odd ?? 0
    };
  }

  const odds = bettingOdds as BettingOddsObject;
  return {
    home: odds.home ?? 0,
    draw: odds.draw ?? 0,
    away: odds.away ?? 0
  };
}

/**
 * 차트 데이터 변환
 */
export function convertChartData(data: Record<string, unknown>) {
  const homeTeam = data.homeTeam as Record<string, unknown> | undefined;
  const awayTeam = data.awayTeam as Record<string, unknown> | undefined;
  const bettingOdds = data.bettingOdds as Record<string, unknown> | unknown[] | undefined;

  const homeStats = homeTeam?.stats as Record<string, unknown> | undefined;
  const awayStats = awayTeam?.stats as Record<string, unknown> | undefined;

  // 홈팀과 원정팀의 실제 데이터 추출
  const homeMatches = (homeStats?.homePlayed as number) || 0;
  const homeWins = (homeStats?.homeWins as number) || 0;
  const homeGoals = (homeStats?.homeGoalsFor as number) || 0;
  const homeConceded = (homeStats?.homeGoalsAgainst as number) || 0;

  const awayMatches = (awayStats?.awayPlayed as number) || 0;
  const awayWins = (awayStats?.awayWins as number) || 0;
  const awayGoals = (awayStats?.awayGoalsFor as number) || 0;
  const awayConceded = (awayStats?.awayGoalsAgainst as number) || 0;

  // 승률 직접 계산 (승수 / 경기수 * 100)
  const homeWinRate = homeMatches > 0 ? Math.round((homeWins / homeMatches) * 100 * 10) / 10 : 0;
  const awayWinRate = awayMatches > 0 ? Math.round((awayWins / awayMatches) * 100 * 10) / 10 : 0;

  return {
    homeTeam: {
      name: (homeTeam?.name as string) || 'Unknown',
      matches: homeMatches,
      wins: homeWins,
      draws: 0,
      losses: 0,
      winRate: homeWinRate,
      goals: homeGoals,
      conceded: homeConceded,
      goalDifference: homeGoals - homeConceded,
      form: (homeStats?.form as string) || '',
      injuries: (homeStats?.injuries as number) || 0
    },
    awayTeam: {
      name: (awayTeam?.name as string) || 'Unknown',
      matches: awayMatches,
      wins: awayWins,
      draws: 0,
      losses: 0,
      winRate: awayWinRate,
      goals: awayGoals,
      conceded: awayConceded,
      goalDifference: awayGoals - awayConceded,
      form: (awayStats?.form as string) || '',
      injuries: (awayStats?.injuries as number) || 0
    },
    bettingOdds: parseBettingOdds(bettingOdds)
  };
}

/**
 * 경기 데이터가 텍스트에 포함되어 있는지 확인
 */
export function hasMatchDataInText(text: string): boolean {
  return text.includes('【') ||
    text.includes('홈팀') ||
    text.includes('어웨이팀') ||
    text.includes('승률') ||
    text.includes('득점') ||
    text.includes('배당률') ||
    (text.includes('Gimcheon') && text.includes('Jeonbuk'));
}

/**
 * 경기 관련 헤더인지 확인
 */
export function isMatchHeader(headerText: string): boolean {
  return headerText.includes('경기') ||
    headerText.includes('분석') ||
    headerText.includes('통계') ||
    headerText.includes('데이터') ||
    headerText.includes('홈팀') ||
    headerText.includes('어웨이') ||
    headerText.includes('원정') ||
    headerText.includes('VS') ||
    headerText.includes('vs') ||
    headerText.includes('배당') ||
    headerText.includes('【') ||
    headerText.includes('】');
}
