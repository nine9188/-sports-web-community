'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { TeamSearchResult } from '../types'
import { getTeamMatches, type TeamMatch } from '../actions/teamMatches'
import { trackSearchResultClick } from '../actions/searchLogs'

interface TeamSearchResultsProps {
  teams: TeamSearchResult[]
  hasMore: boolean
  isLoading?: boolean
  onLoadMore?: () => void
  onTeamSelect?: (team: TeamSearchResult) => void
  showMoreButton?: boolean // 더보기 버튼 표시 여부
  currentType?: 'all' | 'posts' | 'comments' | 'teams'
  query?: string
  totalCount?: number
}

export default function TeamSearchResults({
  teams,
  hasMore,
  isLoading = false,
  onLoadMore,
  onTeamSelect,
  showMoreButton = true,
  currentType: propCurrentType = 'teams',
  query: propQuery = '',
  totalCount = 0
}: TeamSearchResultsProps) {
  const searchParams = useSearchParams()
  const query = propQuery || searchParams?.get('q') || ''
  const currentType = propCurrentType || searchParams?.get('type') || 'all'
  
  // 확장된 팀 상태 관리
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null)
  const [teamMatches, setTeamMatches] = useState<TeamMatch[]>([])
  const [matchesLoading, setMatchesLoading] = useState(false)

  const handleTeamClick = async (team: TeamSearchResult) => {
    // 팀 클릭 추적
    try {
      await trackSearchResultClick({
        search_query: query,
        clicked_result_id: team.team_id.toString(),
        clicked_result_type: 'team'
      })
    } catch (error) {
      console.error('팀 클릭 추적 실패:', error)
    }

    if (onTeamSelect) {
      onTeamSelect(team)
      return
    }

    // 이미 확장된 팀을 다시 클릭하면 접기
    if (expandedTeamId === team.team_id) {
      setExpandedTeamId(null)
      setTeamMatches([])
      return
    }

    // 새로운 팀 확장
    setExpandedTeamId(team.team_id)
    setMatchesLoading(true)
    setTeamMatches([])

    try {
      const result = await getTeamMatches(team.team_id, 5) // 최근 5경기만
      if (result.success) {
        setTeamMatches(result.data)
      }
    } catch (error) {
      console.error('매치 정보 로딩 실패:', error)
    } finally {
      setMatchesLoading(false)
    }
  }
  
  if (isLoading && teams.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-2 text-gray-500">팀 정보 로딩 중...</p>
      </div>
    )
  }

  if (teams.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">검색 결과가 없습니다</p>
        <p className="text-gray-400 text-sm mt-1">다른 키워드로 검색해보세요</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 팀 테이블 */}
      <div className="overflow-hidden rounded-lg">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                팀
              </th>
              <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                리그
              </th>
              <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                국가
              </th>
              <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                홈구장
              </th>
              <th className="px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                코드
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {teams.map((team) => (
              <TeamRowWithMatches 
                key={team.team_id} 
                team={team} 
                onSelect={handleTeamClick}
                isExpanded={expandedTeamId === team.team_id}
                matches={expandedTeamId === team.team_id ? teamMatches : []}
                matchesLoading={matchesLoading && expandedTeamId === team.team_id}
              />
            ))}
          </tbody>
          {/* 더보기 버튼을 테이블 푸터로 추가 */}
          {showMoreButton && currentType === 'all' && teams.length >= 5 && (
            <tfoot>
              <tr>
                <td colSpan={2} className="px-4 py-3 border-t bg-gray-50 sm:hidden">
                  <Link
                    href={`/search?q=${encodeURIComponent(query)}&type=teams`}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    더 많은 팀 보기 ({totalCount}개) →
                  </Link>
                </td>
                <td colSpan={5} className="hidden sm:table-cell px-6 py-3 border-t bg-gray-50">
                  <Link
                    href={`/search?q=${encodeURIComponent(query)}&type=teams`}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    더 많은 팀 보기 ({totalCount}개) →
                  </Link>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* 기존 더보기 버튼 (팀 탭에서만 사용) */}
      {currentType === 'teams' && hasMore && (
        <div className="text-center pt-6">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className={`
              px-6 py-3 rounded-lg font-medium transition-colors
              ${isLoading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }
            `}
          >
            {isLoading ? '로딩중...' : '더보기'}
          </button>
        </div>
      )}
    </div>
  )
}

