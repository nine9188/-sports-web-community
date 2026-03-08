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
    const res = await fetchFromFootballApi('leagues', {
      team: teamId,
      season: season
    })
    
    if (!res?.response || res.response.length === 0) {
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
      return domesticLeague.league.id
    }
    
    // 2순위: 일반 국내 리그
    const generalLeague = leagues.find((l: any) => l.league.type === 'League')
    if (generalLeague) {
      return generalLeague.league.id
    }
    
    return null
    
  } catch (error) {
    console.error(`팀 소속 리그 조회 실패 (팀 ID: ${teamId}):`, error)
    return null
  }
}

// 팀 통계를 가져오는 함수 (API-Football 올바른 엔드포인트 사용)
async function getTeamStats(teamId: number, leagueId: number, season: number) {
  try {
    // 특수 대회 리스트 (클럽 월드컵, 인터콘티넨털컵 등)
    const specialTournaments = [15, 531, 848] // FIFA Club World Cup, UEFA Super Cup, Conference League 등
    
    // 먼저 원래 리그에서 시도
    const seasonsToTry = [2024, season, season - 1].filter((s, i, arr) => arr.indexOf(s) === i)
    
    for (const trySeeason of seasonsToTry) {
  const res = await fetchFromFootballApi('teams/statistics', {
    team: teamId,
    league: leagueId,
        season: trySeeason
      })
      
      // 데이터가 있고 실제 경기 수가 0이 아닌 경우
      if (res?.response && res.response.fixtures?.played?.total > 0) {
        return res.response
      }
    }
    
    // 특수 대회에서 데이터가 없는 경우, 팀의 주요 소속 리그에서 시도
    if (specialTournaments.includes(leagueId)) {
      const mainLeagueId = await getTeamMainLeague(teamId, season)
      if (mainLeagueId && mainLeagueId !== leagueId) {
        
        for (const trySeeason of seasonsToTry) {
          const res = await fetchFromFootballApi('teams/statistics', {
            team: teamId,
            league: mainLeagueId,
            season: trySeeason
          })
          
          if (res?.response && res.response.fixtures?.played?.total > 0) {
            return res.response
          }
        }
      }
    }
    
    return null
    
  } catch (error) {
    console.error(`팀 통계 가져오기 실패 (팀 ID: ${teamId}):`, error)
    return null
  }
}

// 팀의 부상자 정보를 가져오는 함수 (현재 활성화된 부상만)
async function getTeamInjuries(teamId: number, leagueId: number, season: number) {
  try {
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
              return activeInjuries
            }
          }
        }
      }
    }
    
    return []
  } catch (error) {
    console.error(`부상 정보 가져오기 실패 (팀 ID: ${teamId}):`, error)
    return []
  }
}

