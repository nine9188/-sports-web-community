'use server'

import { createAdminClient } from '@/shared/api/supabaseServer'
import { LEAGUE_IDS } from '@/domains/search/constants/leagues'
import { revalidatePath } from 'next/cache'

const API_BASE_URL = 'https://v3.football.api-sports.io'
const API_KEY = process.env.FOOTBALL_API_KEY!

// ---------- Types ----------
interface ApiPlayer {
  player: {
    id: number
    name: string
    firstname: string
    lastname: string
    age: number | null
    birth?: { date?: string; place?: string; country?: string }
    nationality: string
    height?: string
    weight?: string
    injured: boolean
    photo: string
  }
  statistics: Array<{
    team: { id: number; name: string; logo: string }
    league: {
      id: number
      name: string
      country: string
      logo: string
      flag: string
      season: number
    }
    games: {
      appearences: number
      lineups: number
      minutes: number
      number: number | null
      position: string
      rating: string | null
      captain: boolean
    }
  }>
}

interface ApiSquadPlayer {
  id: number
  name: string
  age: number
  number: number | null
  position: string
  photo: string
}

interface ApiSquadResponse {
  response: Array<{
    team: { id: number; name: string; logo: string }
    players: ApiSquadPlayer[]
  }>
}

// ---------- Utils ----------
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * 중복 상세 분석
 * - total: 전체 레코드 수
 * - unique: 고유 player.id 수
 * - dupCount: 중복된 player.id 개수
 * - items: 각 중복 id별 { id, count, indices, entries[] }
 */
function analyzeDuplicates(players: ApiSquadPlayer[]) {
  const indexById = new Map<number, number[]>()
  const byId = new Map<number, ApiSquadPlayer[]>()

  players.forEach((p, idx) => {
    if (!indexById.has(p.id)) indexById.set(p.id, [])
    indexById.get(p.id)!.push(idx)

    if (!byId.has(p.id)) byId.set(p.id, [])
    byId.get(p.id)!.push(p)
  })

  const items = [...byId.entries()]
    .filter(([, arr]) => arr.length > 1)
    .map(([id, arr]) => ({
      id,
      count: arr.length,
      indices: indexById.get(id)!,
      entries: arr,
    }))

  return {
    total: players.length,
    unique: byId.size,
    dupCount: items.length,
    items,
  }
}

/**
 * 배치 내 중복 제거 (드롭 목록까지 반환)
 * - 우선순위: number 존재(2점) > position 존재(1점) > 그 외(0점)
 * - 반환: { cleaned, droppedById, keptById }
 */
function dedupePlayersWithDrops(players: ApiSquadPlayer[]) {
  const score = (p: ApiSquadPlayer) => (p.number != null ? 2 : 0) + (p.position ? 1 : 0)

  const keptById = new Map<number, ApiSquadPlayer>()
  const droppedById = new Map<number, ApiSquadPlayer[]>()
  const grouped = new Map<number, ApiSquadPlayer[]>()

  for (const p of players) {
    if (!grouped.has(p.id)) grouped.set(p.id, [])
    grouped.get(p.id)!.push(p)
  }

  for (const [id, arr] of grouped.entries()) {
    let best = arr[0]
    for (let i = 1; i < arr.length; i++) {
      const cand = arr[i]
      if (score(cand) > score(best)) best = cand
    }
    keptById.set(id, best)
    const drops = arr.filter((x) => x !== best)
    if (drops.length) droppedById.set(id, drops)
  }

  const cleaned = [...keptById.values()]
  return { cleaned, droppedById, keptById }
}

/**
 * 안전한 청크 업서트
 * - 대량 upsert 시 21000 등 충돌을 줄이기 위해 batch 수행
 */
async function chunkedUpsert<T extends Record<string, any>>(
  table: string,
  rows: T[],
  onConflict: string,
  chunkSize = 200
) {
  const supabase = createAdminClient()
  let saved = 0

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const { data, error } = await supabase
      .from(table)
      .upsert(chunk, { onConflict, ignoreDuplicates: false })
      .select()

    if (error) throw error
    saved += data?.length || 0
  }
  return saved
}

