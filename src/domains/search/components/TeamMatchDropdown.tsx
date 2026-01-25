'use client'

import Image from 'next/image'
import { useState, useCallback } from 'react'
import type { TeamSearchResult } from '../types'
// 통합된 함수 사용 (search/actions/teamMatches.ts 대신)
import { getTeamMatchesRecent, type Match } from '@/domains/livescore/actions/teams/matches'
import { getLeagueName } from '@/domains/livescore/constants/league-mappings'
import { getTeamById } from '@/domains/livescore/constants/teams'
import Spinner from '@/shared/components/Spinner';
import { Button } from '@/shared/components/ui';

// 캐시 유효성 검사 (5분)
const CACHE_DURATION = 5 * 60 * 1000 // 5분

// 팀 매치 캐시 타입
interface TeamMatchCache {
  [teamId: number]: {
    data: Match[]
    timestamp: number
    loading: boolean
  }
}

interface TeamMatchDropdownButtonProps {
  team: TeamSearchResult
  isExpanded: boolean
  onToggle: (team: TeamSearchResult) => void
}

interface TeamMatchExpandedRowProps {
  team: TeamSearchResult
  isExpanded: boolean
  matches: Match[]
  loading: boolean
}

// 드롭다운 토글 버튼 컴포넌트
export function TeamMatchDropdownButton({
  team,
  isExpanded,
  onToggle
}: TeamMatchDropdownButtonProps) {
  // 팀 매치 캐시 (5분간 유효)
  const [teamMatchCache, setTeamMatchCache] = useState<TeamMatchCache>({})
  
  const isCacheValid = useCallback((timestamp: number) => {
    return Date.now() - timestamp < CACHE_DURATION
  }, [])

  // 캐시된 데이터 가져오기
  const getCachedMatches = useCallback((teamId: number) => {
    const cached = teamMatchCache[teamId]
    if (cached && isCacheValid(cached.timestamp)) {
      return cached.data
    }
    return null
  }, [teamMatchCache, isCacheValid])

  // 로딩 상태 확인
  const isTeamLoading = useCallback((teamId: number) => {
    return teamMatchCache[teamId]?.loading || false
  }, [teamMatchCache])

  const handleToggle = useCallback(async () => {
    // 토글 상태 변경
    onToggle(team)

    // 이미 확장된 상태에서 다시 클릭하면 접기만 하고 리턴
    if (isExpanded) {
      return
    }

    // 캐시된 데이터가 있으면 사용
    const cachedData = getCachedMatches(team.team_id)
    if (cachedData) {
      return // 캐시된 데이터 사용, API 호출 없음
    }

    // 이미 로딩 중이면 중복 호출 방지
    if (isTeamLoading(team.team_id)) {
      return
    }

    // 로딩 상태 설정
    setTeamMatchCache(prev => ({
      ...prev,
      [team.team_id]: {
        data: [],
        timestamp: Date.now(),
        loading: true
      }
    }))

    try {
      const result = await getTeamMatchesRecent(team.team_id, 5) // 최근 5경기만

      if (result.success && result.data) {
        // 캐시에 데이터 저장
        setTeamMatchCache(prev => ({
          ...prev,
          [team.team_id]: {
            data: result.data,
            timestamp: Date.now(),
            loading: false
          }
        }))
      } else {
        // 에러 시 로딩 상태만 해제
        setTeamMatchCache(prev => ({
          ...prev,
          [team.team_id]: {
            data: [],
            timestamp: Date.now(),
            loading: false
          }
        }))
      }
    } catch (error) {
      console.error('매치 정보 로딩 실패:', error)
      // 에러 시 로딩 상태만 해제
      setTeamMatchCache(prev => ({
        ...prev,
        [team.team_id]: {
          data: [],
          timestamp: Date.now(),
          loading: false
        }
      }))
    }
  }, [team, isExpanded, onToggle, getCachedMatches, isTeamLoading])

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className="ml-1 sm:ml-2 p-1 h-auto w-auto flex-shrink-0 text-gray-700 dark:text-gray-300"
      title={isExpanded ? '경기 정보 숨기기' : '경기 정보 보기'}
    >
      <svg
        className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </Button>
  )
}

