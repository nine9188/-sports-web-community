/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi'
import { openai } from '../libs/openai'
import { 
  getCachedPrediction, 
  savePredictionToCache, 
  incrementViewCount,
  type PredictionSummary,
  type MatchContext,
  type DataSources
} from './matchPredictionCache'

// 리그별 현재 시즌을 계산하는 함수
function getCurrentSeason(leagueId: number, matchDate: string): number {
  const matchYear = parseInt(matchDate.slice(0, 4))
  const matchMonth = parseInt(matchDate.slice(5, 7))
  
  // J1 리그 (98)와 K리그 (292, 293, 294)는 연도별 시즌
  const asianLeagues = [98, 292, 293, 294]
  if (asianLeagues.includes(leagueId)) {
    return matchYear
  }
  
  // 유럽 리그는 시즌이 다음 해까지 이어짐 (예: 2024-2025 시즌)
  // 7월 이후면 새 시즌, 6월 이전이면 이전 시즌
  if (matchMonth >= 7) {
    return matchYear
  } else {
    return matchYear - 1
  }
}

// 팀의 주요 소속 리그 ID를 가져오는 함수
async function getTeamMainLeague(teamId: number, season: number): Promise<number | null> {
  try {
    console.log(`[팀 소속 리그 조회] 팀 ID: ${teamId}, 시즌: ${season}`)
    
    const res = await fetchFromFootballApi('leagues', {
      team: teamId,
      season: season
    })
    
    if (!res?.response || res.response.length === 0) {
      console.log(`[팀 소속 리그] 팀 ID: ${teamId} - 리그 정보 없음`)
      return null
    }
    
    // 우선순위: 국내 리그 > 대륙 대회 > 기타
    const leagues = res.response
    
    // 1순위: 국내 메이저 리그
    const domesticLeague = leagues.find((l: any) => 
      l.league.type === 'League' && 
      [39, 140, 78, 135, 61, 94, 88, 292, 98, 307].includes(l.league.id) // 주요 리그 ID들
    )
    
    if (domesticLeague) {
      console.log(`[팀 소속 리그 발견] 팀 ID: ${teamId} - 주요 리그: ${domesticLeague.league.id} (${domesticLeague.league.name})`)
      return domesticLeague.league.id
    }
    
    // 2순위: 일반 국내 리그
    const generalLeague = leagues.find((l: any) => l.league.type === 'League')
    if (generalLeague) {
      console.log(`[팀 소속 리그 발견] 팀 ID: ${teamId} - 일반 리그: ${generalLeague.league.id} (${generalLeague.league.name})`)
      return generalLeague.league.id
    }
    
    console.log(`[팀 소속 리그] 팀 ID: ${teamId} - 적절한 리그 없음`)
    return null
    
  } catch (error) {
    console.error(`팀 소속 리그 조회 실패 (팀 ID: ${teamId}):`, error)
    return null
  }
}

// 팀 통계를 가져오는 함수 (API-Football 올바른 엔드포인트 사용)
async function getTeamStats(teamId: number, leagueId: number, season: number) {
  try {
    console.log(`[팀 통계 요청] 팀 ID: ${teamId}, 리그: ${leagueId}, 시즌: ${season}`)
    
    // 특수 대회 리스트 (클럽 월드컵, 인터콘티넨털컵 등)
    const specialTournaments = [15, 531, 848] // FIFA Club World Cup, UEFA Super Cup, Conference League 등
    
    // 먼저 원래 리그에서 시도
    const seasonsToTry = [2024, season, season - 1].filter((s, i, arr) => arr.indexOf(s) === i)
    
    for (const trySeeason of seasonsToTry) {
      console.log(`[팀 통계 시도] 팀 ID: ${teamId}, 시즌: ${trySeeason}`)
      
  const res = await fetchFromFootballApi('teams/statistics', {
    team: teamId,
    league: leagueId,
        season: trySeeason
      })
      
      console.log(`[팀 통계 API 응답] 팀 ID: ${teamId}, 시즌: ${trySeeason}`, JSON.stringify(res, null, 2))
      
      // 데이터가 있고 실제 경기 수가 0이 아닌 경우
      if (res?.response && res.response.fixtures?.played?.total > 0) {
        console.log(`[팀 통계 성공] 팀 ID: ${teamId}, 시즌: ${trySeeason}`)
        return res.response
      }
    }
    
    // 특수 대회에서 데이터가 없는 경우, 팀의 주요 소속 리그에서 시도
    if (specialTournaments.includes(leagueId)) {
      console.log(`[특수 대회 폴백] 팀 ID: ${teamId} - 주요 소속 리그에서 통계 조회 시도`)
      
      const mainLeagueId = await getTeamMainLeague(teamId, season)
      if (mainLeagueId && mainLeagueId !== leagueId) {
        console.log(`[주요 리그 통계 시도] 팀 ID: ${teamId}, 주요 리그: ${mainLeagueId}`)
        
        for (const trySeeason of seasonsToTry) {
          const res = await fetchFromFootballApi('teams/statistics', {
            team: teamId,
            league: mainLeagueId,
            season: trySeeason
          })
          
          if (res?.response && res.response.fixtures?.played?.total > 0) {
            console.log(`[주요 리그 통계 성공] 팀 ID: ${teamId}, 리그: ${mainLeagueId}, 시즌: ${trySeeason}`)
            return res.response
          }
        }
      }
    }
    
    console.log(`[팀 통계 실패] 팀 ID: ${teamId} - 모든 시도 완료`)
    return null
    
  } catch (error) {
    console.error(`팀 통계 가져오기 실패 (팀 ID: ${teamId}):`, error)
    return null
  }
}

