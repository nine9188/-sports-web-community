'use client'

import Image from 'next/image'
import { TeamSearchResult } from '../actions/searchTeams'

interface TeamSearchResultsProps {
  teams: TeamSearchResult[]
  total: number
  hasMore: boolean
  isLoading?: boolean
  onLoadMore?: () => void
  onTeamSelect?: (team: TeamSearchResult) => void
}

export default function TeamSearchResults({
  teams,
  total,
  hasMore,
  isLoading = false,
  onLoadMore,
  onTeamSelect
}: TeamSearchResultsProps) {
  if (isLoading && teams.length === 0) {
    return <TeamSearchSkeleton />
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
      {/* 검색 결과 헤더 */}
      <div className="flex items-center justify-between border-b pb-3">
        <h3 className="text-lg font-semibold text-gray-900">
          팀 검색 결과 ({total.toLocaleString()})
        </h3>
      </div>

      {/* 팀 테이블 */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                팀
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                리그
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                국가
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                홈구장
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                코드
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {teams.map((team) => (
              <TeamRow 
                key={team.team_id} 
                team={team} 
                onSelect={onTeamSelect}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* 더보기 버튼 */}
      {hasMore && (
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

// 개별 팀 행 컴포넌트
function TeamRow({ 
  team, 
  onSelect 
}: { 
  team: TeamSearchResult
  onSelect?: (team: TeamSearchResult) => void 
}) {
  const handleClick = () => {
    if (onSelect) {
      onSelect(team)
    }
  }

  return (
    <tr 
      className={`
        hover:bg-gray-50 transition-colors
        ${onSelect ? 'cursor-pointer' : ''}
      `}
      onClick={handleClick}
    >
      {/* 팀 정보 */}
      <td className="px-4 py-4">
        <div className="flex items-center space-x-3">
          {team.logo_url ? (
            <Image
              src={team.logo_url}
              alt={`${team.name} 로고`}
              width={32}
              height={32}
              className="rounded object-contain"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
              <span className="text-gray-500 text-xs font-bold">
                {team.code || team.name.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <div className="font-medium text-gray-900">{team.display_name}</div>
            {team.short_name && team.short_name !== team.display_name && (
              <div className="text-sm text-gray-500">{team.short_name}</div>
            )}
          </div>
        </div>
      </td>

      {/* 리그 */}
      <td className="px-4 py-4 text-sm text-gray-900">
        <div className="truncate max-w-32" title={team.league_name_ko}>
          {team.league_name_ko}
        </div>
      </td>

      {/* 국가 */}
      <td className="px-4 py-4 text-sm text-gray-900">
        {team.country}
      </td>

      {/* 홈구장 */}
      <td className="px-4 py-4 text-sm text-gray-900">
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
      <td className="px-4 py-4 text-center">
        {team.code ? (
          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
            {team.code}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
    </tr>
  )
}

// 로딩 스켈레톤
function TeamSearchSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3">
          <div className="flex space-x-4">
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-4 py-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 