'use server'

import { getSupabaseAdmin } from '@/shared/lib/supabase/server'
import { getLeagueName } from '@/domains/livescore/constants/league-mappings'
import { CUP_LEAGUE_IDS, LEAGUE_IDS } from '@/domains/search/constants/leagues'

const API_BASE_URL = 'https://v3.football.api-sports.io'
const API_KEY = process.env.FOOTBALL_API_KEY!

// API에서 받아오는 실제 데이터 구조 그대로 사용
interface ApiTeam {
  team: {
    id: number
    name: string
    code?: string
    country: string
    founded?: number
    national: boolean
    logo: string
  }
  venue: {
    id?: number
    name?: string
    address?: string
    city?: string
    capacity?: number
    surface?: string
    image?: string
  }
}

interface ApiStanding {
  rank: number
  team: {
    id: number
    name: string
    logo: string
  }
  points: number
  goalsDiff: number
  group?: string
  form?: string
  status?: string
  description?: string
  all: {
    played: number
    win: number
    draw: number
    lose: number
    goals: {
      for: number
      against: number
    }
  }
  home: {
    played: number
    win: number
    draw: number
    lose: number
    goals: {
      for: number
      against: number
    }
  }
  away: {
    played: number
    win: number
    draw: number
    lose: number
    goals: {
      for: number
      against: number
    }
  }
  update: string
}

// Supabase 클라이언트 타입
type SupabaseClient = Awaited<ReturnType<typeof createAdminClient>>

