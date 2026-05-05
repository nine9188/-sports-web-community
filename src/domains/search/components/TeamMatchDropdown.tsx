'use client'

import type { TeamSearchResult } from '../types'
import type { Match } from '@/domains/livescore/actions/teams/matches'
import { useTeamLeague } from '@/shared/context/TeamLeagueContext'
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient'
import { Button } from '@/shared/components/ui'

const TEAM_PLACEHOLDER = '/images/placeholder-team.svg'

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
  matchTeamLogoUrls?: Record<number, string>
}

export function TeamMatchDropdownButton({
  team,
  isExpanded,
  onToggle
}: TeamMatchDropdownButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => onToggle(team)}
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

export function TeamMatchExpandedRow({
  team,
  isExpanded,
  matches,
  loading,
  matchTeamLogoUrls = {}
}: TeamMatchExpandedRowProps) {
  if (!isExpanded) return null

  return (
    <tr key={`${team.team_id}-matches`}>
      <td colSpan={1} className="p-0 bg-[#F5F5F5] dark:bg-[#262626] border-t border-black/5 dark:border-white/10 sm:hidden">
        <div className="p-3 space-y-3 w-full">
          <h4 className="font-medium text-gray-900 dark:text-[#F0F0F0] text-[13px]">최근 경기</h4>

          {loading ? (
            <div className="py-4 text-center text-[13px] text-gray-500 dark:text-gray-400">
              불러오는 중...
            </div>
          ) : matches.length > 0 ? (
            <div className="space-y-2 w-full">
              {matches.slice(0, 5).map((match) => (
                <MatchItem key={match.fixture.id} match={match} teamId={team.team_id} teamLogoUrls={matchTeamLogoUrls} />
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-gray-500 dark:text-gray-400 py-2">경기 정보를 찾을 수 없습니다.</p>
          )}
        </div>
      </td>
      <td colSpan={4} className="hidden sm:table-cell px-4 py-4 bg-[#F5F5F5] dark:bg-[#262626] border-t border-black/5 dark:border-white/10">
        <div className="space-y-3 w-full">
          <h4 className="font-medium text-gray-900 dark:text-[#F0F0F0] text-[13px]">최근 경기</h4>

          {loading ? (
            <div className="py-4 text-center text-[13px] text-gray-500 dark:text-gray-400">
              불러오는 중...
            </div>
          ) : matches.length > 0 ? (
            <div className="space-y-2 w-full">
              {matches.slice(0, 5).map((match) => (
                <MatchItem key={match.fixture.id} match={match} teamId={team.team_id} teamLogoUrls={matchTeamLogoUrls} />
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-gray-500 dark:text-gray-400 py-2">경기 정보를 찾을 수 없습니다.</p>
          )}
        </div>
      </td>
    </tr>
  )
}

export default TeamMatchDropdownButton

function MatchItem({ match, teamId, teamLogoUrls = {} }: { match: Match; teamId: number; teamLogoUrls?: Record<number, string> }) {
  const { getLeagueName, getTeamById } = useTeamLeague()
  const isHome = match.teams.home.id === teamId
  const opponent = isHome ? match.teams.away : match.teams.home
  const teamScore = isHome ? match.goals.home : match.goals.away
  const opponentScore = isHome ? match.goals.away : match.goals.home
  const localizedLeagueName = getLeagueName(match.league.id) || match.league.name
  const mappedOpponent = getTeamById(opponent.id)
  const opponentDisplayName = mappedOpponent?.name_ko || opponent.name
  const opponentLogoUrl = teamLogoUrls[opponent.id] || TEAM_PLACEHOLDER

  const getMatchStatus = () => {
    const status = match.fixture.status.short
    if (status === 'FT') return '종료'
    if (status === 'NS') return '예정'
    if (status === 'LIVE' || status === '1H' || status === '2H') return '진행중'
    return status
  }

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
      <div className="sm:hidden p-2.5">
        <div className="flex items-start justify-between mb-1.5">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <UnifiedSportsImageClient
              src={opponentLogoUrl}
              alt={`${opponentDisplayName} 로고`}
              width={18}
              height={18}
              className="w-4.5 h-4.5 object-contain flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-900 dark:text-[#F0F0F0] text-[13px] truncate">
                vs {opponentDisplayName}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {localizedLeagueName}
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-3">
            {match.fixture.status.short === 'FT' ? (
              <div className="font-bold text-[13px] text-gray-900 dark:text-[#F0F0F0]">
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

      <div className="hidden sm:flex items-center justify-between p-3 text-[13px]">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <UnifiedSportsImageClient
            src={opponentLogoUrl}
            alt={`${opponentDisplayName} 로고`}
            width={20}
            height={20}
            className="w-5 h-5 object-contain flex-shrink-0"
          />
          <div className="min-w-0">
            <div className="font-medium text-gray-900 dark:text-[#F0F0F0] truncate">
              vs {opponentDisplayName}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {localizedLeagueName} · {formatDate(match.fixture.date)}
            </div>
          </div>
        </div>

        <div className="text-right flex-shrink-0 ml-3">
          {match.fixture.status.short === 'FT' ? (
            <div className="font-medium text-gray-900 dark:text-[#F0F0F0]">
              {teamScore} - {opponentScore}
            </div>
          ) : (
            <div className="text-[13px] text-gray-700 dark:text-gray-300">
              {getMatchStatus()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