// ---------- 리그/팀 조회 ----------
export async function getLeagueCompetitions() {
  const supabase = createAdminClient()
  const leagueIds = Object.values(LEAGUE_IDS)

  const { data: teams, error } = await supabase
    .from('football_teams')
    .select(
      'league_id, league_name, league_name_ko, league_logo_url, team_id, name, name_ko, logo_url'
    )
    .in('league_id', leagueIds)
    .eq('is_active', true)
    .order('league_id', { ascending: true })
    .order('current_position', { ascending: true, nullsFirst: false })
    .order('name', { ascending: true })

  if (error) throw new Error(`리그 데이터 조회 실패: ${error.message}`)

  const leagueMap = new Map<
    number,
    {
      league_id: number
      league_name: string
      league_name_ko: string | null
      league_logo_url: string | null
      teams: Array<{ team_id: number; name: string; name_ko: string | null; logo_url: string | null }>
    }
  >()

  teams?.forEach((team) => {
    if (!leagueMap.has(team.league_id)) {
      leagueMap.set(team.league_id, {
        league_id: team.league_id,
        league_name: team.league_name,
        league_name_ko: team.league_name_ko,
        league_logo_url: team.league_logo_url,
        teams: [],
      })
    }
    leagueMap.get(team.league_id)!.teams.push({
      team_id: team.team_id,
      name: team.name,
      name_ko: team.name_ko,
      logo_url: team.logo_url,
    })
  })

  return Array.from(leagueMap.values())
}

export async function getLeaguePlayersStats(leagueId: number) {
  const supabase = createAdminClient()

  const { data: teams } = await supabase
    .from('football_teams')
    .select('team_id')
    .eq('league_id', leagueId)
    .eq('is_active', true)

  if (!teams || teams.length === 0) {
    return { totalPlayers: 0, teamsWithPlayers: 0, totalTeams: 0, lastSync: null }
  }

  const teamIds = teams.map((t) => t.team_id)
  const { data: players } = await supabase
    .from('football_players')
    .select('team_id, last_api_sync')
    .in('team_id', teamIds)
    .eq('is_active', true)

  if (!players || players.length === 0) {
    return { totalPlayers: 0, teamsWithPlayers: 0, totalTeams: teams.length, lastSync: null }
  }

  const teamsWithPlayersSet = new Set(players.map((p) => p.team_id))
  const lastSync =
    players
      .map((p) => p.last_api_sync)
      .filter(Boolean)
      .sort()
      .reverse()[0] || null

  return {
    totalPlayers: players.length,
    teamsWithPlayers: teamsWithPlayersSet.size,
    totalTeams: teams.length,
    lastSync,
  }
}

// ---------- API 호출 ----------
export async function fetchLeaguePlayers(leagueId: number, season: string = '2025') {
  try {
    const response = await fetch(`${API_BASE_URL}/players?league=${leagueId}&season=${season}`, {
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': API_KEY,
      },
      cache: 'no-store',
    })

    if (!response.ok) throw new Error(`API 응답 오류: ${response.status}`)

    const data = await response.json()
    if (!data.response || data.response.length === 0) return []

    const playersByTeam = new Map<number, ApiSquadPlayer[]>()
    data.response.forEach((item: ApiPlayer) => {
      const stats = item.statistics?.[0]
      if (!stats) return
      const teamId = stats.team.id
      const player: ApiSquadPlayer = {
        id: item.player.id,
        name: item.player.name,
        age: item.player.age || 0,
        number: stats.games.number,
        position: stats.games.position,
        photo: item.player.photo,
      }
      if (!playersByTeam.has(teamId)) playersByTeam.set(teamId, [])
      playersByTeam.get(teamId)!.push(player)
    })

    return playersByTeam
  } catch (error) {
    console.error(`리그 ${leagueId} 선수 명단 조회 실패:`, error)
    return new Map()
  }
}

export async function fetchTeamSquad(teamId: number, season: string = '2025') {
  try {
    const response = await fetch(`${API_BASE_URL}/players/squads?team=${teamId}`, {
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': API_KEY,
      },
      cache: 'no-store',
    })

    if (!response.ok) throw new Error(`API 응답 오류: ${response.status}`)

    const data: ApiSquadResponse = await response.json()
    if (!data.response || data.response.length === 0) return []

    return data.response[0].players || []
  } catch (error) {
    console.error(`팀 ${teamId} 선수 명단 조회 실패:`, error)
    return []
  }
}

