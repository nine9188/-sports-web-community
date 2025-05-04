'use server'

import { createClient } from '@/shared/api/supabaseServer';

export async function getMatchesByDate(date: string) {
  try {
    // Supabase 클라이언트 초기화
    const supabase = await createClient();
    
    // matches 테이블에서 해당 날짜의 경기 데이터 조회
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('date', date)
      .order('timestamp', { ascending: true });
    
    if (error) {
      console.error('경기 데이터 조회 오류:', error.message);
      return [];
    }
    
    // 데이터가 없을 경우 빈 배열 반환
    if (!data || data.length === 0) {
      return [];
    }
    
    // 응답 데이터 형식 변환
    return data.map(match => ({
      id: match.id,
      fixture: {
        id: match.id,
        date: match.date
      },
      league: {
        id: match.league_id,
        name: match.league_name,
        logo: match.league_logo
      },
      teams: {
        home: {
          id: match.home_team_id,
          name: match.home_team_name,
          logo: match.home_team_logo
        },
        away: {
          id: match.away_team_id,
          name: match.away_team_name,
          logo: match.away_team_logo
        }
      },
      goals: {
        home: match.home_goals,
        away: match.away_goals
      },
      status: {
        code: match.status_code,
        elapsed: match.elapsed,
        name: match.status_name
      }
    }));
    
  } catch (error) {
    console.error('경기 데이터 조회 중 오류 발생:', error);
    return [];
  }
} 