// 팀의 부상자 정보를 가져오는 함수 (현재 활성화된 부상만)
async function getTeamInjuries(teamId: number, leagueId: number, season: number) {
  try {
    console.log(`[부상 정보 요청] 팀 ID: ${teamId}, 리그: ${leagueId}, 시즌: ${season}`)
    
    const specialTournaments = [15, 531, 848]
    const seasonsToTry = [season, 2024, season - 1].filter((s, i, arr) => arr.indexOf(s) === i)
    
    // 현재 날짜 기준으로 30일 이내의 부상만 필터링하기 위한 기준 날짜
    const currentDate = new Date()
    const thirtyDaysAgo = new Date(currentDate.getTime() - (30 * 24 * 60 * 60 * 1000))
    
    // 원래 리그에서 시도
    for (const trySeeason of seasonsToTry) {
      const res = await fetchFromFootballApi('injuries', {
        team: teamId,
        league: leagueId,
        season: trySeeason
      })
      
      if (res?.response && res.response.length > 0) {
        // 현재 활성화된 부상만 필터링
        const activeInjuries = res.response.filter((injury: any) => {
          // 부상 날짜가 있고 30일 이내인 경우만
          if (injury.fixture?.date) {
            const injuryDate = new Date(injury.fixture.date)
            if (injuryDate < thirtyDaysAgo) return false
          }
          
          // 실제 부상인지 확인 (감독 결정, 휴식 등은 제외)
          const reason = injury.player?.reason || injury.reason || ''
          const type = injury.player?.type || injury.type || ''
          
          // 제외할 사유들
          const excludeReasons = [
            "Coach's decision",
            'Rest',
            'National selection',
            'Suspended',
            'Unknown'
          ]
          
          const excludeTypes = [
            'Unknown'
          ]
          
          // 제외 사유에 해당하지 않는 경우만 포함
          if (excludeReasons.some(exclude => reason.toLowerCase().includes(exclude.toLowerCase()))) {
            return false
          }
          
          if (excludeTypes.some(exclude => type.toLowerCase().includes(exclude.toLowerCase()))) {
            return false
          }
          
          return true
        })
        
        if (activeInjuries.length > 0) {
          console.log(`[부상 정보 성공] 팀 ID: ${teamId}, 시즌: ${trySeeason}, 활성 부상자 수: ${activeInjuries.length} (전체: ${res.response.length})`)
          return activeInjuries
        }
      }
    }
    
    // 특수 대회 폴백
    if (specialTournaments.includes(leagueId)) {
      const mainLeagueId = await getTeamMainLeague(teamId, season)
      if (mainLeagueId && mainLeagueId !== leagueId) {
        for (const trySeeason of seasonsToTry) {
          const res = await fetchFromFootballApi('injuries', {
            team: teamId,
            league: mainLeagueId,
            season: trySeeason
          })
          
          if (res?.response && res.response.length > 0) {
            // 동일한 필터링 적용
            const activeInjuries = res.response.filter((injury: any) => {
              if (injury.fixture?.date) {
                const injuryDate = new Date(injury.fixture.date)
                if (injuryDate < thirtyDaysAgo) return false
              }
              
              const reason = injury.player?.reason || injury.reason || ''
              const type = injury.player?.type || injury.type || ''
              
              const excludeReasons = [
                "Coach's decision",
                'Rest',
                'National selection',
                'Suspended',
                'Unknown'
              ]
              
              const excludeTypes = [
                'Unknown'
              ]
              
              if (excludeReasons.some(exclude => reason.toLowerCase().includes(exclude.toLowerCase()))) {
                return false
              }
              
              if (excludeTypes.some(exclude => type.toLowerCase().includes(exclude.toLowerCase()))) {
                return false
              }
              
              return true
            })
            
            if (activeInjuries.length > 0) {
              console.log(`[주요 리그 부상 정보 성공] 팀 ID: ${teamId}, 리그: ${mainLeagueId}, 활성 부상자 수: ${activeInjuries.length}`)
              return activeInjuries
            }
          }
        }
      }
    }
    
    console.log(`[부상 정보] 팀 ID: ${teamId} - 현재 활성 부상자 없음`)
    return []
  } catch (error) {
    console.error(`부상 정보 가져오기 실패 (팀 ID: ${teamId}):`, error)
    return []
  }
}