// ---------- 저장 ----------
export async function savePlayersToDatabase(
  teamId: number,
  teamName: string,
  players: ApiSquadPlayer[]
) {
  const supabase = createAdminClient()

  if (players.length === 0) {
    return { success: false, message: '저장할 선수 데이터가 없습니다.', count: 0 }
  }

  // 1) 중복 상세 분석 + 풀 로그
  const dup = analyzeDuplicates(players)
  if (dup.dupCount > 0) {
    console.warn('[중복감지][배치 상세]', {
      teamId,
      teamName,
      total: dup.total,
      unique: dup.unique,
      duplicatedIdCount: dup.dupCount,
      duplicates: dup.items.map((d) => ({
        player_id: d.id,
        count: d.count,
        indices: d.indices,
        entries: d.entries.map((p) => ({
          id: p.id,
          name: p.name,
          number: p.number,
          position: p.position,
          age: p.age,
        })),
      })),
    })
  }

  // 2) 중복 제거 (유지/제거 모두 로그로 남김)
  const { cleaned, droppedById, keptById } = dedupePlayersWithDrops(players)
  if (droppedById.size > 0) {
    console.warn('[중복정리][유지/제거 결과]', {
      teamId,
      teamName,
      kept: [...keptById.entries()].map(([id, p]) => ({
        player_id: id,
        keep: { number: p.number, position: p.position, name: p.name, age: p.age },
      })),
      dropped: [...droppedById.entries()].map(([id, arr]) => ({
        player_id: id,
        droppedCount: arr.length,
        droppedEntries: arr.map((p) => ({
          number: p.number,
          position: p.position,
          name: p.name,
          age: p.age,
        })),
      })),
    })
  }

  // 3) DB 행 변환
  const playersData = cleaned.map((player) => ({
    player_id: player.id,
    name: player.name,
    display_name: player.name,
    team_id: teamId,
    team_name: teamName,
    position: player.position || null,
    number: player.number || null,
    age: player.age || null,
    photo_url: player.photo || null,
    search_keywords: [player.name, teamName, player.position].filter(Boolean),
    is_active: true,
    last_api_sync: new Date().toISOString(),
    api_data: { raw: player, lastSync: new Date().toISOString() },
  }))

  // 4) 안전 업서트 (청크) + 21000 폴백(행 단위)
  const ON_CONFLICT = 'player_id' // 스키마가 UNIQUE(player_id, team_id)라면 'player_id,team_id'로 교체

  try {
    const saved = await chunkedUpsert('football_players', playersData, ON_CONFLICT, 200)
    return { success: true, message: `${saved}명의 선수 데이터가 저장되었습니다.`, count: saved }
  } catch (error: any) {
    console.error('선수 데이터 저장 실패(청크 업서트 단계):', error)

    if (error?.code === '21000') {
      console.warn('[폴백] 행 단위 upsert 시도', {
        teamId,
        teamName,
        rows: playersData.length,
      })
      let saved = 0
      for (const row of playersData) {
        const { data, error: rowErr } = await supabase
          .from('football_players')
          .upsert(row, { onConflict: ON_CONFLICT, ignoreDuplicates: false })
          .select()

        if (rowErr) {
          console.error('[폴백 실패] 개별 행 upsert 실패', {
            player_id: row.player_id,
            error: rowErr,
          })
          continue
        }
        saved += data?.length || 0
      }
      if (saved > 0) {
        return {
          success: true,
          message: `${saved}명의 선수 데이터가 저장되었습니다. (폴백 경로)`,
          count: saved,
        }
      }
    }

    return {
      success: false,
      message: `저장 실패: ${error?.message ?? '알 수 없는 오류'}`,
      count: 0,
    }
  }
}

// ---------- 조회 ----------
export async function getTeamPlayers(teamId: number) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('football_players')
    .select('*')
    .eq('team_id', teamId)
    .eq('is_active', true)
    .order('position', { ascending: true })
    .order('number', { ascending: true, nullsFirst: false })

  if (error) throw new Error(`선수 데이터 조회 실패: ${error.message}`)
  return data || []
}

