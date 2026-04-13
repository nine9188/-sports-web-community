'use server'

import { getSupabaseAdmin } from '@/shared/lib/supabase/server'

const API_BASE_URL = 'https://v3.football.api-sports.io'
const API_KEY = process.env.FOOTBALL_API_KEY!

// 동기화 대상 리그 (선수 데이터를 관리할 12개 리그)
const SYNC_LEAGUE_IDS = [
  // 유럽 Top 5
  39,  // 프리미어리그
  140, // 라리가
  78,  // 분데스리가
  135, // 세리에A
  61,  // 리그앙
  // 유럽 기타
  88,  // 에레디비지에
  94,  // 프리메이라 리가
  119, // 덴마크 수페르리가
  // 아시아
  292, // K리그1
  98,  // J1 리그
  307, // 사우디 프로리그
  // 아메리카
  253, // MLS
]

interface ApiSquadPlayer {
  id: number
  name: string
  age: number | null
  number: number | null
  position: string  // 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Attacker'
  photo: string
}

interface ApiSquadResponse {
  team: {
    id: number
    name: string
    logo: string
  }
  players: ApiSquadPlayer[]
}

/**
 * 특정 팀의 스쿼드를 API에서 가져오기
 */
async function fetchSquadFromApi(teamId: number): Promise<ApiSquadPlayer[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/players/squads?team=${teamId}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': API_KEY,
        },
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      throw new Error(`API 응답 오류: ${response.status}`)
    }

    const data = await response.json()
    const squad: ApiSquadResponse = data.response?.[0]

    if (!squad?.players) {
      return []
    }

    return squad.players
  } catch (error) {
    console.error(`팀 ${teamId} 스쿼드 조회 실패:`, error)
    return []
  }
}

/**
 * 선수 데이터를 DB에 upsert (기존 korean_name 보존)
 */
