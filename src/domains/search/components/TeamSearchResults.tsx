'use client'

import Link from 'next/link'
import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { TeamSearchResult } from '../types'
import { trackSearchResultClick } from '../actions/searchLogs'
import { getTeamMatchesRecent, type Match } from '@/domains/livescore/actions/teams/matches'
import { getTeamLogoUrls } from '@/domains/livescore/actions/images'
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient'
import TeamMatchDropdownButton, { TeamMatchExpandedRow } from './TeamMatchDropdown'
import { Button } from '@/shared/components/ui'
import { getTeamSlugFromName } from '@/domains/livescore/utils/slugs'
import { teamUrl } from '@/domains/livescore/utils/urls'

const CACHE_DURATION = 5 * 60 * 1000

interface TeamMatchCache {
  [teamId: number]: {
    data: Match[]
    logoUrls: Record<number, string>
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
  showMoreButton?: boolean
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
  currentType = 'teams',
  query = '',
  totalCount = 0,
  pagination
}: TeamSearchResultsProps) {
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null)
  const [teamMatchCache, setTeamMatchCache] = useState<TeamMatchCache>({})

  const isCacheValid = useCallback((timestamp: number) => {
    return Date.now() - timestamp < CACHE_DURATION
  }, [])

  const getCachedMatches = useCallback((teamId: number) => {
    const cached = teamMatchCache[teamId]
    if (cached && isCacheValid(cached.timestamp)) {
      return cached.data
    }
    return null
  }, [teamMatchCache, isCacheValid])

  const isTeamLoading = useCallback((teamId: number) => {
    return teamMatchCache[teamId]?.loading || false
  }, [teamMatchCache])

  const handleTeamToggle = useCallback(async (team: TeamSearchResult) => {
    if (onTeamSelect) {
      onTeamSelect(team)
      return
    }

    if (expandedTeamId === team.team_id) {
      setExpandedTeamId(null)
      return
    }

    setExpandedTeamId(team.team_id)

    if (getCachedMatches(team.team_id) || isTeamLoading(team.team_id)) {
      return
    }

    setTeamMatchCache(prev => ({
      ...prev,
      [team.team_id]: {
        data: [],
        logoUrls: {},
        timestamp: Date.now(),
        loading: true
      }
    }))

    try {
      const result = await getTeamMatchesRecent(team.team_id, 5)

      if (result.success && result.data) {
        const matchData = result.data
        const matchTeamIds = new Set<number>()

        matchData.forEach(match => {
          if (match.teams.home.id) matchTeamIds.add(match.teams.home.id)
          if (match.teams.away.id) matchTeamIds.add(match.teams.away.id)
        })

        const logoUrls = matchTeamIds.size > 0
          ? await getTeamLogoUrls([...matchTeamIds])
          : {}

        setTeamMatchCache(prev => ({
          ...prev,
          [team.team_id]: {
            data: matchData,
            logoUrls,
            timestamp: Date.now(),
            loading: false
          }
        }))
      } else {
        setTeamMatchCache(prev => ({
          ...prev,
          [team.team_id]: {
            data: [],
            logoUrls: {},
            timestamp: Date.now(),
            loading: false
          }
        }))
      }
    } catch (error) {
      console.error('매치 정보 로딩 실패:', error)
      setTeamMatchCache(prev => ({
        ...prev,
        [team.team_id]: {
          data: [],
          logoUrls: {},
          timestamp: Date.now(),
          loading: false
        }
      }))
    }
  }, [expandedTeamId, getCachedMatches, isTeamLoading, onTeamSelect])

  const currentTeamMatches = useMemo(() => {
    if (!expandedTeamId) return []
    return getCachedMatches(expandedTeamId) || []
  }, [expandedTeamId, getCachedMatches])

  const currentTeamLogoUrls = useMemo(() => {
    if (!expandedTeamId) return {}
    return teamMatchCache[expandedTeamId]?.logoUrls || {}
  }, [expandedTeamId, teamMatchCache])

  const currentTeamLoading = useMemo(() => {
    if (!expandedTeamId) return false
    return isTeamLoading(expandedTeamId)
  }, [expandedTeamId, isTeamLoading])

  if (isLoading && teams.length === 0) {
    return (
      <div className="py-8 text-center text-[13px] text-gray-500 dark:text-gray-400">
        불러오는 중...
      </div>
    )
  }

  if (teams.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">검색 결과가 없습니다</p>
        <p className="text-gray-400 text-[13px] mt-1">다른 키워드로 검색해보세요</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden">
        <div className="px-4 py-3 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/7 dark:border-white/10">
          <h3 className="text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">
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
                <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28 md:w-36">
                  리그
                </th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  국가
                </th>
                <th className="hidden lg:table-cell px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  경기장
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
                  matchTeamLogoUrls={currentTeamLogoUrls}
                />
              ))}
            </tbody>

            {pagination && currentType === 'teams' && (
              <tfoot>
                <tr>
                  <td colSpan={1} className="px-4 py-3 border-t border-black/7 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] sm:hidden">
                    <PaginationSummary pagination={pagination} />
                  </td>
                  <td colSpan={4} className="hidden sm:table-cell px-6 py-3 border-t border-black/7 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]">
                    <PaginationSummary pagination={pagination} />
                  </td>
                </tr>
              </tfoot>
            )}

            {showMoreButton && currentType === 'all' && teams.length >= 5 && (
              <tfoot>
                <tr>
                  <td colSpan={1} className="px-4 py-3 border-t border-black/7 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] sm:hidden">
                    <MoreTeamsLink query={query} totalCount={totalCount} />
                  </td>
                  <td colSpan={4} className="hidden sm:table-cell px-6 py-3 border-t border-black/7 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]">
                    <MoreTeamsLink query={query} totalCount={totalCount} />
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {currentType === 'teams' && hasMore && (
        <div className="text-center pt-6">
          <Button
            variant="ghost"
            onClick={onLoadMore}
            disabled={isLoading}
            className={`
              px-6 py-3 rounded-lg font-medium transition-colors
              ${isLoading
                ? 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-400 cursor-not-allowed'
                : 'bg-[#262626] dark:bg-[#3F3F3F] text-white hover:bg-[#3F3F3F] dark:hover:bg-[#4A4A4A]'
              }
            `}
          >
            {isLoading ? '불러오는 중...' : '더보기'}
          </Button>
        </div>
      )}
    </div>
  )
}

