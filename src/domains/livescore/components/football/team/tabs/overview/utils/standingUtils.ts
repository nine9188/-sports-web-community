import { StandingDisplay, StandingItem } from '../../../../../../types/standings';

/**
 * 특정 팀의 순위 정보를 찾는 함수
 */
export function findTeamStanding(standings: StandingDisplay[] | undefined, teamId: number): StandingItem | null {
  if (!standings || !Array.isArray(standings) || standings.length === 0) return null;
  
  // MLS 리그 특별 처리
  const processMlsStandings = (standings: StandingDisplay[]) => {
    const mlsLeague = standings.find(league => league.league?.id === 253);
    if (!mlsLeague) return standings;

    // 현재 팀이 속한 컨퍼런스 찾기
    let teamConferenceStandings = null;
    
    // standings가 2차원 배열인 경우 (컨퍼런스별로 나뉘어진 경우)
    if (Array.isArray(mlsLeague.standings) && mlsLeague.standings.length > 0) {
      // 각 컨퍼런스에서 팀 찾기
      for (const conferenceStandings of mlsLeague.standings) {
        if (Array.isArray(conferenceStandings)) {
          const teamFound = conferenceStandings.find((standing: StandingItem) => 
            standing && standing.team && standing.team.id === teamId
          );
          if (teamFound) {
            teamConferenceStandings = conferenceStandings;
            break;
          }
        }
      }
    }

    // 팀이 속한 컨퍼런스 순위만 사용
    if (teamConferenceStandings) {
      const filteredMlsLeague = {
        ...mlsLeague,
        standings: teamConferenceStandings
      };
      
      return standings.map(league => 
        league.league?.id === 253 ? filteredMlsLeague : league
      );
    }

    return standings;
  };

  // MLS 처리 적용
  const processedStandings = processMlsStandings(standings);
  
  // 국내 리그와 국제 대회 구분을 위한 변수
  let domesticLeagueStanding: StandingItem | null = null;
  let internationalLeagueStanding: StandingItem | null = null;
  
  // 모든 리그의 순위 정보를 검색
  for (const league of processedStandings) {
    if (!league || !league.standings || !Array.isArray(league.standings)) continue;
    
    // 팀 ID로 순위 정보 찾기
    const teamStanding = league.standings.find((standing: StandingItem) => 
      standing && standing.team && standing.team.id === teamId
    );
    
    if (teamStanding) {
      // 국내 리그 vs 국제 대회 구분
      const isInternational = 
        league.league.name.includes('Champions') || 
        league.league.name.includes('Europa') ||
        league.league.name.includes('Conference');
      
      if (!isInternational) {
        domesticLeagueStanding = teamStanding;
        break; // 국내 리그 정보를 찾으면 우선 사용하고 루프 종료
      } else if (!domesticLeagueStanding) {
        // 국제 대회 정보는 일단 저장하지만 계속 검색
        internationalLeagueStanding = teamStanding;
      }
    }
  }
  
  // 국내 리그 정보가 있으면 우선 사용, 없으면 국제 대회 정보 사용
  return domesticLeagueStanding || internationalLeagueStanding;
}

/**
 * 표시할 순위 범위를 계산하는 함수 (현재 팀 기준 위아래 2팀씩)
 */
