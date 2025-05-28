'use server'

import { fetchMatchesByDate } from '@/domains/livescore/actions/footballApi';

export async function getMatchesByDate(date: string) {
  try {
    console.log(`경기 데이터 요청: ${date} (실제 API 호출)`);
    
    // 실제 Football API에서 경기 데이터 가져오기
    const matches = await fetchMatchesByDate(date);
    
    // 게시글 작성용 형식으로 변환
    const formattedMatches = matches.map(match => ({
      id: match.id.toString(),
      fixture: {
        id: match.id.toString(),
        date: date
      },
      league: {
        id: match.league.id.toString(),
        name: match.league.name,
        logo: match.league.logo
      },
      teams: {
        home: {
          id: match.teams.home.id.toString(),
          name: match.teams.home.name,
          logo: match.teams.home.logo
        },
        away: {
          id: match.teams.away.id.toString(),
          name: match.teams.away.name,
          logo: match.teams.away.logo
        }
      },
      goals: {
        home: match.goals.home,
        away: match.goals.away
      },
      status: {
        code: match.status.code,
        elapsed: match.status.elapsed,
        name: match.status.name
      }
    }));
    
    return formattedMatches;
    
  } catch (error) {
    console.error('경기 데이터 조회 중 오류 발생:', error);
    
    // API 오류 시 빈 배열 반환
    return [];
  }
} 