'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, X } from 'lucide-react'
import { useClickOutside } from '@/shared/hooks/useClickOutside'
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient'
import { Button } from '@/shared/components/ui'
import { DARK_MODE_LEAGUE_IDS } from '@/shared/utils/matchCard'
import { leagueLogoUrl } from '@/shared/images/urls'
import { type Player } from '@/domains/livescore/actions/teams/squad'
import {
  type TeamMapping,
  useLeagueTeams,
  useTeamPlayers,
} from '@/domains/boards/hooks/useEntityQueries'

const LEAGUE_PLACEHOLDER = '/images/placeholder-league.svg'
const TEAM_PLACEHOLDER = '/images/placeholder-team.svg'
const PLAYER_PLACEHOLDER = '/images/placeholder-player.svg'

const LEAGUES = [
  { id: 39, name: '프리미어리그', country: '잉글랜드' },
  { id: 140, name: '라리가', country: '스페인' },
  { id: 78, name: '분데스리가', country: '독일' },
  { id: 135, name: '세리에A', country: '이탈리아' },
  { id: 61, name: '리그1', country: '프랑스' },
  { id: 292, name: 'K리그1', country: '대한민국' },
]

interface LeagueInfo {
  id: number
  name: string
  koreanName: string
}

interface EntityPickerFormProps {
  isOpen: boolean
  mode: 'team' | 'player'
  onClose: () => void
  onSelectTeam: (team: TeamMapping, league: LeagueInfo) => void
  onSelectPlayer: (player: Player, team: TeamMapping, koreanName?: string) => void
}

type Step = 'league' | 'team' | 'player'

function LoadingRows({ variant = 'grid' }: { variant?: 'grid' | 'list' }) {
  const count = variant === 'grid' ? 6 : 8

  return (
    <div className={variant === 'grid' ? 'grid grid-cols-3 gap-2' : 'space-y-2'}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={
            variant === 'grid'
              ? 'h-[72px] rounded-md bg-black/5 dark:bg-white/10'
              : 'h-10 rounded-md bg-black/5 dark:bg-white/10'
          }
        />
      ))}
    </div>
  )
}

