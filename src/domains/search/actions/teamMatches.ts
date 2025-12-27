'use server'

// footballApi.ts의 함수 import
import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi'

// 팀 매치 정보 타입 정의
export interface TeamMatch {
  fixture: {
    id: number
    referee: string | null
    timezone: string
    date: string
    timestamp: number
    periods: {
      first: number | null
      second: number | null
    }
    venue: {
      id: number | null
      name: string | null
      city: string | null
    }
    status: {
      long: string
      short: string
      elapsed: number | null
    }
  }
  league: {
    id: number
    name: string
    country: string
    logo: string
    flag: string
    season: number
    round: string
  }
  teams: {
    home: {
      id: number
      name: string
      logo: string
      winner: boolean | null
    }
    away: {
      id: number
      name: string
      logo: string
      winner: boolean | null
    }
  }
  goals: {
    home: number | null
    away: number | null
  }
  score: {
    halftime: {
      home: number | null
      away: number | null
    }
    fulltime: {
      home: number | null
      away: number | null
    }
    extratime: {
      home: number | null
      away: number | null
    }
    penalty: {
      home: number | null
      away: number | null
    }
  }
}

// 팀의 최근/예정 경기 가져오기
export async function getTeamMatches(teamId: number, limit: number = 10): Promise<{
  success: boolean
  data: TeamMatch[]
  error?: string
}> {
  try {
    // footballApi.ts의 fetchFromFootballApi 함수 사용
    const currentSeason = new Date().getFullYear()
    
    // 최근 경기와 예정 경기를 각각 가져오기
    const [lastMatches, nextMatches] = await Promise.all([
      fetchFromFootballApi('fixtures', {
        team: teamId,
        season: currentSeason,
        last: Math.floor(limit / 2)
      }).catch(error => {
        console.warn(`[getTeamMatches] 최근 경기 조회 실패:`, error)
        return { response: [] }
      }),
      fetchFromFootballApi('fixtures', {
        team: teamId,
        season: currentSeason,
        next: Math.ceil(limit / 2)
      }).catch(error => {
        console.warn(`[getTeamMatches] 예정 경기 조회 실패:`, error)
        return { response: [] }
      })
    ])

    // 두 결과를 합치기
    const allMatches = [
      ...(lastMatches.response || []),
      ...(nextMatches.response || [])
    ]

    // 날짜순으로 정렬 (최신순)
    const sortedMatches = allMatches.sort((a: TeamMatch, b: TeamMatch) => {
      return new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime()
    })

    return {
      success: true,
      data: sortedMatches.slice(0, limit)
    }

  } catch (error) {
    console.error('[getTeamMatches] 팀 매치 조회 오류:', error)
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
}

// 특정 경기의 상세 정보 가져오기
export async function getMatchDetails(fixtureId: number): Promise<{
  success: boolean
  data: TeamMatch | null
  error?: string
}> {
  try {
    // footballApi.ts의 fetchFromFootballApi 함수 사용
    const data = await fetchFromFootballApi('fixtures', { id: fixtureId })

    const matchData = data.response?.[0] || null

    return {
      success: true,
      data: matchData
    }

  } catch (error) {
    console.error('[getMatchDetails] 경기 상세 정보 조회 오류:', error)
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
} 