// 실제 API에서 리그 데이터 가져오기 (2025/26 시즌)
async function fetchRawLeagueData(leagueId: number) {
  try {
    // 2025/26 시즌 = 2025
    const season = '2025'

    const [teamsResponse, standingsResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/teams?league=${leagueId}&season=${season}`, {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': API_KEY,
        },
        cache: 'no-store'
      }),
      fetch(`${API_BASE_URL}/standings?league=${leagueId}&season=${season}`, {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': API_KEY,
        },
        cache: 'no-store'
      })
    ])

    const teamsData = teamsResponse.ok ? await teamsResponse.json() : null
    const standingsData = standingsResponse.ok ? await standingsResponse.json() : null

    return {
      leagueId,
      season,
      teamsApiResponse: teamsData,
      standingsApiResponse: standingsData,
      teamsStatus: teamsResponse.status,
      standingsStatus: standingsResponse.status,
      teams: teamsData?.response || [],
      standings: standingsData?.response?.[0]?.league?.standings?.[0] || []
    }
  } catch (error) {
    return {
      leagueId,
      season: '2025',
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      teams: [],
      standings: []
    }
  }
}

// API 데이터를 그대로 DB에 저장
async function saveTeamToDatabase(
  supabase: SupabaseClient,
  team: ApiTeam,
  leagueId: number,
  season: string,
  standing?: ApiStanding
) {
  const leagueName = getLeagueName(leagueId)
  
  const teamData = {
    team_id: team.team.id,
    name: team.team.name, // API 데이터 그대로
    display_name: team.team.name, // API 데이터 그대로
    short_name: team.team.code || null,
    code: team.team.code || null,
    logo_url: team.team.logo,
    league_id: leagueId,
    league_name: leagueName,
    country: team.team.country,
    founded: team.team.founded || null,
    venue_id: team.venue.id || null,
    venue_name: team.venue.name || null,
    venue_city: team.venue.city || null,
    venue_capacity: team.venue.capacity || null,
    venue_address: team.venue.address || null,
    venue_surface: team.venue.surface || null,
    current_season: parseInt(season),
    current_position: standing?.rank || null,
    is_winner: standing?.rank === 1 || false,
    search_keywords: [team.team.name, team.team.code, team.venue.city].filter(Boolean),
    is_active: true,
    popularity_score: 0,
    last_api_sync: new Date().toISOString(),
    api_data: {
      team: team.team,
      venue: team.venue,
      standing: standing || null,
      lastSync: new Date().toISOString()
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('football_teams')
    .upsert(teamData, { 
      onConflict: 'team_id',
      ignoreDuplicates: false 
    })

  if (error) {
    console.error(`팀 ${team.team.name} 저장 실패:`, error)
    throw error
  }
}

// 모든 리그의 팀 데이터를 API에서 받아와서 DB에 저장
export async function syncAllFootballTeamsFromApi(): Promise<{
  success: boolean
  totalLeagues: number
  successfulLeagues: number
  totalTeams: number
  errors: string[]
  summary: string
}> {
  const supabase = getSupabaseAdmin() // 관리자 클라이언트 사용 (RLS 우회)

  // 컵 대회를 먼저, 리그를 나중에 동기화 (리그 데이터가 우선)
  const allLeagueIds = [...CUP_LEAGUE_IDS, ...LEAGUE_IDS]

  const errors: string[] = []
  let totalTeams = 0
  let successfulLeagues = 0

  try {
    // 기존 데이터 삭제
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any)
      .from('football_teams')
      .delete()
      .neq('id', 0)

    if (deleteError) {
      throw new Error(`기존 데이터 삭제 실패: ${deleteError.message}`)
    }

    // 각 리그별로 데이터 가져오기 및 저장 (테스트 페이지와 동일한 로직)
    for (const leagueId of allLeagueIds) {
      try {
        const rawData = await fetchRawLeagueData(leagueId)
        
        if (rawData.error) {
          errors.push(`리그 ${leagueId}: ${rawData.error}`)
          continue
        }

        if (rawData.teams.length === 0) {
          errors.push(`리그 ${leagueId}: 팀 데이터 없음`)
          continue
        }

        // 순위 정보를 팀 ID로 매핑
        const standingsMap = new Map<number, ApiStanding>()
        rawData.standings.forEach((standing: ApiStanding) => {
          standingsMap.set(standing.team.id, standing)
        })

        // 각 팀 저장
        for (const team of rawData.teams) {
          const standing = standingsMap.get(team.team.id)
          await saveTeamToDatabase(supabase, team, leagueId, rawData.season || '2025', standing)
        }

        totalTeams += rawData.teams.length
        successfulLeagues++
        
        // API 요청 제한을 위한 딜레이
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '알 수 없는 오류'
        errors.push(`리그 ${leagueId}: ${errorMsg}`)
        console.error(`❌ 리그 ${leagueId} 처리 실패:`, error)
      }
    }

    // 검색 벡터 업데이트 (타입 에러 방지를 위해 주석 처리)
    // const { error: vectorError } = await supabase
    //   .from('football_teams')
    //   .update({
    //     search_vector: supabase.raw(`to_tsvector('simple', name || ' ' || COALESCE(venue_city, '') || ' ' || COALESCE(code, ''))`)
    //   })
    //   .neq('id', 0)

    // if (vectorError) {
    //   console.warn('검색 벡터 업데이트 실패:', vectorError)
    // }

    const summary = `총 ${allLeagueIds.length}개 리그 중 ${successfulLeagues}개 성공, ${totalTeams}개 팀 저장 완료`

    return {
      success: successfulLeagues > 0,
      totalLeagues: allLeagueIds.length,
      successfulLeagues,
      totalTeams,
      errors,
      summary
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '알 수 없는 오류'
    console.error('❌ 팀 데이터 동기화 실패:', error)
    
    return {
      success: false,
      totalLeagues: allLeagueIds.length,
      successfulLeagues,
      totalTeams,
      errors: [...errors, `전체 동기화 실패: ${errorMsg}`],
      summary: `동기화 실패: ${errorMsg}`
    }
  }
}

// 저장된 팀 데이터 조회
export async function getFootballTeams(options?: {
  leagueId?: number
  country?: string
  search?: string
  limit?: number
  offset?: number
}) {
  const supabase = getSupabaseAdmin()
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('football_teams')
    .select('*')
    .eq('is_active', true)
    .order('league_id')
    .order('name')

  if (options?.leagueId) {
    query = query.eq('league_id', options.leagueId)
  }

  if (options?.country) {
    query = query.eq('country', options.country)
  }

  if (options?.search) {
    query = query.or(`name.ilike.%${options.search}%,venue_city.ilike.%${options.search}%`)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, (options.offset + (options.limit || 50)) - 1)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`팀 데이터 조회 실패: ${error.message}`)
  }

  return data || []
} 