// 매치 정보를 포함한 팀 행 컴포넌트
function TeamRowWithMatches({ 
  team, 
  onSelect,
  isExpanded,
  matches,
  matchesLoading
}: { 
  team: TeamSearchResult
  onSelect?: (team: TeamSearchResult) => void
  isExpanded: boolean
  matches: TeamMatch[]
  matchesLoading: boolean
}) {
  const handleClick = () => {
    if (onSelect) {
      onSelect(team)
    }
  }

  return (
    <>
      {/* 팀 정보 행 */}
      <tr 
        className={`
          hover:bg-gray-50 transition-colors cursor-pointer
          ${isExpanded ? 'bg-blue-50' : ''}
        `}
        onClick={handleClick}
      >
        {/* 팀 정보 */}
        <td className="px-2 sm:px-4 py-4">
          <div className="flex items-center space-x-2 sm:space-x-3">
            {team.logo_url ? (
              <Image
                src={team.logo_url}
                alt={`${team.display_name} 로고`}
                width={28}
                height={28}
                className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
              />
            ) : (
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-gray-500 text-xs font-bold">
                  {team.code || team.name.charAt(0)}
                </span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-900 flex items-center text-xs sm:text-sm">
                <span className="truncate">{team.display_name}</span>
                {/* 확장 아이콘 */}
                <svg 
                  className={`ml-1 sm:ml-2 w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {/* 영어명이나 짧은 이름 표시 */}
              {((team.name_en && team.name_en !== team.display_name) || 
                (team.short_name && team.short_name !== team.display_name)) && (
                <div className="text-xs text-gray-500 truncate sm:hidden">
                  {team.name_en || team.short_name}
                </div>
              )}
              {/* 모바일에서 리그 정보 표시 */}
              <div className="text-xs text-gray-500 truncate sm:hidden">
                {team.league_name_ko}
              </div>
            </div>
          </div>
        </td>

        {/* 리그 */}
        <td className="hidden sm:table-cell px-4 py-4 text-sm text-gray-900">
          <div className="truncate max-w-32" title={team.league_name_ko}>
            {team.league_name_ko}
          </div>
        </td>

        {/* 국가 */}
        <td className="hidden md:table-cell px-4 py-4 text-sm text-gray-900">
          {team.country}
        </td>

        {/* 홈구장 */}
        <td className="hidden lg:table-cell px-4 py-4 text-sm text-gray-900">
          <div className="max-w-40">
            {team.venue_name && (
              <div className="font-medium truncate" title={team.venue_name}>
                {team.venue_name}
              </div>
            )}
            {team.venue_city && (
              <div className="text-gray-500 truncate" title={team.venue_city}>
                {team.venue_city}
              </div>
            )}
          </div>
        </td>

        {/* 코드 */}
        <td className="px-2 sm:px-4 py-4 text-center">
          {team.code ? (
            <span className="font-mono text-xs bg-gray-100 px-1.5 sm:px-2 py-1 rounded">
              {team.code}
            </span>
          ) : (
            <span className="text-gray-400 text-xs sm:text-sm">-</span>
          )}
        </td>
      </tr>

      {/* 매치 정보 확장 행 */}
      {isExpanded && (
        <tr>
          <td colSpan={2} className="px-4 py-4 bg-gray-50 border-t sm:hidden">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 text-sm">최근 경기</h4>
              
              {matchesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600">경기 정보 로딩중...</span>
                </div>
              ) : matches.length > 0 ? (
                <div className="space-y-2">
                  {matches.slice(0, 3).map((match) => (
                    <MatchItem key={match.fixture.id} match={match} teamId={team.team_id} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-2">경기 정보를 찾을 수 없습니다.</p>
              )}
            </div>
          </td>
          <td colSpan={5} className="hidden sm:table-cell px-4 py-4 bg-gray-50 border-t">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 text-sm">최근 경기</h4>
              
              {matchesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600">경기 정보 로딩중...</span>
                </div>
              ) : matches.length > 0 ? (
                <div className="space-y-2">
                  {matches.slice(0, 3).map((match) => (
                    <MatchItem key={match.fixture.id} match={match} teamId={team.team_id} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-2">경기 정보를 찾을 수 없습니다.</p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// 개별 매치 아이템 컴포넌트
function MatchItem({ match, teamId }: { match: TeamMatch; teamId: number }) {
  const isHome = match.teams.home.id === teamId
  const opponent = isHome ? match.teams.away : match.teams.home
  const teamScore = isHome ? match.goals.home : match.goals.away
  const opponentScore = isHome ? match.goals.away : match.goals.home
  
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
    <div className="flex items-center justify-between p-3 bg-white rounded border text-sm">
      <div className="flex items-center space-x-3">
        {/* 상대팀 로고 */}
        <Image
          src={opponent.logo}
          alt={`${opponent.name} 로고`}
          width={20}
          height={20}
          className="w-5 h-5 object-contain"
        />
        <div>
          <div className="font-medium text-gray-900">
            vs {opponent.name}
          </div>
          <div className="text-xs text-gray-500">
            {match.league.name} • {formatDate(match.fixture.date)}
          </div>
        </div>
      </div>
      
      <div className="text-right">
        {match.fixture.status.short === 'FT' ? (
          <div className="font-medium">
            {teamScore} - {opponentScore}
          </div>
        ) : (
          <div className="text-sm text-gray-600">
            {getMatchStatus()}
          </div>
        )}
      </div>
    </div>
  )
}

 