export function getDisplayStandings(
  standings: StandingDisplay[] | undefined, 
  teamId: number, 
  currentTeamStanding: StandingItem | null
): StandingItem[] {
  if (!standings || !Array.isArray(standings) || standings.length === 0) return [];
  
  // MLS 리그 특별 처리
  const processMlsStandings = (standings: StandingDisplay[]) => {
    const mlsLeague = standings.find(league => league.league?.id === 253);
    if (!mlsLeague) return standings;

    // 현재 팀이 속한 컨퍼런스 찾기
    let teamConferenceStandings = null;
    
    // standings가 2차원 배열인 경우 (컨퍼런스별로 나뉘어진 경우)
    if (Array.isArray(mlsLeague.standings) && mlsLeague.standings.length > 0) {
      // 각 컨퍼런스에서 팀 찾기
      for (const conferenceStandings of mlsLeague.standings) {
        if (Array.isArray(conferenceStandings)) {
          const teamFound = conferenceStandings.find((standing: StandingItem) => 
            standing && standing.team && standing.team.id === teamId
          );
          if (teamFound) {
            teamConferenceStandings = conferenceStandings;
            break;
          }
        }
      }
    }

    // 팀이 속한 컨퍼런스 순위만 사용
    if (teamConferenceStandings) {
      const filteredMlsLeague = {
        ...mlsLeague,
        standings: teamConferenceStandings
      };
      
      return standings.map(league => 
        league.league?.id === 253 ? filteredMlsLeague : league
      );
    }

    return standings;
  };

  // MLS 처리 적용
  const processedStandings = processMlsStandings(standings);
  
  // 팀이 포함된 리그 찾기
  let targetLeague: StandingDisplay | null = null;
  
  // 리그 이름으로 라리가, 프리미어리그, 분데스리가 등 메이저 리그 직접 확인 (높은 우선순위)
  const majorLeagueNames = ['La Liga', 'Primera Division', 'LaLiga', 'Premier League', 'Bundesliga', 'Serie A', 'Ligue 1'];
  
  // 1. 먼저 팀이 속한 메이저 국내 리그를 특정 이름으로 찾기 (가장 높은 우선순위)
  for (const league of processedStandings) {
    if (!league || !league.standings || !Array.isArray(league.standings)) continue;
    
    // 팀이 이 리그에 있고, 메이저 리그인지 확인
    const hasTeam = league.standings.some((standing: StandingItem) => 
      standing && standing.team && standing.team.id === teamId
    );
    
    const isMajorLeague = majorLeagueNames.some(name => 
      league.league.name.includes(name)
    );
    
    if (hasTeam && isMajorLeague) {
      targetLeague = league;
      break;
    }
  }
  
  // 2. 메이저 리그에서 팀을 찾지 못했다면, 일반 국내 리그 찾기
  if (!targetLeague) {
    for (const league of processedStandings) {
      if (!league || !league.standings || !Array.isArray(league.standings)) continue;
      
      // 팀이 이 리그에 있고, 챔피언스리그/유로파리그가 아닌지 확인
      const hasTeam = league.standings.some((standing: StandingItem) => 
        standing && standing.team && standing.team.id === teamId
      );
      
      if (hasTeam && 
          !league.league.name.includes('Champions') && 
          !league.league.name.includes('Europa') &&
          !league.league.name.includes('Conference')) {
        targetLeague = league;
        break;
      }
    }
  }
  
  // 3. 국내 리그에서 팀을 찾지 못했다면, 어떤 리그든 팀이 있는 리그 찾기
  if (!targetLeague) {
    for (const league of processedStandings) {
      if (!league || !league.standings || !Array.isArray(league.standings)) continue;
      
      const hasTeam = league.standings.some((standing: StandingItem) => 
        standing && standing.team && standing.team.id === teamId
      );
      
      if (hasTeam) {
        targetLeague = league;
        break;
      }
    }
  }
  
  // 4. 여전히 리그를 찾지 못했다면 첫 번째 국내 리그 사용
  if (!targetLeague) {
    // 메이저 리그 먼저 찾기
    const majorLeague = processedStandings.find(league => 
      league && league.league && 
      majorLeagueNames.some(name => league.league.name.includes(name))
    );
    
    if (majorLeague) {
      targetLeague = majorLeague;
    } else {
      // 없으면 챔스/유로파 제외 리그 찾기
      const domesticLeague = processedStandings.find(league => 
        league && league.league && 
        !league.league.name.includes('Champions') && 
        !league.league.name.includes('Europa') && 
        !league.league.name.includes('Conference')
      );
      
      if (domesticLeague) {
        targetLeague = domesticLeague;
      } else {
        // 그래도 없으면 첫 번째 리그 사용
        targetLeague = processedStandings[0];
      }
    }
  }
  
  if (!targetLeague || !targetLeague.standings || !Array.isArray(targetLeague.standings)) return [];
  
  const allStandings = targetLeague.standings;
  
  if (!currentTeamStanding) return allStandings.slice(0, 5); // 현재 팀 순위 없으면 상위 5개 표시
  
  const currentRank = currentTeamStanding.rank;
  let startRank = Math.max(1, currentRank - 2);
  let endRank = Math.min(allStandings.length, currentRank + 2);
  
  // 범위가 5개 미만이면 조정
  if (endRank - startRank < 4) {
    if (startRank === 1) {
      endRank = Math.min(allStandings.length, 5);
    } else {
      startRank = Math.max(1, endRank - 4);
    }
  }
  
  return allStandings.filter((s: StandingItem) => s && s.rank >= startRank && s.rank <= endRank);
}

/**
 * 리그 정보를 가져오는 함수
 */