async function upsertPlayer(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  player: ApiSquadPlayer,
  teamId: number,
  teamName: string,
  syncTimestamp: string
) {
  // 먼저 기존 데이터 조회 (korean_name, popularity_score 보존용)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('football_players')
    .select('korean_name, popularity_score, nationality, nationality_ko')
    .eq('player_id', player.id)
    .single()

  const playerData = {
    player_id: player.id,
    name: player.name,
    display_name: player.name,
    age: player.age,
    number: player.number,
    position: player.position,
    photo_url: player.photo,
    team_id: teamId,
    team_name: teamName,
    is_active: true,
    last_api_sync: syncTimestamp,
    updated_at: syncTimestamp,
    search_keywords: [player.name, player.position].filter(Boolean),
    // 기존 값 보존
    ...(existing?.korean_name ? { korean_name: existing.korean_name } : {}),
    ...(existing?.popularity_score ? { popularity_score: existing.popularity_score } : {}),
    ...(existing?.nationality ? { nationality: existing.nationality } : {}),
    ...(existing?.nationality_ko ? { nationality_ko: existing.nationality_ko } : {}),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('football_players')
    .upsert(playerData, {
      onConflict: 'player_id',
      ignoreDuplicates: false,
    })

  if (error) {
    console.error(`선수 ${player.name}(${player.id}) 저장 실패:`, error)
    throw error
  }
}

/**
 * 전체 선수 동기화 실행
 * 12개 리그의 모든 팀 스쿼드를 API에서 가져와 DB에 반영
 */
export async function syncAllFootballPlayersFromApi(): Promise<{
  success: boolean
  totalTeams: number
  totalPlayers: number
  newPlayers: number
  updatedPlayers: number
  deactivatedCount: number
  errors: string[]
  summary: string
  leagueDetails: Array<{
    leagueId: number
    leagueName: string
    teams: number
    players: number
  }>
}> {
  const supabase = getSupabaseAdmin()
  const syncTimestamp = new Date().toISOString()

  const errors: string[] = []
  let totalTeams = 0
  let totalPlayers = 0
  let newPlayers = 0
  let updatedPlayers = 0
  const leagueDetails: Array<{
    leagueId: number
    leagueName: string
    teams: number
    players: number
  }> = []

  // 동기화 전 기존 player_id 목록 (신규 vs 업데이트 구분용)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingPlayers } = await (supabase as any)
    .from('football_players')
    .select('player_id')
    .eq('is_active', true)

  const existingPlayerIds = new Set(
    (existingPlayers || []).map((p: { player_id: number }) => p.player_id)
  )

  try {
    // 리그별로 팀 목록 조회 후 각 팀의 스쿼드 동기화
    for (const leagueId of SYNC_LEAGUE_IDS) {
      try {
        // DB에서 해당 리그의 팀 목록 가져오기
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: teams, error: teamsError } = await (supabase as any)
          .from('football_teams')
          .select('team_id, name, league_name')
          .eq('league_id', leagueId)
          .eq('is_active', true)

        if (teamsError || !teams?.length) {
          errors.push(`리그 ${leagueId}: 팀 목록 조회 실패`)
          continue
        }

        let leaguePlayers = 0
        const leagueName = teams[0].league_name || `리그 ${leagueId}`

        // 각 팀별 스쿼드 동기화
        for (const team of teams) {
          try {
            const squad = await fetchSquadFromApi(team.team_id)

            if (squad.length === 0) {
              errors.push(`팀 ${team.name}(${team.team_id}): 스쿼드 데이터 없음`)
              continue
            }

            // 각 선수 upsert
            for (const player of squad) {
              try {
                await upsertPlayer(
                  supabase,
                  player,
                  team.team_id,
                  team.name,
                  syncTimestamp
                )

                if (existingPlayerIds.has(player.id)) {
                  updatedPlayers++
                } else {
                  newPlayers++
                }

                leaguePlayers++
                totalPlayers++
              } catch {
                // 개별 선수 실패는 로그만 남기고 계속 진행
              }
            }

            totalTeams++

            // API rate limit 대응 (100ms 딜레이)
            await new Promise(resolve => setTimeout(resolve, 100))
          } catch (error) {
            const msg = error instanceof Error ? error.message : '알 수 없는 오류'
            errors.push(`팀 ${team.name}(${team.team_id}): ${msg}`)
          }
        }

        leagueDetails.push({
          leagueId,
          leagueName,
          teams: teams.length,
          players: leaguePlayers,
        })

        console.log(`✅ ${leagueName}: ${teams.length}팀 ${leaguePlayers}명 동기화 완료`)
      } catch (error) {
        const msg = error instanceof Error ? error.message : '알 수 없는 오류'
        errors.push(`리그 ${leagueId}: ${msg}`)
      }
    }

    // 이번 동기화에서 업데이트 안 된 선수 비활성화
    // (방출/이적 등으로 어떤 팀 스쿼드에도 없는 선수)
    // 단, 동기화 대상 리그 소속 선수만 비활성화 (다른 리그 선수는 건드리지 않음)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: teamsInSyncLeagues } = await (supabase as any)
      .from('football_teams')
      .select('team_id')
      .in('league_id', SYNC_LEAGUE_IDS)
      .eq('is_active', true)

    const syncTeamIds = (teamsInSyncLeagues || []).map(
      (t: { team_id: number }) => t.team_id
    )

    let deactivatedCount = 0

    if (syncTeamIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: deactivated, error: deactivateError } = await (supabase as any)
        .from('football_players')
        .update({ is_active: false, updated_at: syncTimestamp })
        .in('team_id', syncTeamIds)
        .eq('is_active', true)
        .lt('last_api_sync', syncTimestamp)
        .select('player_id')

      if (deactivateError) {
        errors.push(`비활성화 처리 실패: ${deactivateError.message}`)
      }

      deactivatedCount = deactivated?.length || 0
      console.log(`🔄 ${deactivatedCount}명 비활성화 (스쿼드에서 제외된 선수)`)
    }

    const summary = [
      `동기화 완료: ${SYNC_LEAGUE_IDS.length}개 리그, ${totalTeams}팀, ${totalPlayers}명`,
      `신규: ${newPlayers}명, 업데이트: ${updatedPlayers}명, 비활성화: ${deactivatedCount}명`,
      errors.length > 0 ? `오류: ${errors.length}건` : '',
    ]
      .filter(Boolean)
      .join(' | ')

    return {
      success: true,
      totalTeams,
      totalPlayers,
      newPlayers,
      updatedPlayers,
      deactivatedCount,
      errors,
      summary,
      leagueDetails,
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류'
    return {
      success: false,
      totalTeams,
      totalPlayers,
      newPlayers,
      updatedPlayers,
      deactivatedCount: 0,
      errors: [...errors, `전체 동기화 실패: ${msg}`],
      summary: `동기화 실패: ${msg}`,
      leagueDetails,
    }
  }
}
