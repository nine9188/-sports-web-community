'use server'

import { getSupabaseServer } from '@/shared/lib/supabase/server'
import { getPlayerKoreanName } from '@/domains/livescore/constants/players'
import { getTeamById } from '@/domains/livescore/constants/teams'

export interface PlayerSearchResult {
  id: string
  player_id: number
  name: string
  display_name: string
  korean_name?: string
  team_id: number
  team_name: string
  team_name_ko?: string
  team_logo_url?: string
  position: string | null
  number: number | null
  age: number | null
  photo_url: string | null
}

export interface PlayerSearchOptions {
  query: string
  teamId?: number
  position?: string
  limit?: number
  offset?: number
}

export async function searchPlayers(options: PlayerSearchOptions): Promise<{
  players: PlayerSearchResult[]
  totalCount: number
  hasMore: boolean
}> {
  const { query, teamId, position, limit = 20, offset = 0 } = options

  if (!query.trim() || query.trim().length < 2) {
    return { players: [], totalCount: 0, hasMore: false }
  }

  try {
    const supabase = await getSupabaseServer()
    const searchTerm = query.trim().toLowerCase()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let searchQuery = (supabase as any)
      .from('football_players')
      .select(`
        id,
        player_id,
        name,
        display_name,
        team_id,
        team_name,
        position,
        number,
        age,
        photo_url
      `)
      .eq('is_active', true)
      .or(`name.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%,team_name.ilike.%${searchTerm}%`)

    // 필터 조건 추가
    if (teamId) {
      searchQuery = searchQuery.eq('team_id', teamId)
    }

    if (position) {
      searchQuery = searchQuery.eq('position', position)
    }

    // 정렬
    searchQuery = searchQuery
      .order('name', { ascending: true })

    // 카운트 쿼리 분리
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let countQuery = (supabase as any)
      .from('football_players')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .or(`name.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%,team_name.ilike.%${searchTerm}%`)

    if (teamId) {
      countQuery = countQuery.eq('team_id', teamId)
    }
    if (position) {
      countQuery = countQuery.eq('position', position)
    }

    const { count } = await countQuery

    const { data: players, error } = await searchQuery
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('선수 검색 오류:', error)
      throw new Error('선수 검색 중 오류가 발생했습니다')
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const playersWithKorean = (players || []).map((player: any) => {
      // 한국어 이름 매핑
      const koreanName = getPlayerKoreanName(player.player_id)
      // 팀 한국어 이름 매핑
      const teamMapping = getTeamById(player.team_id)

      return {
        ...player,
        korean_name: koreanName,
        display_name: koreanName || player.display_name,
        team_name_ko: teamMapping?.name_ko,
        team_logo_url: player.team_logo_url || `https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public/teams/${player.team_id}.png`
      }
    })

    // 한국어 이름이 있는 선수 우선 정렬
    const sortedPlayers = playersWithKorean.sort((a: PlayerSearchResult, b: PlayerSearchResult) => {
      // 검색어와 정확히 일치하는 경우 우선
      const aExact = (a.korean_name?.toLowerCase() === searchTerm) || (a.name?.toLowerCase() === searchTerm)
      const bExact = (b.korean_name?.toLowerCase() === searchTerm) || (b.name?.toLowerCase() === searchTerm)
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1

      // 한국어 이름이 있는 경우 우선
      if (a.korean_name && !b.korean_name) return -1
      if (!a.korean_name && b.korean_name) return 1

      return 0
    })

    return {
      players: sortedPlayers,
      totalCount: count || 0,
      hasMore: (count || 0) > offset + limit
    }

  } catch (error) {
    console.error('선수 검색 실패:', error)
    throw new Error('선수 검색에 실패했습니다')
  }
}

// 인기 선수 목록 (검색 전 표시용)
export async function getPopularPlayers(limit: number = 12): Promise<PlayerSearchResult[]> {
  try {
    const supabase = await getSupabaseServer()

    // 유명 선수 ID들
    const famousPlayerIds = [
      // 프리미어리그
      306, // 손흥민
      874, // 홀란드
      1100, // 살라

      // 라리가
      154, // 벨링엄

      // 분데스리가
      1485, // 김민재

      // 리그앙
      278, // 음바페

      // 세리에A

      // K리그
    ]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: players, error } = await (supabase as any)
      .from('football_players')
      .select(`
        id,
        player_id,
        name,
        display_name,
        team_id,
        team_name,
        position,
        number,
        age,
        photo_url
      `)
      .in('player_id', famousPlayerIds)
      .eq('is_active', true)
      .limit(limit)

    if (error) {
      console.error('인기 선수 조회 오류:', error)
      return []
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (players || []).map((player: any) => {
      const koreanName = getPlayerKoreanName(player.player_id)
      const teamMapping = getTeamById(player.team_id)

      return {
        ...player,
        korean_name: koreanName,
        display_name: koreanName || player.display_name,
        team_name_ko: teamMapping?.name_ko,
        team_logo_url: `https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public/teams/${player.team_id}.png`
      }
    })

  } catch (error) {
    console.error('인기 선수 조회 실패:', error)
    return []
  }
}