// 팀의 최근 경기 폼을 가져오는 함수
async function getTeamForm(teamId: number, leagueId: number, season: number, last: number = 5) {
  try {
    console.log(`[팀 폼 요청] 팀 ID: ${teamId}, 리그: ${leagueId}, 시즌: ${season}`)
    
    const specialTournaments = [15, 531, 848]
    const seasonsToTry = [season, 2024, season - 1].filter((s, i, arr) => arr.indexOf(s) === i)
    
    // 원래 리그에서 시도
    for (const trySeeason of seasonsToTry) {
      const res = await fetchFromFootballApi('fixtures', {
        team: teamId,
        league: leagueId,
        season: trySeeason,
        last: last
      })
      
      if (res?.response && res.response.length > 0) {
        console.log(`[팀 폼 성공] 팀 ID: ${teamId}, 시즌: ${trySeeason}, 경기 수: ${res.response.length}`)
        return res.response
      }
    }
    
    // 특수 대회 폴백
    if (specialTournaments.includes(leagueId)) {
      const mainLeagueId = await getTeamMainLeague(teamId, season)
      if (mainLeagueId && mainLeagueId !== leagueId) {
        for (const trySeeason of seasonsToTry) {
          const res = await fetchFromFootballApi('fixtures', {
            team: teamId,
            league: mainLeagueId,
            season: trySeeason,
            last: last
          })
          
          if (res?.response && res.response.length > 0) {
            console.log(`[주요 리그 폼 성공] 팀 ID: ${teamId}, 리그: ${mainLeagueId}, 경기 수: ${res.response.length}`)
            return res.response
          }
        }
      }
    }
    
    console.log(`[팀 폼 실패] 팀 ID: ${teamId} - 데이터 없음`)
    return []
  } catch (error) {
    console.error(`팀 폼 가져오기 실패 (팀 ID: ${teamId}):`, error)
    return []
  }
}

// 차트용 통계 데이터 생성 함수
function generateChartData(
  home: any,
  away: any,
  homeStats: any,
  awayStats: any,
  homeForm: any,
  awayForm: any,
  homeInjuries: any,
  awayInjuries: any,
  odds?: any
) {
  // 배당률 데이터 변환
  const bettingOdds = odds?.response?.[0]?.bookmakers?.[0]?.bets
    ?.find((b: any) => b.name === 'Match Winner')?.values
    ?.map((v: any) => ({
      name: v.value,
      value: v.value,
      odd: parseFloat(v.odd) || 0
    })) || null

  return {
    homeTeam: {
      name: home.name,
      stats: {
        homeWins: homeStats?.fixtures?.wins?.home ?? 0,
        homePlayed: homeStats?.fixtures?.played?.home ?? 0,
        homeGoalsFor: homeStats?.goals?.for?.total?.home ?? 0,
        homeGoalsAgainst: homeStats?.goals?.against?.total?.home ?? 0,
        totalWins: homeStats?.fixtures?.wins?.total ?? 0,
        totalPlayed: homeStats?.fixtures?.played?.total ?? 0,
        form: homeForm?.slice(0, 5).map((fixture: any) => {
          const homeGoals = fixture.goals?.home ?? 0
          const awayGoals = fixture.goals?.away ?? 0
          const homeTeamId = fixture.teams?.home?.id
          const isHome = homeTeamId === home.id
          
          if (isHome) {
            if (homeGoals > awayGoals) return 'W'
            if (homeGoals < awayGoals) return 'L'
            return 'D'
          } else {
            if (awayGoals > homeGoals) return 'W'
            if (awayGoals < homeGoals) return 'L'
            return 'D'
          }
        }).join(' - ') || 'N/A',
        injuries: homeInjuries?.length || 0
      }
    },
    awayTeam: {
      name: away.name,
      stats: {
        awayWins: awayStats?.fixtures?.wins?.away ?? 0,
        awayPlayed: awayStats?.fixtures?.played?.away ?? 0,
        awayGoalsFor: awayStats?.goals?.for?.total?.away ?? 0,
        awayGoalsAgainst: awayStats?.goals?.against?.total?.away ?? 0,
        totalWins: awayStats?.fixtures?.wins?.total ?? 0,
        totalPlayed: awayStats?.fixtures?.played?.total ?? 0,
        form: awayForm?.slice(0, 5).map((fixture: any) => {
          const homeGoals = fixture.goals?.home ?? 0
          const awayGoals = fixture.goals?.away ?? 0
          const homeTeamId = fixture.teams?.home?.id
          const isHome = homeTeamId === away.id
          
          if (isHome) {
            if (homeGoals > awayGoals) return 'W'
            if (homeGoals < awayGoals) return 'L'
            return 'D'
          } else {
            if (awayGoals > homeGoals) return 'W'
            if (awayGoals < homeGoals) return 'L'
            return 'D'
          }
        }).join(' - ') || 'N/A',
        injuries: awayInjuries?.length || 0
      }
    },
    bettingOdds
  }
}

