/**
 * 라이브스코어 페이지용 SEO 요약 문구 생성 유틸리티
 */

// 1. 경기 상세 페이지 요약 생성
export function buildMatchSeoSummary(match: {
  status: { code: string; name: string };
  time: { date: string };
  league: { name: string; round?: string };
  teams: {
    home: { name: string };
    away: { name: string };
  };
  goals?: { home: number | null; away: number | null } | null;
  venue?: { name: string | null; city: string | null } | null;
}): string {
  const homeTeam = match.teams.home.name;
  const awayTeam = match.teams.away.name;
  const leagueName = match.league.name;
  const roundText = match.league.round ? ` ${match.league.round}` : '';
  
  // 날짜 포맷팅
  let dateText = '';
  if (match.time?.date) {
    const matchDate = new Date(match.time.date);
    if (!isNaN(matchDate.getTime())) {
      dateText = `${matchDate.getFullYear()}년 ${matchDate.getMonth() + 1}월 ${matchDate.getDate()}일 `;
    }
  }

  const venueText = match.venue?.name 
    ? ` 경기 장소는 ${[match.venue.name, match.venue.city].filter(Boolean).join(', ')}입니다.` 
    : '';

  const isNotStarted = ['TBD', 'NS'].includes(match.status.code);
  const homeGoals = match.goals?.home;
  const awayGoals = match.goals?.away;
  const hasScore = homeGoals !== undefined && homeGoals !== null && awayGoals !== undefined && awayGoals !== null;

  if (isNotStarted || !hasScore) {
    return `${dateText}${leagueName}${roundText} ${homeTeam} vs ${awayTeam} 경기 일정입니다.${venueText} 양 팀의 최근 상대 전적, 예상 라인업, 실시간 전력 비교 분석 정보를 4590 Football에서 확인하세요.`;
  } else {
    const score = `${homeGoals}-${awayGoals}`;
    const resultText = homeGoals > awayGoals 
      ? `${homeTeam}의 승리` 
      : homeGoals < awayGoals 
        ? `${awayTeam}의 승리` 
        : '무승부';
    
    return `${dateText}${leagueName}${roundText} ${homeTeam} vs ${awayTeam} 경기가 최종 스코어 ${score}(${resultText})로 종료되었습니다.${venueText} 아래에서 양 팀의 상세 평점 통계, 선수 기록 및 경기 하이라이트를 즉시 확인해 보세요.`;
  }
}

// 2. 팀 프로필 페이지 요약 생성
export function buildTeamSeoSummary(team: {
  name: string;
  country?: string | null;
  founded?: number | string | null;
  venue?: { name: string | null; city: string | null } | null;
  leagueName?: string | null;
}): string {
  const teamName = team.name;
  const leagueInfo = team.leagueName ? `${team.leagueName} 소속` : '';
  const countryInfo = team.country ? `${team.country} 축구 클럽` : '축구 클럽';
  const foundedInfo = team.founded ? `, 창단 연도는 ${team.founded}년` : '';
  const venueInfo = team.venue?.name 
    ? `, 홈구장은 ${[team.venue.name, team.venue.city].filter(Boolean).join(', ')}` 
    : '';

  const contextList = [leagueInfo, countryInfo].filter(Boolean).join(', ');

  return `${teamName}은 ${contextList}입니다${foundedInfo}${venueInfo}입니다. 4590 Football에서 ${teamName}의 실시간 리그 순위표, 경기 일정 및 최근 전적 결과, 선수단 스쿼드 구성 및 이적시장 기록을 확인하세요.`;
}

// 3. 선수 프로필 페이지 요약 생성
export function buildPlayerSeoSummary(player: {
  name: string;
  teamName?: string | null;
  nationality?: string | null;
  age?: number | string | null;
  position?: string | null;
  number?: number | string | null;
}): string {
  const playerName = player.name;
  const teamText = player.teamName ? `${player.teamName} 소속의` : '';
  const nationText = player.nationality ? `${player.nationality} 국적` : '';
  const ageText = player.age ? `${player.age}세` : '';
  const positionText = player.position ? `${player.position}` : '축구 선수';
  const numberText = player.number ? `(등번호 ${player.number}번)` : '';

  const specs = [nationText, ageText, positionText].filter(Boolean).join(', ');
  const specText = specs ? ` ${specs}${numberText}입니다.` : ' 축구 선수입니다.';

  return `${playerName}은 ${teamText}${specText} 4590 Football에서 ${playerName} 선수의 이번 시즌 경기 출전 통계, 득점 및 도움 랭킹, 시장 가치, 최근 경기 활약 분석 데이터를 확인해 보세요.`;
}

// 4. 리그 및 순위표 페이지 요약 생성
export function buildLeagueSeoSummary(league: {
  name: string;
  season?: string | number | null;
}): string {
  const leagueName = league.name;
  const seasonText = league.season ? `${league.season} 시즌 ` : '';

  return `${seasonText}${leagueName}의 실시간 팀 순위표와 경기 일정 및 결과 목록입니다. 4590 Football에서 현재 순위 경쟁 분석 현황, 리그 최다 득점 및 도움 선수 순위표, 최근 경기 하이라이트를 편리하게 감상하세요.`;
}

// 5. 라이브스코어 메인 페이지 요약 생성
export function buildLiveScoreMainSeoSummary(dateLabel: string, totalCount: number, liveCount: number): string {
  const matchesText = totalCount > 0 ? ` 진행되는 축구 경기는 총 ${totalCount}경기이며,` : '';
  const liveText = liveCount > 0 ? ` 현재 진행 중인 라이브 경기는 총 ${liveCount}개입니다.` : ' 현재 진행 중인 라이브 경기는 없습니다.';
  return `${dateLabel}${matchesText}${liveText} 전 세계 축구 경기 일정, 실시간 점수(라이브스코어) 및 경기 결과를 4590 Football에서 확인해 보세요. EPL, 라리가, 분데스리가, 세리에A, 리그앙, 챔피언스리그, K리그 등 주요 국내외 리그의 실시간 스코어 정보를 빠르게 제공합니다.`;
}

// 6. 리그 인덱스 페이지 요약 생성
export function buildLeaguesMainSeoSummary(): string {
  return `전 세계 다양한 축구 리그의 순위표와 팀 정보를 4590 Football에서 편리하게 확인해 보세요. 프리미어리그(EPL), 라리가, 분데스리가, 세리에A, 리그앙, K리그 등 주요 국내외 리그 및 아시아, 아메리카의 다양한 축구 대회 순위표와 팀 정보를 실시간으로 제공합니다.`;
}