// 팀의 최근 경기 폼을 가져오는 함수
async function getTeamForm(teamId: number, leagueId: number, season: number, last: number = 5) {
  try {
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
            return res.response
          }
        }
      }
    }
    
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function predictMatch(fixtureId: number, forceRefresh: boolean = false, predictionApiData?: any) {
  try {
    // 캐시된 예측 먼저 확인 (강제 새로고침이 아닌 경우)
    if (!forceRefresh) {
      const cached = await getCachedPrediction(fixtureId)
      if (cached) {
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
          }
        }
        
        return {
          textAnalysis: cachedData.ai_analysis || '캐시된 분석 결과를 불러올 수 없습니다.',
          chartData: cachedChartData
        }
      }
    }

    // predictionApiData가 있으면 /predictions 엔드포인트 데이터 사용 (차트와 동일한 데이터)
    // 없으면 기존 방식으로 개별 API 호출
    let home: any, away: any, matchDate: string, leagueId: number, season: number
    let homeStats: any, awayStats: any, homeForm: any, awayForm: any
    let homeInjuries: any, awayInjuries: any, h2h: any, odds: any
    let prompt: string

    if (predictionApiData) {
      // /predictions 엔드포인트 데이터 사용 (차트와 동일)
      const pd = predictionApiData
      home = pd.teams.home
      away = pd.teams.away
      homeStats = pd.teams.home.league || null
      awayStats = pd.teams.away.league || null
      homeInjuries = []
      awayInjuries = []

      // 경기 날짜는 별도로 가져와야 함
      const fixtureRes = await fetchFromFootballApi('fixtures', { id: fixtureId })
      const match = fixtureRes?.response?.[0]
      matchDate = match?.fixture?.date?.split('T')[0] || new Date().toISOString().split('T')[0]
      leagueId = match?.league?.id || 0
      season = getCurrentSeason(leagueId, matchDate)

      const hf = homeStats?.fixtures
      const af = awayStats?.fixtures
      const hg = homeStats?.goals
      const ag = awayStats?.goals

      // H2H 데이터 + 전적 미리 계산
      const h2hMatches = pd.h2h?.slice(0, 5) || []
      let h2hHomeWins = 0, h2hAwayWins = 0, h2hDraws = 0
      h2hMatches.forEach((m: any) => {
        if (m.teams.home.winner === true) {
          // 홈팀이 이긴 경우 - 우리 홈팀인지 확인
          if (m.teams.home.id === home.id) h2hHomeWins++
          else h2hAwayWins++
        } else if (m.teams.away.winner === true) {
          if (m.teams.away.id === home.id) h2hHomeWins++
          else h2hAwayWins++
        } else {
          h2hDraws++
        }
      })
      const h2hList = h2hMatches.map((m: any) =>
        `${m.teams.home.name} ${m.goals.home ?? '-'} - ${m.goals.away ?? '-'} ${m.teams.away.name}`
      ).join('\n') || '맞대결 데이터 없음'

      prompt = `
아래 제공된 통계 데이터만을 근거로 경기 분석글을 작성하세요.

[경기 정보]
- 홈팀: ${home.name}
- 어웨이팀: ${away.name}
- 날짜: ${matchDate}
- 승률 예측: 홈 ${pd.predictions.percent.home} / 무승부 ${pd.predictions.percent.draw} / 원정 ${pd.predictions.percent.away}

[홈팀 최근 5경기]
- 폼: ${home.last_5?.form || '?'}% | 공격: ${home.last_5?.att || '?'}% | 수비: ${home.last_5?.def || '?'}%
- 득점: ${home.last_5?.goals?.for?.total || '?'}골 (평균 ${home.last_5?.goals?.for?.average || '?'}) | 실점: ${home.last_5?.goals?.against?.total || '?'}골 (평균 ${home.last_5?.goals?.against?.average || '?'})

[홈팀 시즌 성적]
- 전체: ${hf?.played?.total ?? '?'}경기 ${hf?.wins?.total ?? '?'}승 ${hf?.draws?.total ?? '?'}무 ${hf?.loses?.total ?? '?'}패
- 홈: ${hf?.played?.home ?? '?'}경기 ${hf?.wins?.home ?? '?'}승 ${hf?.draws?.home ?? '?'}무 ${hf?.loses?.home ?? '?'}패
- 득점: 홈${hg?.for?.total?.home ?? '?'} 원정${hg?.for?.total?.away ?? '?'} 합계${hg?.for?.total?.total ?? '?'} (평균 ${hg?.for?.average?.total ?? '?'})
- 실점: 홈${hg?.against?.total?.home ?? '?'} 원정${hg?.against?.total?.away ?? '?'} 합계${hg?.against?.total?.total ?? '?'} (평균 ${hg?.against?.average?.total ?? '?'})

[어웨이팀 최근 5경기]
- 폼: ${away.last_5?.form || '?'}% | 공격: ${away.last_5?.att || '?'}% | 수비: ${away.last_5?.def || '?'}%
- 득점: ${away.last_5?.goals?.for?.total || '?'}골 (평균 ${away.last_5?.goals?.for?.average || '?'}) | 실점: ${away.last_5?.goals?.against?.total || '?'}골 (평균 ${away.last_5?.goals?.against?.average || '?'})

[어웨이팀 시즌 성적]
- 전체: ${af?.played?.total ?? '?'}경기 ${af?.wins?.total ?? '?'}승 ${af?.draws?.total ?? '?'}무 ${af?.loses?.total ?? '?'}패
- 원정: ${af?.played?.away ?? '?'}경기 ${af?.wins?.away ?? '?'}승 ${af?.draws?.away ?? '?'}무 ${af?.loses?.away ?? '?'}패
- 득점: 홈${ag?.for?.total?.home ?? '?'} 원정${ag?.for?.total?.away ?? '?'} 합계${ag?.for?.total?.total ?? '?'} (평균 ${ag?.for?.average?.total ?? '?'})
- 실점: 홈${ag?.against?.total?.home ?? '?'} 원정${ag?.against?.total?.away ?? '?'} 합계${ag?.against?.total?.total ?? '?'} (평균 ${ag?.against?.average?.total ?? '?'})

[팀 비교 지표]
- 경기력: 홈 ${pd.comparison.form.home} vs 원정 ${pd.comparison.form.away}
- 공격력: 홈 ${pd.comparison.att.home} vs 원정 ${pd.comparison.att.away}
- 수비력: 홈 ${pd.comparison.def.home} vs 원정 ${pd.comparison.def.away}
- 상대전적: 홈 ${pd.comparison.h2h.home} vs 원정 ${pd.comparison.h2h.away}
- 종합: 홈 ${pd.comparison.total.home} vs 원정 ${pd.comparison.total.away}

[최근 맞대결 (${h2hMatches.length}경기)]
- ${home.name} 기준 전적: ${h2hHomeWins}승 ${h2hDraws}무 ${h2hAwayWins}패
${h2hList}
`
      // predictionApiData 사용 시 h2h, odds 변수 설정
      h2h = { response: pd.h2h }
      odds = null
      homeForm = []
      awayForm = []

    } else {
      // 기존 방식: 개별 API 호출
      const fixtureRes = await fetchFromFootballApi('fixtures', { id: fixtureId })
      const match = fixtureRes?.response?.[0]
      if (!match) throw new Error('경기 정보 없음')

      home = match.teams.home
      away = match.teams.away
      matchDate = match.fixture.date.split('T')[0]
      leagueId = match.league.id
      season = getCurrentSeason(leagueId, matchDate)

      const results = await Promise.all([
        getTeamStats(home.id, leagueId, season),
        getTeamStats(away.id, leagueId, season),
        getTeamForm(home.id, leagueId, season),
        getTeamForm(away.id, leagueId, season),
        getTeamInjuries(home.id, leagueId, season),
        getTeamInjuries(away.id, leagueId, season),
        fetchFromFootballApi('fixtures/headtohead', { h2h: `${home.id}-${away.id}` }),
        fetchFromFootballApi('odds', { fixture: fixtureId })
      ])
      homeStats = results[0]
      awayStats = results[1]
      homeForm = results[2]
      awayForm = results[3]
      homeInjuries = results[4]
      awayInjuries = results[5]
      h2h = results[6]
      odds = results[7]

      const homeFormStr = homeForm?.slice(0, 5).map((fixture: any) => {
        const hg = fixture.goals?.home ?? 0
        const ag = fixture.goals?.away ?? 0
        const isHome = fixture.teams?.home?.id === home.id
        if (isHome) return hg > ag ? 'W' : hg < ag ? 'L' : 'D'
        else return ag > hg ? 'W' : ag < hg ? 'L' : 'D'
      }).join('') || 'N/A'

      const awayFormStr = awayForm?.slice(0, 5).map((fixture: any) => {
        const hg = fixture.goals?.home ?? 0
        const ag = fixture.goals?.away ?? 0
        const isHome = fixture.teams?.home?.id === away.id
        if (isHome) return hg > ag ? 'W' : hg < ag ? 'L' : 'D'
        else return ag > hg ? 'W' : ag < hg ? 'L' : 'D'
      }).join('') || 'N/A'

      const summarizeInjuries = (injuries: any[], teamName: string) => {
        if (!injuries || injuries.length === 0) return `${teamName}: 부상자 없음`
        const groups: Record<string, string[]> = { 골키퍼: [], 수비수: [], 미드필더: [], 공격수: [], 기타: [] }
        injuries.forEach((inj: any) => {
          const pos = inj.player?.position || ''
          const name = inj.player?.name || '알 수 없음'
          const reason = inj.player?.reason || ''
          const entry = reason ? `${name}(${reason})` : name
          if (pos.includes('Goalkeeper')) groups['골키퍼'].push(entry)
          else if (pos.includes('Defend') || pos.includes('Defence')) groups['수비수'].push(entry)
          else if (pos.includes('Midfield')) groups['미드필더'].push(entry)
          else if (pos.includes('Attack') || pos.includes('Forward')) groups['공격수'].push(entry)
          else groups['기타'].push(entry)
        })
        const parts = Object.entries(groups).filter(([, v]) => v.length > 0).map(([k, v]) => `${k}: ${v.join(', ')}`)
        return `${teamName} (${injuries.length}명 결장): ${parts.join(' / ')}`
      }

      prompt = `
아래 제공된 통계 데이터만을 근거로 경기 분석글을 작성하세요.

[경기 정보]
- 홈팀: ${home.name}
- 어웨이팀: ${away.name}
- 날짜: ${matchDate}
- 대회: ${match.league.name}

[홈팀 시즌 성적]
- 홈경기: ${homeStats?.fixtures?.played?.home ?? '?'}경기 ${homeStats?.fixtures?.wins?.home ?? '?'}승 ${homeStats?.fixtures?.draws?.home ?? '?'}무 ${homeStats?.fixtures?.loses?.home ?? '?'}패
- 홈 득실: ${homeStats?.goals?.for?.total?.home ?? '?'}득점 ${homeStats?.goals?.against?.total?.home ?? '?'}실점
- 전체: ${homeStats?.fixtures?.played?.total ?? '?'}경기 ${homeStats?.fixtures?.wins?.total ?? '?'}승 ${homeStats?.fixtures?.draws?.total ?? '?'}무 ${homeStats?.fixtures?.loses?.total ?? '?'}패
- 최근 5경기 폼: ${homeFormStr}

[어웨이팀 시즌 성적]
- 원정경기: ${awayStats?.fixtures?.played?.away ?? '?'}경기 ${awayStats?.fixtures?.wins?.away ?? '?'}승 ${awayStats?.fixtures?.draws?.away ?? '?'}무 ${awayStats?.fixtures?.loses?.away ?? '?'}패
- 원정 득실: ${awayStats?.goals?.for?.total?.away ?? '?'}득점 ${awayStats?.goals?.against?.total?.away ?? '?'}실점
- 전체: ${awayStats?.fixtures?.played?.total ?? '?'}경기 ${awayStats?.fixtures?.wins?.total ?? '?'}승 ${awayStats?.fixtures?.draws?.total ?? '?'}무 ${awayStats?.fixtures?.loses?.total ?? '?'}패
- 최근 5경기 폼: ${awayFormStr}

[최근 맞대결 (최대 5경기)]
${h2h?.response?.slice(0, 5)?.map((h: any) => `${h.teams.home.name} ${h.goals.home ?? '-'} - ${h.goals.away ?? '-'} ${h.teams.away.name}`).join('\n') || '맞대결 데이터 없음'}

[부상자 현황]
${summarizeInjuries(homeInjuries, home.name)}
${summarizeInjuries(awayInjuries, away.name)}

[배당률]
${odds?.response?.[0]?.bookmakers?.[0]?.bets?.find((b: any) => b.name === 'Match Winner')?.values?.map((v: any) => `${v.value}: ${v.odd}`).join(' / ') || '배당률 정보 없음'}
`
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-nano-2025-04-14',
      messages: [
        { role: 'system', content: `당신은 축구 데이터 분석가입니다. 아래 규칙을 반드시 지키세요:

1. 제공된 데이터에 있는 수치만 사용하세요. 데이터에 없는 숫자, 확률, 스코어를 절대 만들어내지 마세요.
2. 팀 이름은 반드시 한국에서 통용되는 한글 이름으로 쓰세요 (예: Arsenal→아스널, Liverpool→리버풀, Manchester City→맨체스터 시티, Chelsea→첼시, Tottenham→토트넘, Manchester United→맨체스터 유나이티드, Barcelona→바르셀로나, Real Madrid→레알 마드리드, Bayern Munich→바이에른 뮌헨, PSG→파리 생제르맹, Juventus→유벤투스, Inter→인테르, AC Milan→AC밀란, Napoli→나폴리, Borussia Dortmund→도르트문트, Union Berlin→우니온 베를린, Werder Bremen→베르더 브레멘, Bayer Leverkusen→레버쿠젠, RB Leipzig→라이프치히 등). 영어 팀명을 그대로 쓰지 마세요.
3. 리그 이름도 한글로 쓰세요 (Premier League→프리미어리그, La Liga→라리가, Bundesliga→분데스리가, Serie A→세리에A, Ligue 1→리그앙).
4. 선수 이름은 한국에서 통용되는 표기가 있으면 한글로, 없으면 영어 그대로 쓰세요.
5. 다음 표현을 절대 사용하지 마세요: "~할 것으로 보입니다", "~예상됩니다", "~될 것입니다", "~노력할 것입니다", "~만회하려 할 것입니다". 미래 예측이나 추측은 금지입니다. 오직 과거 데이터 팩트만 서술하세요.
6. 데이터에 없는 수치를 절대 생성하지 마세요. 맞대결 전적을 계산할 때 제공된 스코어를 하나하나 직접 세어서 정확히 계산하세요.
7. 배팅, 베팅, 도박, 투자 관련 표현은 절대 금지입니다.
8. 반드시 존댓말(~습니다, ~됩니다, ~있습니다)을 사용하세요. 반말(~있다, ~보인다, ~했다) 절대 금지.
9. 시즌 폼 원본 문자열(WLLWDLWLDD...)을 그대로 쓰지 마세요. "최근 5경기 중 2승 1무 2패" 같은 요약으로 쓰세요.
10. 한 문장이 너무 길지 않게, 2~3문장마다 줄바꿈하세요.
11. 글 구조를 반드시 아래처럼 소제목과 문단으로 나누세요. 소제목은 반드시 별도 줄에 쓰고 내용과 분리하세요:

**경기 개요**
양 팀 소개와 승률 예측 데이터 요약. 2~3문장.

**홈팀 분석**
시즌 성적, 홈 경기 득실점, 최근 폼 분석. 2~3문장.

**어웨이팀 분석**
시즌 성적, 원정 경기 득실점, 최근 폼 분석. 2~3문장.

**맞대결 & 관전 포인트**
상대전적 요약, 핵심 관전 포인트. 2~3문장.

12. 분량은 500~700자 정도로 작성하세요.` },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4
    })

    const aiAnalysis = completion.choices[0].message.content || '분석 결과를 가져올 수 없습니다.'

    // 확률 계산: predictionApiData가 있으면 그 데이터 사용, 없으면 배당률 역산
    let homeWinPct = 40, drawPct = 30, awayWinPct = 30
    if (predictionApiData?.predictions?.percent) {
      homeWinPct = parseInt(predictionApiData.predictions.percent.home) || 40
      drawPct = parseInt(predictionApiData.predictions.percent.draw) || 30
      awayWinPct = parseInt(predictionApiData.predictions.percent.away) || 30
    } else if (odds) {
      const oddsValues = odds?.response?.[0]?.bookmakers?.[0]?.bets?.find((b: any) => b.name === 'Match Winner')?.values
      if (oddsValues) {
        const homeOdd = parseFloat(oddsValues.find((v: any) => v.value === 'Home')?.odd || '0')
        const drawOdd = parseFloat(oddsValues.find((v: any) => v.value === 'Draw')?.odd || '0')
        const awayOdd = parseFloat(oddsValues.find((v: any) => v.value === 'Away')?.odd || '0')
        if (homeOdd > 0 && drawOdd > 0 && awayOdd > 0) {
          const totalProb = (1/homeOdd) + (1/drawOdd) + (1/awayOdd)
          homeWinPct = Math.round((1/homeOdd) / totalProb * 100)
          drawPct = Math.round((1/drawOdd) / totalProb * 100)
          awayWinPct = 100 - homeWinPct - drawPct
        }
      }
    }

    const predictionSummary: PredictionSummary = {
      home_win_percentage: homeWinPct,
      draw_percentage: drawPct,
      away_win_percentage: awayWinPct,
      predicted_score: '0-0',
      confidence_level: (homeStats || predictionApiData) ? 'high' : 'medium'
    }

    const matchContext: MatchContext = {
      h2h_summary: h2h?.response?.slice(0, 3)?.map((h: any) =>
        `${h.teams.home.name} ${h.goals.home ?? '-'} - ${h.goals.away ?? '-'} ${h.teams.away.name}`
      ).join(', ') || '맞대결 기록 없음',
      injury_impact: `홈팀 ${homeInjuries?.length || 0}명, 어웨이팀 ${awayInjuries?.length || 0}명 부상`,
      form_analysis: predictionApiData
        ? `홈팀 폼: ${predictionApiData.teams.home.last_5?.form || 'N/A'}%, 어웨이팀 폼: ${predictionApiData.teams.away.last_5?.form || 'N/A'}%`
        : `홈팀 최근 폼: ${homeForm?.slice(0, 5).map(() => 'W/L/D').join('') || 'N/A'}, 어웨이팀: ${awayForm?.slice(0, 5).map(() => 'W/L/D').join('') || 'N/A'}`,
      betting_odds: odds?.response?.[0]?.bookmakers?.[0]?.bets?.find((b: any) => b.name === 'Match Winner')?.values || null
    }

    const dataSources: DataSources = {
      home_stats_league: predictionApiData ? 'predictions-api' : (homeStats?.league?.name || '정보 없음'),
      away_stats_league: predictionApiData ? 'predictions-api' : (awayStats?.league?.name || '정보 없음'),
      stats_season: season,
      api_calls_made: predictionApiData ? ['predictions', 'fixtures'] : ['fixtures', 'teams/statistics', 'fixtures/form', 'injuries', 'fixtures/headtohead', 'odds']
    }

    // AI 분석 결과 후처리
    const processedAnalysis = aiAnalysis
      .replace(/배팅[^.]*\./g, '')
      .replace(/도박[^.]*\./g, '')
      .replace(/베팅[^.]*\./g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    // 예측 결과를 데이터베이스에 저장
    const fixtureForCache = predictionApiData
      ? { teams: { home, away }, league: { id: leagueId, name: '' }, fixture: { date: matchDate } }
      : (await fetchFromFootballApi('fixtures', { id: fixtureId }))?.response?.[0]

    if (fixtureForCache) {
      await savePredictionToCache(
        fixtureId,
        fixtureForCache,
        processedAnalysis,
        homeStats,
        awayStats,
        matchContext,
        dataSources,
        predictionSummary,
        predictionApiData ? 2 : 8,
        0.02
      )
    }

    // 차트 데이터 생성
    const chartData = generateChartData(
      home,
      away,
      predictionApiData ? homeStats : homeStats,
      predictionApiData ? awayStats : awayStats,
      homeForm,
      awayForm,
      homeInjuries,
      awayInjuries,
      odds
    )

    return {
      textAnalysis: processedAnalysis,
      chartData: chartData
    }

  } catch (err) {
    console.error('승부 예측 실패:', err)
    return `예측에 실패했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`
  }
}
