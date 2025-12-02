'use client'

import { useState, useEffect } from 'react'
import { syncLeaguePlayers, getLeaguePlayersStats } from './actions'

interface Team {
  team_id: number
  name: string
  name_ko: string | null
  logo_url: string | null
}

interface League {
  league_id: number
  league_name: string
  league_name_ko: string | null
  league_logo_url: string | null
  teams: Team[]
}

interface LeagueSquadViewerProps {
  league: League
}

interface LeagueStats {
  totalPlayers: number
  teamsWithPlayers: number
  totalTeams: number
  lastSync: string | null
}

export function LeagueSquadViewer({ league }: LeagueSquadViewerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [stats, setStats] = useState<LeagueStats | null>(null)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    count: number
  } | null>(null)

  // 컴포넌트 마운트 시 통계 조회
  useEffect(() => {
    loadStats()
  }, [league.league_id])

  const loadStats = async () => {
    setIsLoadingStats(true)
    try {
      const leagueStats = await getLeaguePlayersStats(league.league_id)
      setStats(leagueStats)
    } catch (error) {
      console.error('통계 조회 실패:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  const handleSyncLeague = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    setResult(null)

    try {
      const syncResult = await syncLeaguePlayers(league.league_id, league.league_name)
      setResult(syncResult)
      
      // 동기화 성공 시 통계 다시 조회
      if (syncResult.success) {
        await loadStats()
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        count: 0
      })
    } finally {
      setIsLoading(false)
    }
  }

  const hasData = stats && stats.totalPlayers > 0
  const isComplete = stats && stats.teamsWithPlayers === stats.totalTeams

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="bg-gradient-to-r from-gray-50 to-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {league.league_logo_url && (
              <img 
                src={league.league_logo_url} 
                alt={league.league_name}
                className="w-10 h-10 object-contain"
              />
            )}
            <div>
              <h3 className="text-lg font-semibold">
                {league.league_name_ko || league.league_name}
              </h3>
              <div className="text-sm text-gray-600">
                {league.teams.length}개 팀
              </div>
              
              {/* DB 저장 상태 표시 */}
              {isLoadingStats ? (
                <div className="text-xs text-gray-400 mt-1">통계 조회 중...</div>
              ) : hasData ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${
                    isComplete 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {isComplete ? (
                      <>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        완료
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        부분
                      </>
                    )}
                  </span>
                  <span className="text-xs text-gray-600">
                    {stats.totalPlayers}명 선수 ({stats.teamsWithPlayers}/{stats.totalTeams} 팀)
                  </span>
                </div>
              ) : (
                <div className="text-xs text-gray-400 mt-1">
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    데이터 없음
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleSyncLeague}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : hasData
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                조회 중...
              </span>
            ) : hasData ? (
              '재동기화'
            ) : (
              '리그 전체 선수 조회'
            )}
          </button>
        </div>

        {/* 결과 표시 */}
        {result && (
          <div
            className={`mt-4 p-3 rounded-lg ${
              result.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-start gap-2">
              {result.success ? (
                <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.message}
                </p>
                {result.success && result.count > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    총 {result.count}명의 선수 데이터가 저장되었습니다.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 팀 목록 (접힌 상태로) */}
      <details className="border-t">
        <summary className="px-6 py-3 cursor-pointer hover:bg-gray-50 text-sm text-gray-600">
          팀 목록 보기 ({league.teams.length}개)
        </summary>
        <div className="px-6 py-4 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {league.teams.map((team) => (
              <div
                key={team.team_id}
                className="flex items-center gap-2 p-2 bg-white rounded border text-sm"
              >
                {team.logo_url && (
                  <img
                    src={team.logo_url}
                    alt={team.name}
                    className="w-6 h-6 object-contain"
                  />
                )}
                <span className="truncate">{team.name_ko || team.name}</span>
              </div>
            ))}
          </div>
        </div>
      </details>
    </div>
  )
}

