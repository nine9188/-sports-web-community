'use server'

import { createClient } from '@/shared/api/supabaseServer'
import { getLeagueName } from '@/domains/livescore/constants/league-mappings'
import { getTeamById, searchTeamsByName } from '@/domains/livescore/constants/teams'
import type { TeamSearchResult } from '../types'

// 허용 리그 ID: 주요 유럽 리그, 유럽 2군 리그, 유럽컵 대회, FA/EFL컵, 아시아, 아메리카, 기타
const ALLOWED_LEAGUE_IDS = [
  // 주요 유럽 리그 (Top 5)
  39, 140, 78, 61, 135,
  // 유럽 2군 리그
  40, 179, 88, 94,
  // 유럽 컵 대회
  2, 3, 848, 531,
  // FA, EFL 컵
  45, 48,
  // 아시아
  292, 98, 169, 17, 307,
  // 아메리카
  253, 71, 262,
  // 기타
  119,
]

export interface TeamSearchOptions {
  query: string
  leagueId?: number
  country?: string
  limit?: number
  offset?: number
}

export async function searchTeams(options: TeamSearchOptions): Promise<{
  teams: TeamSearchResult[]
  totalCount: number
  hasMore: boolean
}> {
  const { query, leagueId, country, limit = 20, offset = 0 } = options
  
  if (!query.trim()) {
    return { teams: [], totalCount: 0, hasMore: false }
  }

  try {
    const supabase = await createClient()
    
    // 한국어 팀명 매핑을 통한 검색 개선
    const searchTerm = query.trim().toLowerCase()
    
    // 1. 한국어 매핑에서 검색하여 해당하는 팀 ID들 찾기
    const mappedTeams = searchTeamsByName(query)
    const mappedTeamIds = mappedTeams.map(team => team.id)
    
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
      .in('league_id', ALLOWED_LEAGUE_IDS)

    // 검색 조건: 기존 텍스트 검색 + 한국어 매핑 팀 ID 검색
    if (mappedTeamIds.length > 0) {
      // 한국어 매핑에서 찾은 팀들과 기존 텍스트 검색 결합
      searchQuery = searchQuery.or(`team_id.in.(${mappedTeamIds.join(',')}),name.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%,short_name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%,venue_city.ilike.%${searchTerm}%`)
    } else {
      // 한국어 매핑에서 찾지 못한 경우 기존 텍스트 검색만
      searchQuery = searchQuery.or(`name.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%,short_name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%,venue_city.ilike.%${searchTerm}%`)
    }

    // 필터 조건 추가
    if (leagueId) {
      searchQuery = searchQuery.eq('league_id', leagueId)
    }

    if (country) {
      searchQuery = searchQuery.eq('country', country)
    }

    // 정렬: 한국어 매핑 우선 > 인기도 > 현재 순위 > 이름순
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
      .in('league_id', ALLOWED_LEAGUE_IDS)

    // 검색 조건 동일하게 적용
    let finalCountQuery
    if (mappedTeamIds.length > 0) {
      finalCountQuery = countQuery.or(`team_id.in.(${mappedTeamIds.join(',')}),name.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%,short_name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%,venue_city.ilike.%${searchTerm}%`)
    } else {
      finalCountQuery = countQuery.or(`name.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%,short_name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%,venue_city.ilike.%${searchTerm}%`)
    }
    
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
      teams: (teams || []).map((team: any) => {
        // 한국어 매핑 정보 추가
        const mappedTeam = getTeamById(team.team_id)
        
        return {
          ...team,
          league_name_ko: getLeagueName(team.league_id),
          // 한국어 팀명이 있으면 display_name을 한국어로 대체
          display_name: mappedTeam?.name_ko || team.display_name,
          // 한국어 매핑 정보 추가
          name_ko: mappedTeam?.name_ko,
          name_en: mappedTeam?.name_en || team.name,
          country_ko: mappedTeam?.country_ko,
          // 한국어 매핑에서 찾은 팀인지 표시 (정렬 우선순위용)
          is_korean_mapped: !!mappedTeam
        }
      })
      // 한국어 매핑된 팀을 우선 정렬
      .sort((a: TeamSearchResult, b: TeamSearchResult) => {
        if (a.is_korean_mapped && !b.is_korean_mapped) return -1
        if (!a.is_korean_mapped && b.is_korean_mapped) return 1
        return 0
      }),
      totalCount: count || 0,
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

    // 한국어 리그명 및 팀명 추가
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const teamsWithKoreanMapping = (teams || []).map((team: any) => {
      const mappedTeam = getTeamById(team.team_id)
      
      return {
        ...team,
        league_name_ko: getLeagueName(team.league_id),
        display_name: mappedTeam?.name_ko || team.display_name,
        name_ko: mappedTeam?.name_ko,
        name_en: mappedTeam?.name_en || team.name,
        country_ko: mappedTeam?.country_ko
      }
    })

    // 팀이 부족하면 추가로 가져오기
    if (teamsWithKoreanMapping.length < limit) {
      const additionalTeams = await getFallbackTeams(limit - teamsWithKoreanMapping.length)
      return [...teamsWithKoreanMapping, ...additionalTeams]
    }

    return teamsWithKoreanMapping

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
    return (teams || []).map((team: any) => {
      const mappedTeam = getTeamById(team.team_id)
      
      return {
        ...team,
        league_name_ko: getLeagueName(team.league_id),
        display_name: mappedTeam?.name_ko || team.display_name,
        name_ko: mappedTeam?.name_ko,
        name_en: mappedTeam?.name_en || team.name
      }
    })

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