// ---------- 동기화 ----------
export async function syncTeamPlayers(teamId: number, teamName: string) {
  try {
    const players = await fetchTeamSquad(teamId)
    if (players.length === 0) {
      return { success: false, message: 'API에서 선수 데이터를 가져오지 못했습니다.', count: 0 }
    }

    const result = await savePlayersToDatabase(teamId, teamName, players)
    revalidatePath('/test/players')
    return result
  } catch (error) {
    console.error('선수 동기화 실패:', error)
    return {
      success: false,
      message: `동기화 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      count: 0,
    }
  }
}

export async function syncLeaguePlayers(leagueId: number, leagueName: string) {
  try {
    const supabase = createAdminClient()
    console.log(`📡 ${leagueName} 선수 조회 시작...`)

    const { data: teams } = await supabase
      .from('football_teams')
      .select('team_id, name')
      .eq('league_id', leagueId)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (!teams || teams.length === 0) {
      return { success: false, message: '팀 정보를 찾을 수 없습니다.', count: 0, errors: [] }
    }

    let totalSaved = 0
    const errors: string[] = []
    const teamResults: Array<{ teamName: string; count: number }> = []

    for (const team of teams) {
      try {
        const players = await fetchTeamSquad(team.team_id)
        if (!players || players.length === 0) {
          console.log(`⚠️ ${team.name}: 선수 데이터 없음`)
          errors.push(`${team.name}: 선수 데이터 없음`)
          continue
        }

        const result = await savePlayersToDatabase(team.team_id, team.name, players)

        if (result.success) {
          totalSaved += result.count
          teamResults.push({ teamName: team.name, count: result.count })
          console.log(`✅ ${team.name}: ${result.count}명`)
        } else {
          errors.push(`${team.name}: ${result.message}`)
          console.log(`❌ ${team.name}: ${result.message}`)
        }

        await sleep(350) // API rate 보호
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '알 수 없는 오류'
        errors.push(`${team.name}: ${errorMsg}`)
        console.error(`❌ ${team.name} 실패:`, error)
      }
    }

    revalidatePath('/test/players')

    return {
      success: totalSaved > 0,
      message:
        totalSaved > 0
          ? `${leagueName}: ${totalSaved}명 선수 저장 완료 (${teamResults.length}/${teams.length} 팀)`
          : `${leagueName}: 선수 데이터를 가져오지 못했습니다.`,
      count: totalSaved,
      errors,
      teamResults,
    }
  } catch (error) {
    console.error(`${leagueName} 동기화 실패:`, error)
    return {
      success: false,
      message: `동기화 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      count: 0,
      errors: [],
    }
  }
}

export async function syncAllLeaguePlayers() {
  try {
    const leagues = await getLeagueCompetitions()

    let totalPlayers = 0
    let successLeagues = 0
    let failedLeagues = 0
    const errors: string[] = []

    for (const league of leagues) {
      try {
        const result = await syncLeaguePlayers(league.league_id, league.league_name)

        if (result.success) {
          totalPlayers += result.count
          successLeagues++
          console.log(`✅ ${league.league_name}: ${result.count}명`)
        } else {
          failedLeagues++
          errors.push(`${league.league_name}: ${result.message}`)
        }

        await sleep(1000) // 리그 간 간격
      } catch (error) {
        failedLeagues++
        const errorMsg = error instanceof Error ? error.message : '알 수 없는 오류'
        errors.push(`${league.league_name}: ${errorMsg}`)
        console.error(`❌ ${league.league_name} 실패:`, error)
      }
    }

    revalidatePath('/test/players')

    return {
      success: true,
      message: `총 ${successLeagues}개 리그, ${totalPlayers}명 선수 동기화 완료 (실패: ${failedLeagues}개)`,
      totalPlayers,
      successLeagues,
      failedLeagues,
      errors,
    }
  } catch (error) {
    console.error('전체 동기화 실패:', error)
    return {
      success: false,
      message: `전체 동기화 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      totalPlayers: 0,
      successLeagues: 0,
      failedLeagues: 0,
      errors: [],
    }
  }
}