function PaginationSummary({
  pagination
}: {
  pagination: NonNullable<TeamSearchResultsProps['pagination']>
}) {
  const start = (pagination.currentPage - 1) * pagination.itemsPerPage + 1
  const end = Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)

  return (
    <p className="text-[13px] text-gray-700 dark:text-gray-300">
      총 <span className="font-medium">{pagination.totalItems}</span>개 중{' '}
      <span className="font-medium">{start}</span>-
      <span className="font-medium">{end}</span>개 표시
    </p>
  )
}

function MoreTeamsLink({ query, totalCount }: { query: string; totalCount: number }) {
  return (
    <Link
      href={`/search?q=${encodeURIComponent(query)}&type=teams`}
      className="text-[13px] text-gray-900 dark:text-[#F0F0F0] hover:underline font-medium transition-colors"
    >
      더 많은 팀 보기 ({totalCount}개)
    </Link>
  )
}

function TeamRowWithMatches({
  team,
  onToggle,
  isExpanded,
  matches,
  matchesLoading,
  matchTeamLogoUrls
}: {
  team: TeamSearchResult
  onToggle: (team: TeamSearchResult) => void
  isExpanded: boolean
  matches: Match[]
  matchesLoading: boolean
  matchTeamLogoUrls: Record<number, string>
}) {
  const router = useRouter()
  const teamHref = teamUrl(team.team_id, getTeamSlugFromName(team.name || team.display_name))

  const handleTeamPageClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      await trackSearchResultClick({
        search_query: new URLSearchParams(window.location.search).get('q') || '',
        clicked_result_id: team.team_id.toString(),
        clicked_result_type: 'team'
      })
    } catch (error) {
      console.error('팀 페이지 이동 추적 실패:', error)
    }

    router.push(teamHref)
  }, [team, teamHref, router])

  return (
    <>
      <tr
        className={`
          hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors
          ${isExpanded ? 'bg-[#F5F5F5] dark:bg-[#262626]' : ''}
        `}
      >
        <td className="px-2 sm:px-4 py-4">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <UnifiedSportsImageClient
              src={team.logo_url || '/images/placeholder-team.svg'}
              alt={`${team.display_name} 로고`}
              width={28}
              height={28}
              className="w-6 h-6 sm:w-7 sm:h-7 object-contain flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-900 dark:text-[#F0F0F0] text-xs sm:text-[13px]">
                <Link
                  href={teamHref}
                  onClick={handleTeamPageClick}
                  className="truncate hover:underline transition-colors text-left p-0 h-auto font-medium min-w-0"
                >
                  {team.display_name}
                </Link>
              </div>

              <div className="sm:hidden mt-0.5">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {team.league_name_ko} · {team.country_ko ?? team.country}
                </span>
              </div>
            </div>

            <div className="flex-shrink-0">
              <TeamMatchDropdownButton
                team={team}
                isExpanded={isExpanded}
                onToggle={onToggle}
              />
            </div>
          </div>
        </td>

        <td className="hidden sm:table-cell px-4 py-4 text-[13px] text-gray-900 dark:text-[#F0F0F0] w-28 md:w-36">
          <div className="truncate" title={team.league_name_ko}>
            {team.league_name_ko}
          </div>
        </td>

        <td className="hidden md:table-cell px-4 py-4 text-[13px] text-gray-900 dark:text-[#F0F0F0] w-24 whitespace-nowrap">
          {team.country_ko ?? team.country}
        </td>

        <td className="hidden lg:table-cell px-4 py-4 text-[13px] text-gray-900 dark:text-[#F0F0F0] text-right">
          <div>
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
      </tr>

      <TeamMatchExpandedRow
        team={team}
        isExpanded={isExpanded}
        matches={matches}
        loading={matchesLoading}
        matchTeamLogoUrls={matchTeamLogoUrls}
      />
    </>
  )
}