export function EntityPickerForm({
  isOpen,
  mode,
  onClose,
  onSelectTeam,
  onSelectPlayer,
}: EntityPickerFormProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState<Step>('league')
  const [selectedLeagueId, setSelectedLeagueId] = useState<number | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<TeamMapping | null>(null)
  const [isDark, setIsDark] = useState(false)

  const {
    data: teams = [],
    isLoading: isLoadingTeams,
    error: teamsError,
    teamLogoUrls,
  } = useLeagueTeams(selectedLeagueId)

  const {
    data: playerData = { players: [], koreanNames: {} },
    isLoading: isLoadingPlayers,
    error: playersError,
    refetch: refetchPlayers,
    playerPhotoUrls,
    teamLogoUrl: selectedTeamLogoUrl,
  } = useTeamPlayers(mode === 'player' ? selectedTeam?.id ?? null : null)

  const { players, koreanNames } = playerData

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'))
    checkDark()

    const observer = new MutationObserver(checkDark)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isOpen) return

    setStep('league')
    setSelectedLeagueId(null)
    setSelectedTeam(null)
  }, [isOpen, mode])

  useEffect(() => {
    if (selectedLeagueId && teams.length > 0 && step === 'league') {
      setStep('team')
    }
  }, [selectedLeagueId, step, teams.length])

  const handleClose = useCallback(() => {
    setStep('league')
    setSelectedLeagueId(null)
    setSelectedTeam(null)
    onClose()
  }, [onClose])

  useClickOutside(panelRef, handleClose, isOpen)

  const selectedLeague = LEAGUES.find((league) => league.id === selectedLeagueId)
  const selectedLeagueName = selectedLeague?.name
  const stepLabel = step === 'league' ? '리그를 선택하세요' : step === 'team' ? '팀을 선택하세요' : '선수를 선택하세요'

  const getLeagueLogo = (id: number) => {
    if (!id) return LEAGUE_PLACEHOLDER
    if (isDark && DARK_MODE_LEAGUE_IDS.includes(id)) {
      return leagueLogoUrl(id, { dark: true })
    }
    return leagueLogoUrl(id)
  }

  const getTeamLogo = (id: number) => teamLogoUrls[id] || TEAM_PLACEHOLDER
  const getPlayerPhoto = (id: number) => playerPhotoUrls[id] || PLAYER_PLACEHOLDER

  const handleBack = () => {
    if (step === 'player') {
      setStep('team')
      setSelectedTeam(null)
      return
    }

    if (step === 'team') {
      setStep('league')
      setSelectedLeagueId(null)
    }
  }

  const handleTeamSelect = (team: TeamMapping) => {
    if (!selectedLeague) return

    if (mode === 'team') {
      onSelectTeam(team, {
        id: selectedLeague.id,
        name: selectedLeague.name,
        koreanName: selectedLeague.name,
      })
      handleClose()
      return
    }

    setSelectedTeam(team)
    setStep('player')
  }

  const handlePlayerSelect = (player: Player) => {
    if (!selectedTeam) return

    onSelectPlayer(player, selectedTeam, koreanNames[player.id] || undefined)
    handleClose()
  }

  if (!isOpen) return null

  return (
    <div
      ref={panelRef}
      data-editor-entity-popover="true"
      className="w-full overflow-hidden rounded-md border border-black/10 bg-white shadow-lg dark:border-white/10 dark:bg-[#1D1D1D]"
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex h-11 items-center justify-between gap-2 border-b border-black/10 bg-[#F5F5F5] px-2 dark:border-white/10 dark:bg-[#262626]">
        <div className="flex min-w-0 items-center gap-1">
          {step !== 'league' && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-8 w-8 shrink-0"
              title="뒤로"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold text-gray-900 dark:text-[#F0F0F0]">
              {mode === 'team' ? '팀 추가' : '선수 추가'}
            </div>
          </div>
        </div>
        <div className="flex min-w-0 shrink-0 items-center gap-1">
          <span className="hidden truncate text-[11px] text-gray-500 dark:text-gray-400 sm:inline">
            {stepLabel}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8 shrink-0"
            title="닫기"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-h-[360px] overflow-y-auto p-2">
        {step === 'league' && (
          <div className="grid grid-cols-3 gap-2">
            {LEAGUES.map((league) => (
              <button
                key={league.id}
                type="button"
                onClick={() => setSelectedLeagueId(league.id)}
                className="flex h-[74px] flex-col items-center justify-center rounded-md border border-black/7 bg-[#F5F5F5] p-2 text-center outline-none transition-colors hover:bg-[#EAEAEA] dark:border-white/10 dark:bg-[#262626] dark:hover:bg-[#333333]"
              >
                <UnifiedSportsImageClient
                  src={getLeagueLogo(league.id)}
                  alt={league.name}
                  width={30}
                  height={30}
                  className="h-7 w-7 object-contain"
                />
                <span className="mt-1.5 max-w-full truncate text-[11px] font-medium text-gray-900 dark:text-[#F0F0F0]">
                  {league.name}
                </span>
              </button>
            ))}
          </div>
        )}

        {step === 'team' && (
          <>
            {isLoadingTeams ? (
              <LoadingRows />
            ) : teamsError ? (
              <div className="flex h-28 items-center justify-center text-xs text-red-500 dark:text-red-400">
                팀 목록을 가져오지 못했습니다.
              </div>
            ) : teams.length === 0 ? (
              <div className="flex h-28 items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                팀 정보가 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => handleTeamSelect(team)}
                    className="flex h-[74px] flex-col items-center justify-center rounded-md border border-black/7 bg-[#F5F5F5] p-2 text-center outline-none transition-colors hover:bg-[#EAEAEA] dark:border-white/10 dark:bg-[#262626] dark:hover:bg-[#333333]"
                  >
                    <UnifiedSportsImageClient
                      src={getTeamLogo(team.id)}
                      alt={team.name_ko}
                      width={30}
                      height={30}
                      className="h-7 w-7 object-contain"
                    />
                    <span className="mt-1.5 max-w-full truncate text-[11px] font-medium text-gray-900 dark:text-[#F0F0F0]">
                      {team.name_ko}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {step === 'player' && (
          <>
            {isLoadingPlayers ? (
              <LoadingRows />
            ) : playersError ? (
              <div className="flex h-28 flex-col items-center justify-center gap-2 text-xs text-red-500 dark:text-red-400">
                선수 정보를 가져오지 못했습니다.
                <Button type="button" variant="secondary" className="h-7 px-2 text-xs" onClick={() => refetchPlayers()}>
                  다시 시도
                </Button>
              </div>
            ) : players.length === 0 ? (
              <div className="flex h-28 items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                선수 정보가 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {players.map((player) => {
                  const displayName = koreanNames[player.id] || player.name

                  return (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => handlePlayerSelect(player)}
                      className="flex h-[86px] min-w-0 flex-col items-center justify-center rounded-md border border-black/7 bg-[#F5F5F5] p-2 text-center outline-none transition-colors hover:bg-[#EAEAEA] dark:border-white/10 dark:bg-[#262626] dark:hover:bg-[#333333]"
                    >
                      <div className="relative h-9 w-9 shrink-0 overflow-visible">
                        <div className="h-9 w-9 overflow-hidden rounded-full border border-black/7 dark:border-white/10">
                          <UnifiedSportsImageClient
                            src={getPlayerPhoto(player.id)}
                            alt={displayName}
                            width={36}
                            height={36}
                            className="h-full w-full object-cover"
                            variant="circle"
                          />
                        </div>
                        {selectedTeam && (
                          <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow dark:bg-[#1D1D1D]">
                            <UnifiedSportsImageClient
                              src={selectedTeamLogoUrl || TEAM_PLACEHOLDER}
                              alt={selectedTeam.name_ko}
                              width={14}
                              height={14}
                              className="h-3.5 w-3.5 object-contain"
                            />
                          </div>
                        )}
                      </div>
                      <div className="mt-1.5 min-w-0 max-w-full truncate text-[11px] font-medium leading-tight text-gray-900 dark:text-[#F0F0F0]">
                        {displayName}
                      </div>
                      <div className="mt-0.5 min-h-3 truncate text-[9px] leading-none text-gray-500 dark:text-gray-400">
                        {player.number ? `#${player.number}` : player.position || ''}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
