'use server'

import { createClient } from '@/shared/api/supabaseServer'
import { getLeagueName } from '@/domains/livescore/constants/league-mappings'

export interface TeamSearchResult {
  id: string
  team_id: number
  name: string
  display_name: string
  short_name: string | null
  code: string | null
  logo_url: string | null
  league_id: number
  league_name: string
  league_name_ko: string
  country: string
  venue_name: string | null
  venue_city: string | null
  current_position: number | null
  is_winner: boolean
  popularity_score: number
}

export interface TeamSearchOptions {
  query: string
  leagueId?: number
  country?: string
  limit?: number
  offset?: number
}

export async function searchTeams(options: TeamSearchOptions): Promise<{
  teams: TeamSearchResult[]
  total: number
  hasMore: boolean
}> {
  const { query, leagueId, country, limit = 20, offset = 0 } = options
  
  if (!query.trim()) {
    return { teams: [], total: 0, hasMore: false }
  }

  try {
    const supabase = await createClient()
    
    // 검색 쿼리 구성
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let searchQuery = (supabase as any)
      .from('football_teams')
      .select(`
        id,
        team_id,
        name,
        display_name,
        short_name,
        code,
        logo_url,
        league_id,
        league_name,
        country,
        venue_name,
        venue_city,
        current_position,
        is_winner,
        popularity_score
      `)
      .eq('is_active', true)

    // 텍스트 검색 (팀명, 코드, 도시명에서 검색)
    const searchTerm = query.trim().toLowerCase()
    searchQuery = searchQuery.or(`name.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%,short_name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%,venue_city.ilike.%${searchTerm}%`)

    // 필터 조건 추가
    if (leagueId) {
      searchQuery = searchQuery.eq('league_id', leagueId)
    }

    if (country) {
      searchQuery = searchQuery.eq('country', country)
    }

    // 정렬: 인기도 > 현재 순위 > 이름순
    searchQuery = searchQuery
      .order('popularity_score', { ascending: false })
      .order('current_position', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true })

    // 페이지네이션 - count 쿼리 분리
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const countQuery = (supabase as any)
      .from('football_teams')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // 검색 조건 동일하게 적용
    const countSearchTerm = query.trim().toLowerCase()
    let finalCountQuery = countQuery.or(`name.ilike.%${countSearchTerm}%,display_name.ilike.%${countSearchTerm}%,short_name.ilike.%${countSearchTerm}%,code.ilike.%${countSearchTerm}%,venue_city.ilike.%${countSearchTerm}%`)
    
    if (leagueId) {
      finalCountQuery = finalCountQuery.eq('league_id', leagueId)
    }
    if (country) {
      finalCountQuery = finalCountQuery.eq('country', country)
    }

    const { count } = await finalCountQuery

    const { data: teams, error } = await searchQuery
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('팀 검색 오류:', error)
      throw new Error('팀 검색 중 오류가 발생했습니다')
    }

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      teams: (teams || []).map((team: any) => ({
        ...team,
        league_name_ko: getLeagueName(team.league_id)
      })),
      total: count || 0,
      hasMore: (count || 0) > offset + limit
    }

  } catch (error) {
    console.error('팀 검색 실패:', error)
    throw new Error('팀 검색에 실패했습니다')
  }
}

// 주요 팀 목록 (검색 전 표시용) - 각 리그의 대표팀들
export async function getPopularTeams(limit: number = 12): Promise<TeamSearchResult[]> {
  try {
    const supabase = await createClient()
    
    // 주요 리그의 대표팀들 ID (유명한 팀들)
    const majorTeamIds = [
      // 프리미어리그 (39)
      33,   // Manchester United
      40,   // Liverpool
      50,   // Manchester City
      42,   // Arsenal
      49,   // Chelsea
      47,   // Tottenham
      
      // 라리가 (140)  
      529,  // Barcelona
      541,  // Real Madrid
      530,  // Atletico Madrid
      
      // 분데스리가 (78)
      157,  // Bayern Munich
      165,  // Borussia Dortmund
      
      // 세리에A (135)
      489,  // AC Milan
      496,  // Juventus
      505,  // Inter Milan
      
      // 리그앙 (61)
      85,   // Paris Saint Germain
      
      // K리그1 (292)
      // 한국 팀들도 포함 가능
    ]
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: teams, error } = await (supabase as any)
      .from('football_teams')
      .select(`
        id,
        team_id,
        name,
        display_name,
        short_name,
        code,
        logo_url,
        league_id,
        league_name,
        country,
        venue_name,
        venue_city,
        current_position,
        is_winner,
        popularity_score
      `)
      .in('team_id', majorTeamIds)
      .eq('is_active', true)
      .limit(limit)

    if (error) {
      console.error('주요 팀 조회 오류:', error)
      // 에러 시 프리미어리그 상위팀들로 대체
      return await getFallbackTeams(limit)
    }

    // 한국어 리그명 추가
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const teamsWithKoreanLeague = (teams || []).map((team: any) => ({
      ...team,
      league_name_ko: getLeagueName(team.league_id)
    }))

    // 팀이 부족하면 추가로 가져오기
    if (teamsWithKoreanLeague.length < limit) {
      const additionalTeams = await getFallbackTeams(limit - teamsWithKoreanLeague.length)
      return [...teamsWithKoreanLeague, ...additionalTeams]
    }

    return teamsWithKoreanLeague

  } catch (error) {
    console.error('주요 팀 조회 실패:', error)
    return await getFallbackTeams(limit)
  }
}

// 대체 팀 목록 (프리미어리그 위주)
async function getFallbackTeams(limit: number): Promise<TeamSearchResult[]> {
  try {
    const supabase = await createClient()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: teams, error } = await (supabase as any)
      .from('football_teams')
      .select(`
        id,
        team_id,
        name,
        display_name,
        short_name,
        code,
        logo_url,
        league_id,
        league_name,
        country,
        venue_name,
        venue_city,
        current_position,
        is_winner,
        popularity_score
      `)
      .eq('league_id', 39) // 프리미어리그
      .eq('is_active', true)
      .order('name')
      .limit(limit)

    if (error) {
      return []
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (teams || []).map((team: any) => ({
      ...team,
      league_name_ko: getLeagueName(team.league_id)
    }))

  } catch {
    return []
  }
}

// 리그별 팀 수 통계
export async function getTeamCountByLeague(): Promise<Array<{
  league_id: number
  league_name: string
  team_count: number
}>> {
  try {
    const supabase = await createClient()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('football_teams')
      .select('league_id, league_name')
      .eq('is_active', true)

    if (error) {
      console.error('리그별 팀 수 조회 오류:', error)
      return []
    }

    // 리그별로 그룹화하여 카운트
    const leagueMap = new Map<number, { league_name: string, count: number }>()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?.forEach((team: any) => {
      const existing = leagueMap.get(team.league_id)
      if (existing) {
        existing.count++
      } else {
        leagueMap.set(team.league_id, {
          league_name: team.league_name,
          count: 1
        })
      }
    })

    return Array.from(leagueMap.entries())
      .map(([league_id, { league_name, count }]) => ({
        league_id,
        league_name,
        team_count: count
      }))
      .sort((a, b) => b.team_count - a.team_count)

  } catch (error) {
    console.error('리그별 팀 수 조회 실패:', error)
    return []
  }
} 