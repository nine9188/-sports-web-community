/**
 * 경기 통계 파싱 유틸리티
 *
 * 텍스트에서 홈팀/어웨이팀 시즌 통계와 배당률 정보를 추출합니다.
 */

export interface TeamStats {
  name: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  goals: number;
  conceded: number;
  goalDifference: number;
  form: string;
  injuries: number;
}

export interface BettingOdds {
  home: number;
  draw: number;
  away: number;
}

export interface MatchStats {
  homeTeam: TeamStats;
  awayTeam: TeamStats;
  bettingOdds: BettingOdds | null;
}

/**
 * 팀 통계 데이터를 파싱합니다.
 */
function parseTeamData(teamData: string, isHome: boolean): Omit<TeamStats, 'name'> {
  // "- 경기수: 19경기 - 승부 기록: 11승 4무 4패 - 홈 승률: 57. 9%" 형식
  const matches = parseInt(teamData.match(/경기수:\s*(\d+)\s*경기/)?.[1] || '0');

  const winsMatch = teamData.match(/승부\s+기록:\s*(\d+)\s*승\s+(\d+)\s*무\s+(\d+)\s*패/);
  const wins = winsMatch ? parseInt(winsMatch[1]) : 0;
  const draws = winsMatch ? parseInt(winsMatch[2]) : 0;
  const losses = winsMatch ? parseInt(winsMatch[3]) : 0;

  // "홈 승률: 57. 9%" 또는 "원정 승률: 25. 0%" 형식 (공백 포함)
  const winRatePattern = isHome ? /홈\s*승률:\s*([\d.\s]+)%/ : /원정\s*승률:\s*([\d.\s]+)%/;
  const winRateMatch = teamData.match(winRatePattern);
  const winRate = winRateMatch ? parseFloat(winRateMatch[1].replace(/\s+/g, '')) : 0;

  // "득점: 31골" 형식
  const goals = parseInt(teamData.match(/득점:\s*(\d+)\s*골/)?.[1] || '0');
  const conceded = parseInt(teamData.match(/실점:\s*(\d+)\s*골/)?.[1] || '0');

  // "최근 5경기 폼: W - D - W - D - L" 형식
  const formMatch = teamData.match(/최근\s*5경기\s*폼:\s*([W\s\-\s*D\s\-\s*L\s\-\s*]+)/);
  const form = formMatch ? formMatch[1].replace(/\s+/g, '') : '';

  const injuries = parseInt(teamData.match(/부상자\s*수:\s*(\d+)\s*명/)?.[1] || '0');

  return {
    matches,
    wins,
    draws,
    losses,
    winRate,
    goals,
    conceded,
    goalDifference: goals - conceded,
    form,
    injuries
  };
}

/**
 * 배당률 데이터를 파싱합니다.
 */
function parseOddsData(oddsData: string): BettingOdds | null {
  // "- 홈 승리: 2. 75 - 무승부: 3. 30 - 어웨이 승리: 2. 45" 형식 (공백 포함)
  const homeOddMatch = oddsData.match(/홈\s*승리:\s*([\d.\s]+)/);
  const drawOddMatch = oddsData.match(/무승부:\s*([\d.\s]+)/);
  const awayOddMatch = oddsData.match(/어웨이\s*승리:\s*([\d.\s]+)/);

  const homeOdd = homeOddMatch ? parseFloat(homeOddMatch[1].replace(/\s+/g, '')) : 0;
  const drawOdd = drawOddMatch ? parseFloat(drawOddMatch[1].replace(/\s+/g, '')) : 0;
  const awayOdd = awayOddMatch ? parseFloat(awayOddMatch[1].replace(/\s+/g, '')) : 0;

  if (homeOdd > 0 && drawOdd > 0 && awayOdd > 0) {
    return { home: homeOdd, draw: drawOdd, away: awayOdd };
  }

  return null;
}

/**
 * 텍스트에서 경기 통계를 추출합니다.
 *
 * @param text 경기 통계가 포함된 텍스트
 * @returns 파싱된 경기 통계 또는 null
 */
export function parseMatchStatsFromText(text: string): MatchStats | null {
  try {
    // 홈팀과 원정팀 데이터 추출
    const homeTeamMatch = text.match(/【\s*홈팀\s+(.+?)\s+시즌\s+통계\s*】([\s\S]*?)(?=【|$)/);
    const awayTeamMatch = text.match(/【\s*어웨이팀\s+(.+?)\s+시즌\s+통계\s*】([\s\S]*?)(?=【|$)/);
    const oddsMatch = text.match(/【\s*배당률\s+정보\s*】([\s\S]*?)(?=【|$)/);

    if (!homeTeamMatch || !awayTeamMatch) {
      return null;
    }

    const homeTeamName = homeTeamMatch[1].trim();
    const homeTeamData = homeTeamMatch[2];
    const awayTeamName = awayTeamMatch[1].trim();
    const awayTeamData = awayTeamMatch[2];

    // 팀 데이터 파싱
    const homeStats = parseTeamData(homeTeamData, true);
    const awayStats = parseTeamData(awayTeamData, false);

    // 배당률 파싱
    const bettingOdds = oddsMatch ? parseOddsData(oddsMatch[1]) : null;

    return {
      homeTeam: { name: homeTeamName, ...homeStats },
      awayTeam: { name: awayTeamName, ...awayStats },
      bettingOdds
    };
  } catch {
    return null;
  }
}