// 매치 정보 확장 행 컴포넌트
export function TeamMatchExpandedRow({
  team,
  isExpanded,
  matches,
  loading
}: TeamMatchExpandedRowProps) {
  if (!isExpanded) return null

  return (
    <tr key={`${team.team_id}-matches`}>
      <td colSpan={1} className="p-0 bg-[#F5F5F5] dark:bg-[#262626] border-t border-black/5 dark:border-white/10 sm:hidden">
        <div className="p-3 space-y-3 w-full">
          <h4 className="font-medium text-gray-900 dark:text-[#F0F0F0] text-sm">최근 경기</h4>

          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Spinner size="sm" />
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">로딩중...</span>
            </div>
          ) : matches.length > 0 ? (
            <div className="space-y-2 w-full">
              {matches.slice(0, 5).map((match) => (
                <MatchItem key={match.fixture.id} match={match} teamId={team.team_id} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-2">경기 정보를 찾을 수 없습니다.</p>
          )}
        </div>
      </td>
      <td colSpan={5} className="hidden sm:table-cell px-4 py-4 bg-[#F5F5F5] dark:bg-[#262626] border-t border-black/5 dark:border-white/10">
        <div className="space-y-3 w-full">
          <h4 className="font-medium text-gray-900 dark:text-[#F0F0F0] text-sm">최근 경기</h4>

          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Spinner size="md" />
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">경기 정보 로딩중...</span>
            </div>
          ) : matches.length > 0 ? (
            <div className="space-y-2 w-full">
              {matches.slice(0, 5).map((match) => (
                <MatchItem key={match.fixture.id} match={match} teamId={team.team_id} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-2">경기 정보를 찾을 수 없습니다.</p>
          )}
        </div>
      </td>
    </tr>
  )
}

// 기본 export는 버튼 컴포넌트
export default TeamMatchDropdownButton

// 개별 매치 아이템 컴포넌트
function MatchItem({ match, teamId }: { match: Match; teamId: number }) {
  const isHome = match.teams.home.id === teamId
  const opponent = isHome ? match.teams.away : match.teams.home
  const teamScore = isHome ? match.goals.home : match.goals.away
  const opponentScore = isHome ? match.goals.away : match.goals.home
  const localizedLeagueName = getLeagueName(match.league.id) || match.league.name
  const mappedOpponent = getTeamById(opponent.id)
  const opponentDisplayName = mappedOpponent?.name_ko || opponent.name
  
  // 경기 상태에 따른 표시
  const getMatchStatus = () => {
    const status = match.fixture.status.short
    if (status === 'FT') return '종료'
    if (status === 'NS') return '예정'
    if (status === 'LIVE' || status === '1H' || status === '2H') return '진행중'
    return status
  }

  // 경기 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return '오늘'
    if (diffDays === 1) return '내일'
    if (diffDays === -1) return '어제'
    
    return date.toLocaleDateString('ko-KR', { 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    })
  }

  return (
    <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10">
      {/* 모바일 레이아웃 */}
      <div className="sm:hidden p-2.5">
        <div className="flex items-start justify-between mb-1.5">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <Image
              src={opponent.logo}
              alt={`${opponent.name} 로고`}
              width={18}
              height={18}
              className="w-4.5 h-4.5 object-contain flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-900 dark:text-[#F0F0F0] text-sm truncate">
                vs {opponentDisplayName}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {localizedLeagueName}
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-3">
            {match.fixture.status.short === 'FT' ? (
              <div className="font-bold text-sm text-gray-900 dark:text-[#F0F0F0]">
                {teamScore} - {opponentScore}
              </div>
            ) : (
              <div className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                {getMatchStatus()}
              </div>
            )}
          </div>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 pl-6">
          {formatDate(match.fixture.date)}
        </div>
      </div>

      {/* 데스크탑 레이아웃 */}
      <div className="hidden sm:flex items-center justify-between p-3 text-sm">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <Image
            src={opponent.logo}
            alt={`${opponent.name} 로고`}
            width={20}
            height={20}
            className="w-5 h-5 object-contain flex-shrink-0"
          />
          <div className="min-w-0">
            <div className="font-medium text-gray-900 dark:text-[#F0F0F0] truncate">
              vs {opponentDisplayName}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {localizedLeagueName} • {formatDate(match.fixture.date)}
            </div>
          </div>
        </div>

        <div className="text-right flex-shrink-0 ml-3">
          {match.fixture.status.short === 'FT' ? (
            <div className="font-medium text-gray-900 dark:text-[#F0F0F0]">
              {teamScore} - {opponentScore}
            </div>
          ) : (
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {getMatchStatus()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 