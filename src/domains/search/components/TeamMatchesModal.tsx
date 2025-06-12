'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { getTeamMatches, type TeamMatch } from '../actions/teamMatches'
import type { TeamSearchResult } from '../types'

interface TeamMatchesModalProps {
  team: TeamSearchResult | null
  isOpen: boolean
  onClose: () => void
}

export default function TeamMatchesModal({ team, isOpen, onClose }: TeamMatchesModalProps) {
  const [matches, setMatches] = useState<TeamMatch[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMatches = useCallback(async () => {
    if (!team) return

    setLoading(true)
    setError(null)

    try {
      const result = await getTeamMatches(team.team_id, 10)
      
      if (result.success) {
        setMatches(result.data)
      } else {
        setError(result.error || '경기 정보를 불러올 수 없습니다')
      }
    } catch {
      setError('경기 정보를 불러오는 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }, [team])

  useEffect(() => {
    if (isOpen && team) {
      fetchMatches()
    }
  }, [isOpen, team, fetchMatches])

  if (!isOpen || !team) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            {team.logo_url && (
              <Image
                src={team.logo_url}
                alt={`${team.display_name} 로고`}
                width={40}
                height={40}
                className="w-10 h-10 object-contain"
              />
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900">{team.display_name}</h2>
              <p className="text-sm text-gray-500">{team.league_name_ko} • {team.country}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-500">경기 정보 로딩 중...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
              <button
                onClick={fetchMatches}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                다시 시도
              </button>
            </div>
          )}

          {!loading && !error && matches.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">경기 정보가 없습니다</p>
            </div>
          )}

          {!loading && !error && matches.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 & 예정 경기</h3>
              
              {matches.map((match) => (
                <MatchCard key={match.fixture.id} match={match} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 개별 경기 카드 컴포넌트
function MatchCard({ match }: { match: TeamMatch }) {
  const matchDate = new Date(match.fixture.date)
  const isFinished = match.fixture.status.short === 'FT'
  const isLive = ['1H', '2H', 'HT', 'ET', 'P'].includes(match.fixture.status.short)
  const isPending = match.fixture.status.short === 'NS'

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
      {/* 경기 상태 및 날짜 */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-500">
          {match.league.name} • {match.league.round}
        </div>
        <div className="flex items-center space-x-2">
          {isLive && (
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
              LIVE
            </span>
          )}
          <span className="text-sm text-gray-500">
            {formatDate(matchDate)} {formatTime(matchDate)}
          </span>
        </div>
      </div>

      {/* 팀 정보 및 스코어 */}
      <div className="flex items-center justify-between">
        {/* 홈팀 */}
        <div className="flex items-center space-x-3 flex-1">
          <Image
            src={match.teams.home.logo}
            alt={match.teams.home.name}
            width={32}
            height={32}
            className="w-8 h-8 object-contain"
          />
          <span className="font-medium text-gray-900">{match.teams.home.name}</span>
        </div>

        {/* 스코어 */}
        <div className="px-4 py-2 bg-gray-100 rounded-lg min-w-[80px] text-center">
          {isFinished || isLive ? (
            <span className="font-bold text-lg">
              {match.goals.home} - {match.goals.away}
            </span>
          ) : isPending ? (
            <span className="text-gray-500 text-sm">VS</span>
          ) : (
            <span className="text-gray-500 text-sm">{match.fixture.status.short}</span>
          )}
        </div>

        {/* 어웨이팀 */}
        <div className="flex items-center space-x-3 flex-1 justify-end">
          <span className="font-medium text-gray-900">{match.teams.away.name}</span>
          <Image
            src={match.teams.away.logo}
            alt={match.teams.away.name}
            width={32}
            height={32}
            className="w-8 h-8 object-contain"
          />
        </div>
      </div>

      {/* 경기장 정보 */}
      {match.fixture.venue.name && (
        <div className="mt-2 text-sm text-gray-500 text-center">
          📍 {match.fixture.venue.name}
          {match.fixture.venue.city && `, ${match.fixture.venue.city}`}
        </div>
      )}
    </div>
  )
} 