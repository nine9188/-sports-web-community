'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useCallback, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import type { TeamSearchResult } from '../types'
import { trackSearchResultClick } from '../actions/searchLogs'
import { getTeamMatches, type TeamMatch } from '../actions/teamMatches'
import TeamMatchDropdownButton, { TeamMatchExpandedRow } from './TeamMatchDropdown'
import Spinner from '@/shared/components/Spinner';

// 캐시 유효성 검사 (5분)
const CACHE_DURATION = 5 * 60 * 1000 // 5분

// 팀 매치 캐시 타입
interface TeamMatchCache {
  [teamId: number]: {
    data: TeamMatch[]
    timestamp: number
    loading: boolean
  }
}

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
  pagination?: {
    currentPage: number
    totalItems: number
    itemsPerPage: number
  }
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
  totalCount = 0,
  pagination
}: TeamSearchResultsProps) {
  const searchParams = useSearchParams()
  const query = propQuery || searchParams?.get('q') || ''
  const currentType = propCurrentType || searchParams?.get('type') || 'all'
  
  // 확장된 팀 상태 관리
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null)
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

  const handleTeamToggle = useCallback(async (team: TeamSearchResult) => {
    // onTeamSelect가 있으면 (모달이나 선택 용도) 콜백 실행
    if (onTeamSelect) {
      onTeamSelect(team)
      return
    }

    // 드롭다운 토글 (로그 기록 없음)
    // 이미 확장된 팀을 다시 클릭하면 접기
    if (expandedTeamId === team.team_id) {
      setExpandedTeamId(null)
      return
    }

    // 새로운 팀 확장
    setExpandedTeamId(team.team_id)

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
      const result = await getTeamMatches(team.team_id, 5) // 최근 5경기만
      
      if (result.success) {
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
  }, [onTeamSelect, expandedTeamId, getCachedMatches, isTeamLoading])

  // 현재 확장된 팀의 매치 데이터
  const currentTeamMatches = useMemo(() => {
    if (!expandedTeamId) return []
    return getCachedMatches(expandedTeamId) || []
  }, [expandedTeamId, getCachedMatches])

  // 현재 확장된 팀의 로딩 상태
  const currentTeamLoading = useMemo(() => {
    if (!expandedTeamId) return false
    return isTeamLoading(expandedTeamId)
  }, [expandedTeamId, isTeamLoading])
  
  if (isLoading && teams.length === 0) {
    return (
      <div className="text-center py-8">
        <Spinner size="lg" />
        <p className="mt-2 text-gray-500 dark:text-gray-400">팀 정보 로딩 중...</p>
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
      {/* 팀 테이블: 외부 카드 래퍼가 테두리/그림자를 가지므로 내부는 overflow만 처리 */}
      <div className="overflow-hidden rounded-lg">
        {/* 헤더 */}
        <div className="px-4 py-3 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/7 dark:border-white/10">
          <h3 className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">
            팀 ({pagination?.totalItems || totalCount || teams.length}개)
          </h3>
        </div>

        <div className="overflow-x-hidden">
          <table className="w-full bg-white dark:bg-[#1D1D1D] border-0 dark:border-0 table-fixed">
            <thead className="bg-[#F5F5F5] dark:bg-[#262626]">
              <tr>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-full sm:w-auto">
                  팀 정보
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
                <th className="hidden sm:table-cell px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16 sm:w-20">
                  코드
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/10">
              {teams.map((team) => (
                <TeamRowWithMatches 
                  key={team.team_id} 
                  team={team} 
                  onToggle={handleTeamToggle}
                  isExpanded={expandedTeamId === team.team_id}
                  matches={currentTeamMatches}
                  matchesLoading={currentTeamLoading}
                />
              ))}
            </tbody>
          {/* 요약 문구 (teams 탭 전용) */}
          {pagination && (propCurrentType === 'teams' || currentType === 'teams') && (
            <tfoot>
              <tr>
                <td colSpan={1} className="px-4 py-3 border-t border-black/7 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] sm:hidden">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    총 <span className="font-medium">{pagination.totalItems}</span>개 중{' '}
                    <span className="font-medium">{(pagination.currentPage - 1) * pagination.itemsPerPage + 1}</span>-
                    <span className="font-medium">{Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}</span>개 표시
                  </p>
                </td>
                <td colSpan={5} className="hidden sm:table-cell px-6 py-3 border-t border-black/7 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    총 <span className="font-medium">{pagination.totalItems}</span>개 중{' '}
                    <span className="font-medium">{(pagination.currentPage - 1) * pagination.itemsPerPage + 1}</span>-
                    <span className="font-medium">{Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}</span>개 표시
                  </p>
                </td>
              </tr>
            </tfoot>
          )}
          {/* 더보기 버튼을 테이블 푸터로 추가 */}
            {showMoreButton && currentType === 'all' && teams.length >= 5 && (
              <tfoot>
                <tr>
                  <td colSpan={1} className="px-4 py-3 border-t border-black/7 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] sm:hidden">
                    <Link
                      href={`/search?q=${encodeURIComponent(query)}&type=teams`}
                      className="text-sm text-gray-900 dark:text-[#F0F0F0] hover:underline font-medium transition-colors"
                    >
                      더 많은 팀 보기 ({totalCount}개) →
                    </Link>
                  </td>
                  <td colSpan={5} className="hidden sm:table-cell px-6 py-3 border-t border-black/7 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]">
                    <Link
                      href={`/search?q=${encodeURIComponent(query)}&type=teams`}
                      className="text-sm text-gray-900 dark:text-[#F0F0F0] hover:underline font-medium transition-colors"
                    >
                      더 많은 팀 보기 ({totalCount}개) →
                    </Link>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
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
                ? 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-400 cursor-not-allowed'
                : 'bg-slate-800 dark:bg-[#3F3F3F] text-white hover:bg-slate-700 dark:hover:bg-[#4A4A4A]'
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
  onToggle,
  isExpanded,
  matches,
  matchesLoading
}: { 
  team: TeamSearchResult
  onToggle: (team: TeamSearchResult) => void
  isExpanded: boolean
  matches: TeamMatch[]
  matchesLoading: boolean
}) {
  const router = useRouter()

  // 팀 페이지로 이동 (로그 기록)
  const handleTeamPageClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // 팀 페이지 이동 로그 기록
    try {
      await trackSearchResultClick({
        search_query: new URLSearchParams(window.location.search).get('q') || '',
        clicked_result_id: team.team_id.toString(),
        clicked_result_type: 'team'
      })
    } catch (error) {
      console.error('팀 페이지 이동 추적 실패:', error)
    }
    
    // 팀 페이지로 이동 - Next.js router 사용
    router.push(`/livescore/football/team/${team.team_id}`)
  }, [team, router])

  return (
    <>
      {/* 팀 정보 행 */}
      <tr
        className={`
          hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors
          ${isExpanded ? 'bg-[#F5F5F5] dark:bg-[#262626]' : ''}
        `}
      >
        {/* 팀 정보 */}
        <td className="px-2 sm:px-4 py-4">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            {team.logo_url ? (
              <Image
                src={team.logo_url}
                alt={`${team.display_name} 로고`}
                width={28}
                height={28}
                className="w-6 h-6 sm:w-7 sm:h-7 object-contain flex-shrink-0"
              />
            ) : (
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-[#F5F5F5] dark:bg-[#262626] rounded flex items-center justify-center flex-shrink-0">
                <span className="text-gray-500 dark:text-gray-400 text-xs font-bold">
                  {team.code || team.name.charAt(0)}
                </span>
              </div>
            )}
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="font-medium text-gray-900 dark:text-[#F0F0F0] flex items-center text-xs sm:text-sm min-w-0">
                {/* 팀 이름 - 클릭 시 팀 페이지로 이동 */}
                <button
                  onClick={handleTeamPageClick}
                  className="truncate hover:underline transition-colors text-left min-w-0 flex-1"
                >
                  {team.display_name}
                </button>
                
                {/* 드롭다운 토글 버튼 */}
                <TeamMatchDropdownButton
                  team={team}
                  isExpanded={isExpanded}
                  onToggle={onToggle}
                />
              </div>
              
              {/* 모바일에서 추가 정보 표시 */}
              <div className="sm:hidden mt-1">
                {/* 리그 | 국가 | 홈구장 가로 배치 */}
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1 overflow-hidden">
                  <span className="text-gray-700 dark:text-gray-300 flex-shrink-0 truncate max-w-20">{team.league_name_ko}</span>
                  <span className="text-gray-400 flex-shrink-0">|</span>
                  <span className="flex-shrink-0 truncate max-w-16">{team.country_ko ?? team.country}</span>
                  {team.venue_name && (
                    <>
                      <span className="text-gray-400 flex-shrink-0">|</span>
                      <span className="truncate min-w-0 max-w-24">
                        {team.venue_name}
                      </span>
                    </>
                  )}
                </div>
                
                {/* 영어명 (다른 경우만) */}
                {team.name_en && team.name_en !== team.display_name && (
                  <div className="text-xs text-gray-400 truncate italic mt-0.5">
                    {team.name_en}
                  </div>
                )}
              </div>
            </div>
          </div>
        </td>

        {/* 리그 */}
        <td className="hidden sm:table-cell px-4 py-4 text-sm text-gray-900 dark:text-[#F0F0F0]">
          <div className="truncate max-w-32" title={team.league_name_ko}>
            {team.league_name_ko}
          </div>
        </td>

        {/* 국가 */}
        <td className="hidden md:table-cell px-4 py-4 text-sm text-gray-900 dark:text-[#F0F0F0]">
          {team.country_ko ?? team.country}
        </td>

        {/* 홈구장 */}
        <td className="hidden lg:table-cell px-4 py-4 text-sm text-gray-900 dark:text-[#F0F0F0]">
          <div className="max-w-40">
            {team.venue_name && (
              <div className="font-medium truncate" title={team.venue_name}>
                {team.venue_name}
              </div>
            )}
            {team.venue_city && (
              <div className="text-gray-500 dark:text-gray-400 truncate" title={team.venue_city}>
                {team.venue_city}
              </div>
            )}
          </div>
        </td>

        {/* 코드 */}
        <td className="hidden sm:table-cell px-2 sm:px-4 py-4 text-center w-16 sm:w-20">
          {team.code ? (
            <span className="font-mono text-xs bg-[#F5F5F5] dark:bg-[#262626] px-1 sm:px-2 py-0.5 sm:py-1 rounded text-gray-700 dark:text-gray-300">
              {team.code}
            </span>
          ) : (
            <span className="text-gray-400 text-xs">-</span>
          )}
        </td>
      </tr>
      
      {/* 매치 정보 확장 행 */}
      <TeamMatchExpandedRow
        team={team}
        isExpanded={isExpanded}
        matches={matches}
        loading={matchesLoading}
      />
    </>
  )
}