export async function predictMatch(fixtureId: number, forceRefresh: boolean = false) {
  try {
    // 캐시된 예측 먼저 확인 (강제 새로고침이 아닌 경우)
    if (!forceRefresh) {
      const cached = await getCachedPrediction(fixtureId)
      if (cached) {
        console.log(`[캐시된 예측 사용] fixture_id: ${fixtureId}`)
        // 조회수 증가
        await incrementViewCount(fixtureId)
        
        // 캐시된 분석 결과 반환 (데이터 섹션 제거)
        const cachedData = cached as any
        
        // 캐시된 데이터에서 차트 데이터 재구성 (home_team_stats, away_team_stats가 있는 경우)
        let cachedChartData = null
        if (cachedData.home_team_stats && cachedData.away_team_stats) {
          try {
            // 경기 정보 가져오기 (차트 데이터 생성용)
            const fixtureRes = await fetchFromFootballApi('fixtures', { id: fixtureId })
            const match = fixtureRes?.response?.[0]
            
            if (match) {
              cachedChartData = generateChartData(
                match.teams.home,
                match.teams.away,
                cachedData.home_team_stats,
                cachedData.away_team_stats,
                [], // 폼 데이터는 캐시에서 복원하기 어려움
                [],
                [], // 부상 데이터도 마찬가지
                [],
                null // 배당률 데이터도 마찬가지
              )
            }
          } catch (error) {
            console.warn('캐시된 차트 데이터 생성 실패:', error)
          }
        }
        
        return {
          textAnalysis: cachedData.ai_analysis || '캐시된 분석 결과를 불러올 수 없습니다.',
          chartData: cachedChartData
        }
      }
    }

    // 경기 정보 가져오기
    const fixtureRes = await fetchFromFootballApi('fixtures', { id: fixtureId })
    const match = fixtureRes?.response?.[0]
    if (!match) throw new Error('경기 정보 없음')

    console.log('[경기 정보]', JSON.stringify(match, null, 2))

    const home = match.teams.home
    const away = match.teams.away
    const matchDate = match.fixture.date.split('T')[0] // YYYY-MM-DD
    const leagueId = match.league.id
    const season = getCurrentSeason(leagueId, matchDate)

    console.log(`[경기 기본 정보] ${home.name} vs ${away.name}, 날짜: ${matchDate}, 리그: ${leagueId} (${match.league.name}), 시즌: ${season}`)

    // 병렬로 데이터 가져오기
    const [homeStats, awayStats, homeForm, awayForm, homeInjuries, awayInjuries, h2h, odds] = await Promise.all([
      getTeamStats(home.id, leagueId, season),
      getTeamStats(away.id, leagueId, season),
      getTeamForm(home.id, leagueId, season),
      getTeamForm(away.id, leagueId, season),
      getTeamInjuries(home.id, leagueId, season),
      getTeamInjuries(away.id, leagueId, season),
      fetchFromFootballApi('fixtures/headtohead', { h2h: `${home.id}-${away.id}` }),
      fetchFromFootballApi('odds', { fixture: fixtureId })
    ])

    console.log('[홈팀 통계 구조]', homeStats ? Object.keys(homeStats) : 'null')
    console.log('[어웨이팀 통계 구조]', awayStats ? Object.keys(awayStats) : 'null')

    // 실제 사용된 리그 정보 추적
    const homeStatsLeague = homeStats?.league?.name || '정보 없음'
    const awayStatsLeague = awayStats?.league?.name || '정보 없음'

    const prompt = `
당신은 데이터 기반 축구 분석 전문가입니다. 아래의 구체적인 통계 수치를 바탕으로 정확한 승부 예측을 해주세요.

🏟️ 경기 정보
- 경기: ${home.name} vs ${away.name}
- 날짜: ${matchDate}
- 대회: ${match.league.name}
- 통계 출처: ${homeStatsLeague !== '정보 없음' ? `홈팀 통계 출처: ${homeStatsLeague}` : '홈팀 통계 없음'} / ${awayStatsLeague !== '정보 없음' ? `어웨이팀 통계 출처: ${awayStatsLeague}` : '어웨이팀 통계 없음'}

📊 핵심 통계 비교 (2024시즌 기준)

홈팀 ${home.name} (홈경기 기준):
✅ 홈경기 성적: ${homeStats?.fixtures?.played?.home ?? 'N/A'}경기 ${homeStats?.fixtures?.wins?.home ?? 'N/A'}승 ${homeStats?.fixtures?.draws?.home ?? 'N/A'}무 ${homeStats?.fixtures?.loses?.home ?? 'N/A'}패
✅ 홈경기 승률: ${homeStats?.fixtures?.wins?.home !== 'N/A' && homeStats?.fixtures?.played?.home !== 'N/A' ? ((homeStats?.fixtures?.wins?.home as number) / (homeStats?.fixtures?.played?.home as number) * 100).toFixed(1) : 'N/A'}%
✅ 홈경기 득실: ${homeStats?.goals?.for?.total?.home ?? 'N/A'}득점 ${homeStats?.goals?.against?.total?.home ?? 'N/A'}실점 (득실차: ${typeof homeStats?.goals?.for?.total?.home === 'number' && typeof homeStats?.goals?.against?.total?.home === 'number' ? (homeStats?.goals?.for?.total?.home as number) - (homeStats?.goals?.against?.total?.home as number) : 'N/A'})
✅ 전체 시즌 승률: ${homeStats?.fixtures?.wins?.total !== 'N/A' && homeStats?.fixtures?.played?.total !== 'N/A' ? ((homeStats?.fixtures?.wins?.total as number) / (homeStats?.fixtures?.played?.total as number) * 100).toFixed(1) : 'N/A'}% (${homeStats?.fixtures?.played?.total ?? 'N/A'}경기 중 ${homeStats?.fixtures?.wins?.total ?? 'N/A'}승)
✅ 최근 5경기 폼: ${homeForm?.slice(0, 5).map((fixture: any) => {
  const homeGoals = fixture.goals?.home ?? 0
  const awayGoals = fixture.goals?.away ?? 0
  const homeTeamId = fixture.teams?.home?.id
  const isHome = homeTeamId === home.id
  
  if (isHome) {
    if (homeGoals > awayGoals) return 'W'
    if (homeGoals < awayGoals) return 'L'
    return 'D'
  } else {
    if (awayGoals > homeGoals) return 'W'
    if (awayGoals < homeGoals) return 'L'
    return 'D'
  }
}).join('') || 'N/A'}

어웨이팀 ${away.name} (원정경기 기준):
⚠️ 원정경기 성적: ${awayStats?.fixtures?.played?.away ?? 'N/A'}경기 ${awayStats?.fixtures?.wins?.away ?? 'N/A'}승 ${awayStats?.fixtures?.draws?.away ?? 'N/A'}무 ${awayStats?.fixtures?.loses?.away ?? 'N/A'}패  
⚠️ 원정경기 승률: ${awayStats?.fixtures?.wins?.away !== 'N/A' && awayStats?.fixtures?.played?.away !== 'N/A' ? ((awayStats?.fixtures?.wins?.away as number) / (awayStats?.fixtures?.played?.away as number) * 100).toFixed(1) : 'N/A'}%
⚠️ 원정경기 득실: ${awayStats?.goals?.for?.total?.away ?? 'N/A'}득점 ${awayStats?.goals?.against?.total?.away ?? 'N/A'}실점 (득실차: ${typeof awayStats?.goals?.for?.total?.away === 'number' && typeof awayStats?.goals?.against?.total?.away === 'number' ? (awayStats?.goals?.for?.total?.away as number) - (awayStats?.goals?.against?.total?.away as number) : 'N/A'})
⚠️ 전체 시즌 승률: ${awayStats?.fixtures?.wins?.total !== 'N/A' && awayStats?.fixtures?.played?.total !== 'N/A' ? ((awayStats?.fixtures?.wins?.total as number) / (awayStats?.fixtures?.played?.total as number) * 100).toFixed(1) : 'N/A'}% (${awayStats?.fixtures?.played?.total ?? 'N/A'}경기 중 ${awayStats?.fixtures?.wins?.total ?? 'N/A'}승)
⚠️ 최근 5경기 폼: ${awayForm?.slice(0, 5).map((fixture: any) => {
  const homeGoals = fixture.goals?.home ?? 0
  const awayGoals = fixture.goals?.away ?? 0
  const homeTeamId = fixture.teams?.home?.id
  const isHome = homeTeamId === away.id
  
  if (isHome) {
    if (homeGoals > awayGoals) return 'W'
    if (homeGoals < awayGoals) return 'L'
    return 'D'
  } else {
    if (awayGoals > homeGoals) return 'W'
    if (awayGoals < homeGoals) return 'L'
    return 'D'
  }
}).join('') || 'N/A'}

🏆 맞대결 전적 (최근 5경기):
${h2h?.response?.slice(0, 5)?.map((h: any) => `• ${h.teams.home.name} ${h.goals.home ?? '-'} - ${h.goals.away ?? '-'} ${h.teams.away.name}`)
?.join('\n') || '최근 맞대결 데이터 없음'}

🚑 부상자 현황:
${(() => {
  // 홈팀 부상자 포지션별 분류
  const homeInjurySummary = homeInjuries?.reduce((acc: any, injury: any) => {
    const position = injury.player?.position || '알 수 없음'
    const playerName = injury.player?.name || '알 수 없음'
    const reason = injury.player?.reason || '정보 없음'
    
    if (position.includes('Defender') || position.includes('Defence')) {
      acc.defenders.push(`${playerName}(${reason})`)
    } else if (position.includes('Midfielder') || position.includes('Midfield')) {
      acc.midfielders.push(`${playerName}(${reason})`)
    } else if (position.includes('Attacker') || position.includes('Forward')) {
      acc.attackers.push(`${playerName}(${reason})`)
    } else if (position.includes('Goalkeeper')) {
      acc.goalkeepers.push(`${playerName}(${reason})`)
    } else {
      acc.others.push(`${playerName}(${reason})`)
    }
    return acc
  }, { defenders: [], midfielders: [], attackers: [], goalkeepers: [], others: [] }) || { defenders: [], midfielders: [], attackers: [], goalkeepers: [], others: [] }

  // 어웨이팀 부상자 포지션별 분류
  const awayInjurySummary = awayInjuries?.reduce((acc: any, injury: any) => {
    const position = injury.player?.position || '알 수 없음'
    const playerName = injury.player?.name || '알 수 없음'
    const reason = injury.player?.reason || '정보 없음'
    
    if (position.includes('Defender') || position.includes('Defence')) {
      acc.defenders.push(`${playerName}(${reason})`)
    } else if (position.includes('Midfielder') || position.includes('Midfield')) {
      acc.midfielders.push(`${playerName}(${reason})`)
    } else if (position.includes('Attacker') || position.includes('Forward')) {
      acc.attackers.push(`${playerName}(${reason})`)
    } else if (position.includes('Goalkeeper')) {
      acc.goalkeepers.push(`${playerName}(${reason})`)
    } else {
      acc.others.push(`${playerName}(${reason})`)
    }
    return acc
  }, { defenders: [], midfielders: [], attackers: [], goalkeepers: [], others: [] }) || { defenders: [], midfielders: [], attackers: [], goalkeepers: [], others: [] }

  let result = `홈팀 ${home.name}: `
  if (homeInjuries?.length > 0) {
    const positionCounts = []
    if (homeInjurySummary.goalkeepers.length > 0) positionCounts.push(`골키퍼 ${homeInjurySummary.goalkeepers.length}명`)
    if (homeInjurySummary.defenders.length > 0) positionCounts.push(`수비수 ${homeInjurySummary.defenders.length}명`)
    if (homeInjurySummary.midfielders.length > 0) positionCounts.push(`미드필더 ${homeInjurySummary.midfielders.length}명`)
    if (homeInjurySummary.attackers.length > 0) positionCounts.push(`공격수 ${homeInjurySummary.attackers.length}명`)
    if (homeInjurySummary.others.length > 0) positionCounts.push(`기타 ${homeInjurySummary.others.length}명`)
    
    result += positionCounts.length > 0 ? `${positionCounts.join(', ')} 결장 예상` : '부상자 없음'
  } else {
    result += '부상자 없음'
  }

  result += `\n어웨이팀 ${away.name}: `
  if (awayInjuries?.length > 0) {
    const positionCounts = []
    if (awayInjurySummary.goalkeepers.length > 0) positionCounts.push(`골키퍼 ${awayInjurySummary.goalkeepers.length}명`)
    if (awayInjurySummary.defenders.length > 0) positionCounts.push(`수비수 ${awayInjurySummary.defenders.length}명`)
    if (awayInjurySummary.midfielders.length > 0) positionCounts.push(`미드필더 ${awayInjurySummary.midfielders.length}명`)
    if (awayInjurySummary.attackers.length > 0) positionCounts.push(`공격수 ${awayInjurySummary.attackers.length}명`)
    if (awayInjurySummary.others.length > 0) positionCounts.push(`기타 ${awayInjurySummary.others.length}명`)
    
    result += positionCounts.length > 0 ? `${positionCounts.join(', ')} 결장 예상` : '부상자 없음'
  } else {
    result += '부상자 없음'
  }

  return result
})()}

💰 배당률 분석:
${odds?.response?.[0]?.bookmakers?.[0]?.bets
?.find((b: any) => b.name === 'Match Winner')?.values
?.map((v: any) => `- ${v.value}: 배당률 ${v.odd}`)
?.join('\n') || '배당률 정보 없음'}

🎯 이번 경기를 어떻게 보십니까?

위 데이터를 바탕으로 다음과 같은 스타일의 자연스러운 축구 칼럼을 작성해주세요:

**결과 예측:**
- ${home.name} 승리: ??%
- 무승부: ??%  
- ${away.name} 승리: ??%
- 예상 스코어: ?-?

**경기 전망:**
홈팀 ${home.name}은 홈에서 ${homeStats?.fixtures?.wins?.home !== 'N/A' && homeStats?.fixtures?.played?.home !== 'N/A' ? ((homeStats?.fixtures?.wins?.home as number) / (homeStats?.fixtures?.played?.home as number) * 100).toFixed(1) : 'N/A'}%의 승률을 기록하고 있다. 반면 원정팀 ${away.name}은 어웨이에서 ${awayStats?.fixtures?.wins?.away !== 'N/A' && awayStats?.fixtures?.played?.away !== 'N/A' ? ((awayStats?.fixtures?.wins?.away as number) / (awayStats?.fixtures?.played?.away as number) * 100).toFixed(1) : 'N/A'}%의 승률을 보여주고 있어 홈 어드밴티지가 중요한 변수가 될 것으로 보인다.

최근 폼을 살펴보면, ${home.name}은 ${homeForm?.slice(0, 5).map((fixture: any) => {
  const homeGoals = fixture.goals?.home ?? 0
  const awayGoals = fixture.goals?.away ?? 0
  const homeTeamId = fixture.teams?.home?.id
  const isHome = homeTeamId === home.id
  
  if (isHome) {
    if (homeGoals > awayGoals) return 'W'
    if (homeGoals < awayGoals) return 'L'
    return 'D'
  } else {
    if (awayGoals > homeGoals) return 'W'
    if (awayGoals < homeGoals) return 'L'
    return 'D'
  }
}).join('') || 'N/A'}의 흐름을 타고 있고, ${away.name}은 ${awayForm?.slice(0, 5).map((fixture: any) => {
  const homeGoals = fixture.goals?.home ?? 0
  const awayGoals = fixture.goals?.away ?? 0
  const homeTeamId = fixture.teams?.home?.id
  const isHome = homeTeamId === away.id
  
  if (isHome) {
    if (homeGoals > awayGoals) return 'W'
    if (homeGoals < awayGoals) return 'L'
    return 'D'
  } else {
    if (awayGoals > homeGoals) return 'W'
    if (awayGoals < homeGoals) return 'L'
    return 'D'
  }
}).join('') || 'N/A'}의 컨디션을 보이고 있다.

부상자 상황을 보면 [부상자 영향 분석을 자연스럽게 서술], 이는 경기 결과에 상당한 영향을 미칠 것으로 예상된다.

**관전 포인트:**
[이번 경기에서 주목해야 할 선수, 전술, 상황 등을 자연스럽게 서술]

이런 식으로 딱딱한 분석보다는 축구 전문가가 쓴 칼럼처럼 자연스럽고 흥미롭게 작성해주세요. 통계는 정확히 활용하되, 표현은 부드럽고 스토리텔링이 있게 해주세요. 축구 팬들이 "누가 이길까?" 하는 순수한 궁금증을 해결해주는 분석으로 작성해주세요.

**중요한 문단 띄어쓰기 지침:**
1. **결과 예측:** 섹션 앞에는 반드시 빈 줄을 넣어주세요
2. 예상 스코어 뒤에는 반드시 빈 줄을 넣어주세요  
3. "이번 경기", "팬 여러분", "축구는", "관심" 등으로 시작하는 새로운 문단 앞에는 빈 줄을 넣어주세요
4. 각 주요 섹션(경기 전망, 관전 포인트 등) 사이에는 적절한 빈 줄을 넣어 가독성을 높여주세요

**절대 금지사항:**
- 배팅, 베팅, 도박, 투자 등의 표현은 절대 사용하지 마세요
- 배당률 정보를 활용한 투자 권유는 하지 마세요
- 순수하게 축구 경기 결과 예측과 관전 재미에만 집중해주세요
`

    console.log('[GPT 프롬프트]', prompt)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-nano-2025-04-14',
      messages: [
        { role: 'system', content: '당신은 20년 경력의 축구 전문 기자입니다. 데이터를 바탕으로 하되 딱딱하지 않고 흥미로운 칼럼을 작성합니다. 통계 수치는 정확히 활용하되, 마치 경험 많은 축구 해설가가 이야기하듯 자연스럽고 재미있게 표현해주세요. 한국어로 작성하며, AI 티가 나지 않게 인간적인 어조를 사용해주세요. 특히 문단 띄어쓰기를 잘 해서 읽기 쉽게 작성해주세요. 중요: 배팅이나 도박 관련 내용은 절대 포함하지 마세요. 순수하게 축구 팬들의 "누가 이길까?" 하는 궁금증을 해결하는 분석에만 집중해주세요.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    })

    const aiAnalysis = completion.choices[0].message.content || '분석 결과를 가져올 수 없습니다.'

    // AI 분석에서 확률 추출 (간단한 패턴 매칭)
    const homeWinMatch = aiAnalysis.match(/홈.*?승리.*?(\d+)%/) || aiAnalysis.match(/(\d+)%.*?승리/)
    const drawMatch = aiAnalysis.match(/무승부.*?(\d+)%/)
    const awayWinMatch = aiAnalysis.match(/어웨이.*?승리.*?(\d+)%/) || aiAnalysis.match(/원정.*?승리.*?(\d+)%/)
    const scoreMatch = aiAnalysis.match(/(\d+-\d+)/)

    const predictionSummary: PredictionSummary = {
      home_win_percentage: homeWinMatch ? parseInt(homeWinMatch[1]) : 45,
      draw_percentage: drawMatch ? parseInt(drawMatch[1]) : 25,
      away_win_percentage: awayWinMatch ? parseInt(awayWinMatch[1]) : 30,
      predicted_score: scoreMatch ? scoreMatch[1] : '1-1',
      confidence_level: (homeStats && awayStats) ? 'high' : 'medium'
    }

    const matchContext: MatchContext = {
      h2h_summary: h2h?.response?.slice(0, 3)?.map((h: any) => 
        `${h.teams.home.name} ${h.goals.home ?? '-'} - ${h.goals.away ?? '-'} ${h.teams.away.name}`
      ).join(', ') || '맞대결 기록 없음',
      injury_impact: `홈팀 ${homeInjuries?.length || 0}명, 어웨이팀 ${awayInjuries?.length || 0}명 부상`,
      form_analysis: `홈팀 최근 폼: ${homeForm?.slice(0, 5).map(() => 'W/L/D').join('') || 'N/A'}, 어웨이팀: ${awayForm?.slice(0, 5).map(() => 'W/L/D').join('') || 'N/A'}`,
      betting_odds: odds?.response?.[0]?.bookmakers?.[0]?.bets?.find((b: any) => b.name === 'Match Winner')?.values || null
    }

    const dataSources: DataSources = {
      home_stats_league: homeStatsLeague,
      away_stats_league: awayStatsLeague,
      stats_season: season,
      api_calls_made: ['fixtures', 'teams/statistics', 'fixtures/form', 'injuries', 'fixtures/headtohead', 'odds']
    }

    // AI 분석 결과 후처리 (문단 띄어쓰기 개선 및 배팅 관련 내용 제거)
    const processedAnalysis = aiAnalysis
      // 배팅 관련 내용 완전 제거
      .replace(/\*\*베팅\s*관점:\s?\*\*[\s\S]*?(?=\*\*|$)/gi, '')
      .replace(/배팅[^.]*\./g, '')
      .replace(/도박[^.]*\./g, '')
      .replace(/베팅[^.]*\./g, '')
      .replace(/배당[^.]*\./g, '')
      .replace(/투자[^.]*\./g, '')
      // **결과 예측:** 앞에 줄바꿈 추가
      .replace(/(\*\*결과 예측:\s?\*\*)/g, '\n\n$1')
      // **관전 포인트:** 앞에 줄바꿈 추가
      .replace(/(\*\*관전\s*포인트:\s?\*\*)/g, '\n\n$1')
      // **경기 전망:** 앞에 줄바꿈 추가 
      .replace(/(\*\*경기\s*전망:\s?\*\*)/g, '\n\n$1')
      // 예상 스코어 뒤에 줄바꿈 추가
      .replace(/(예상 스코어:\s*[^\n]+)/g, '$1\n\n')
      // 문장 끝 마침표 뒤에 자연스러운 문단 나누기
      .replace(/([.!?])\s*(이번\s*경기|팬\s*여러분|축구는|관심|결론적으로|하지만|그러나|특히)/g, '$1\n\n$2')
      // 과도한 줄바꿈 정리
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    // 예측 결과를 데이터베이스에 저장
    await savePredictionToCache(
      fixtureId,
      match,
      processedAnalysis,
      homeStats,
      awayStats,
      matchContext,
      dataSources,
      predictionSummary,
      8, // API 호출 수
      0.02 // 예상 비용 (GPT-4.1-nano)
    )

    // 차트 데이터 생성
    const chartData = generateChartData(
      home, 
      away, 
      homeStats, 
      awayStats, 
      homeForm, 
      awayForm, 
      homeInjuries, 
      awayInjuries,
      odds
    )

    // 데이터 섹션 없이 AI 분석 결과만 반환
    return {
      textAnalysis: processedAnalysis,
      chartData: chartData
    }

  } catch (err) {
    console.error('승부 예측 실패:', err)
    return `예측에 실패했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`
  }
}