export function getLeagueInfo(standings: StandingDisplay[] | undefined) {
  if (!standings || !Array.isArray(standings) || standings.length === 0) return null;
  
  // MLS 리그 특별 처리 (첫 번째 컨퍼런스만 사용)
  const processMlsStandings = (standings: StandingDisplay[]) => {
    const mlsLeague = standings.find(league => league.league?.id === 253);
    if (!mlsLeague) return standings;

    // MLS의 경우 첫 번째 컨퍼런스 정보만 사용
    if (Array.isArray(mlsLeague.standings) && mlsLeague.standings.length > 0) {
      const filteredMlsLeague = {
        ...mlsLeague,
        standings: mlsLeague.standings[0] // 첫 번째 컨퍼런스만 사용
      };
      
      return standings.map(league => 
        league.league?.id === 253 ? filteredMlsLeague : league
      );
    }

    return standings;
  };

  // MLS 처리 적용
  const processedStandings = processMlsStandings(standings);
  
  // 메이저 리그 이름 정의
  const majorLeagueNames = ['La Liga', 'Primera Division', 'LaLiga', 'Premier League', 'Bundesliga', 'Serie A', 'Ligue 1'];
  
  // 1. 메이저 리그 찾기 (가장 높은 우선순위)
  const majorLeague = processedStandings.find(league => 
    league && league.league && 
    majorLeagueNames.some(name => league.league.name.includes(name))
  );
  
  if (majorLeague) {
    return majorLeague.league;
  }
  
  // 2. 국내 리그와 챔피언스리그/유로파리그 등 구분
  const domesticLeague = processedStandings.find(league => 
    league && league.league && 
    !league.league.name.includes('Champions') && 
    !league.league.name.includes('Europa') && 
    !league.league.name.includes('Conference')
  );
  
  // 국내 리그가 있으면 우선 사용, 없으면 첫 번째 리그 사용
  return domesticLeague?.league || processedStandings[0]?.league || null;
}

/**
 * 표시 중인 스탠딩 데이터의 리그 정보를 가져오는 함수
 */
export function getLeagueForStandings(
  standings: StandingDisplay[] | undefined,
  displayStandings: StandingItem[]
) {
  if (!standings || !displayStandings || displayStandings.length === 0) return null;
  
  // MLS 리그 특별 처리 (첫 번째 컨퍼런스만 사용)
  const processMlsStandings = (standings: StandingDisplay[]) => {
    const mlsLeague = standings.find(league => league.league?.id === 253);
    if (!mlsLeague) return standings;

    // MLS의 경우 첫 번째 컨퍼런스 정보만 사용
    if (Array.isArray(mlsLeague.standings) && mlsLeague.standings.length > 0) {
      const filteredMlsLeague = {
        ...mlsLeague,
        standings: mlsLeague.standings[0] // 첫 번째 컨퍼런스만 사용
      };
      
      return standings.map(league => 
        league.league?.id === 253 ? filteredMlsLeague : league
      );
    }

    return standings;
  };

  // MLS 처리 적용
  const processedStandings = processMlsStandings(standings);
  
  // 메이저 리그 이름 정의
  const majorLeagueNames = ['La Liga', 'Primera Division', 'LaLiga', 'Premier League', 'Bundesliga', 'Serie A', 'Ligue 1'];
  
  // 스탠딩에 있는 첫 번째 팀 ID로 리그 찾기
  const firstTeamId = displayStandings[0].team.id;
  
  // 1. 메이저 리그 중에서 해당 팀이 속한 리그 찾기
  for (const league of processedStandings) {
    if (!league || !league.standings || !Array.isArray(league.standings)) continue;
    
    const leagueHasTeam = league.standings.some(
      (standing: StandingItem) => standing.team.id === firstTeamId
    );
    
    const isMajorLeague = majorLeagueNames.some(name => 
      league.league.name.includes(name)
    );
    
    if (leagueHasTeam && isMajorLeague) {
      return league.league;
    }
  }
  
  // 2. 해당 팀이 속한 리그 찾기 (어떤 리그든)
  for (const league of processedStandings) {
    if (!league || !league.standings || !Array.isArray(league.standings)) continue;
    
    const leagueHasTeam = league.standings.some(
      (standing: StandingItem) => standing.team.id === firstTeamId
    );
    
    if (leagueHasTeam) {
      return league.league;
    }
  }
  
  // 찾지 못한 경우 현재 팀의 리그 반환 (기본 동작과 같음)
  return getLeagueInfo(standings);
} 