'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage'
import { ImageType } from '@/shared/types/image'
import { getTeamById, type TeamMapping } from '@/domains/livescore/constants/teams'
import { fetchLeagueTeams } from '@/domains/livescore/actions/footballApi'
import { fetchTeamSquad, type Player } from '@/domains/livescore/actions/teams/squad'
import { getPlayerKoreanName } from '@/domains/livescore/constants/players'
import { ChevronLeft, Users, User } from 'lucide-react'
import Spinner from '@/shared/components/Spinner';

// 주요 리그
const LEAGUES = [
  { id: 39, name: '프리미어리그', country: '잉글랜드' },
  { id: 140, name: '라리가', country: '스페인' },
  { id: 78, name: '분데스리가', country: '독일' },
  { id: 135, name: '세리에A', country: '이탈리아' },
  { id: 61, name: '리그1', country: '프랑스' },
  { id: 292, name: 'K리그1', country: '대한민국' },
]

// 리그 정보 인터페이스
interface LeagueInfo {
  id: number
  name: string
  koreanName: string
}

interface EntityPickerFormProps {
  isOpen: boolean
  onClose: () => void
  onSelectTeam: (team: TeamMapping, league: LeagueInfo) => void
  onSelectPlayer: (player: Player, team: TeamMapping) => void
}

type Tab = 'team' | 'player'
type Step = 'league' | 'team' | 'player'

export function EntityPickerForm({
  isOpen,
  onClose,
  onSelectTeam,
  onSelectPlayer,
}: EntityPickerFormProps) {
  const [activeTab, setActiveTab] = useState<Tab>('team')
  const [step, setStep] = useState<Step>('league')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // 선택 상태
  const [selectedLeagueId, setSelectedLeagueId] = useState<number | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<TeamMapping | null>(null)

  // 데이터
  const [teams, setTeams] = useState<TeamMapping[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoadingTeams, setIsLoadingTeams] = useState(false)
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false)
  const [playerError, setPlayerError] = useState<string | null>(null)
  const [teamError, setTeamError] = useState<string | null>(null)


  // 리그 선택 시 팀 목록 로드 (API에서)
  useEffect(() => {
    if (selectedLeagueId) {
      setIsLoadingTeams(true)
      setTeamError(null)

      fetchLeagueTeams(selectedLeagueId.toString())
        .then(apiTeams => {
          // API 팀 데이터에 한국어 이름 매핑
          const mappedTeams: TeamMapping[] = apiTeams.map(apiTeam => {
            const localTeam = getTeamById(apiTeam.id)
            return {
              id: apiTeam.id,
              name_ko: localTeam?.name_ko || apiTeam.name, // 매핑 없으면 영어 이름 사용
              name_en: apiTeam.name,
              country_ko: localTeam?.country_ko,
              country_en: localTeam?.country_en,
              code: localTeam?.code,
              logo: apiTeam.logo
            }
          })
          setTeams(mappedTeams)
          setStep('team')
        })
        .catch(error => {
          console.error('팀 목록 로드 실패:', error)
          setTeams([])
          setTeamError('팀 목록을 불러올 수 없습니다')
        })
        .finally(() => {
          setIsLoadingTeams(false)
        })
    }
  }, [selectedLeagueId])

  // 팀 선택 시 선수 목록 로드 (선수 탭일 때만)
  const loadPlayers = useCallback(async (teamId: number) => {
    setIsLoadingPlayers(true)
    setPlayerError(null)
    try {
      const response = await fetchTeamSquad(String(teamId))
      if (response.success && response.data) {
        // Coach 제외하고 Player만 필터링
        const playerList = response.data.filter(
          (item): item is Player => item.position !== 'Coach'
        )
        setPlayers(playerList)
      } else {
        setPlayers([])
        setPlayerError(response.message || '선수 정보를 불러올 수 없습니다')
      }
    } catch (error) {
      console.error('선수 로드 실패:', error)
      setPlayers([])
      setPlayerError(error instanceof Error ? error.message : '선수 정보를 불러올 수 없습니다')
    } finally {
      setIsLoadingPlayers(false)
    }
  }, [])

  // 뒤로가기
  const handleBack = () => {
    if (step === 'player') {
      setStep('team')
      setSelectedTeam(null)
      setPlayers([])
      setPlayerError(null)
    } else if (step === 'team') {
      setStep('league')
      setSelectedLeagueId(null)
      setTeams([])
      setTeamError(null)
    }
  }

  // 탭 변경 시 초기화
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    setStep('league')
    setSelectedLeagueId(null)
    setSelectedTeam(null)
    setTeams([])
    setPlayers([])
    setPlayerError(null)
    setTeamError(null)
  }

  // 리그 선택
  const handleLeagueSelect = (leagueId: number) => {
    setSelectedLeagueId(leagueId)
  }

  // 팀 선택
  const handleTeamSelect = (team: TeamMapping) => {
    if (activeTab === 'team') {
      // 팀 탭: 바로 선택 완료
      const selectedLeague = LEAGUES.find(l => l.id === selectedLeagueId)
      if (selectedLeague) {
        onSelectTeam(team, {
          id: selectedLeague.id,
          name: selectedLeague.name,
          koreanName: selectedLeague.name
        })
      }
      handleClose()
    } else {
      // 선수 탭: 선수 목록으로 이동
      setSelectedTeam(team)
      setStep('player')
      loadPlayers(team.id)
    }
  }

  // 선수 선택
  const handlePlayerSelect = (player: Player) => {
    if (selectedTeam) {
      onSelectPlayer(player, selectedTeam)
      handleClose()
    }
  }

  // 모달 닫기 시 초기화
  const handleClose = () => {
    setActiveTab('team')
    setStep('league')
    setSelectedLeagueId(null)
    setSelectedTeam(null)
    setTeams([])
    setPlayers([])
    setPlayerError(null)
    setTeamError(null)
    onClose()
  }

  // 선택된 리그 이름
  const selectedLeagueName = LEAGUES.find(l => l.id === selectedLeagueId)?.name

  if (!isOpen) return null

  return (
    <>
      {/* 모바일 오버레이 */}
      <div
        className="fixed inset-0 bg-black/20 z-40 sm:hidden"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        ref={dropdownRef}
        className="z-50 bg-white dark:bg-[#1D1D1D] rounded-lg shadow-lg border border-black/7 dark:border-white/10 overflow-hidden fixed sm:absolute left-1/2 top-1/2 sm:-left-32 sm:top-full -translate-x-1/2 -translate-y-1/2 sm:translate-x-0 sm:translate-y-0 w-[95vw] max-w-md sm:w-[400px]"
        style={{ marginTop: '0.5rem' }}
      >
        {/* 헤더 */}
        <div className="bg-[#F5F5F5] dark:bg-[#262626] h-12 px-4 flex items-center justify-between border-b border-black/10 dark:border-white/15">
          <div className="flex items-center gap-2">
            {step !== 'league' && (
              <button
                type="button"
                onClick={handleBack}
                className="p-1 rounded hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            )}
            <h3 className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
              {activeTab === 'team' ? '팀 선택' : '선수 선택'}
            </h3>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-black/5 dark:border-white/10">
          {[
            { id: 'team', label: '팀', icon: <Users className="h-3.5 w-3.5 mr-1" /> },
            { id: 'player', label: '선수', icon: <User className="h-3.5 w-3.5 mr-1" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id as Tab)}
              className={`flex-1 text-xs py-2.5 px-2 flex items-center justify-center transition-colors outline-none focus:outline-none ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] font-medium border-b-2 border-slate-800 dark:border-white'
                  : 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* 브레드크럼 */}
        {step !== 'league' && (
          <div className="flex items-center gap-2 px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-black/5 dark:border-white/5 bg-[#FAFAFA] dark:bg-[#232323]">
            <span>{selectedLeagueName}</span>
            {selectedTeam && (
              <>
                <span>›</span>
                <span>{selectedTeam.name_ko}</span>
              </>
            )}
          </div>
        )}

        {/* 콘텐츠 영역 */}
        <div className="max-h-[300px] overflow-y-auto p-4">
          {/* Step 1: 리그 선택 */}
          {step === 'league' && (
            <div className="grid grid-cols-3 gap-2">
              {LEAGUES.map(league => (
                <button
                  key={league.id}
                  type="button"
                  onClick={() => handleLeagueSelect(league.id)}
                  className="flex flex-col items-center p-2 rounded-lg bg-[#F5F5F5] dark:bg-[#262626] border border-black/7 dark:border-white/10 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors outline-none focus:outline-none"
                >
                  <UnifiedSportsImage
                    imageId={league.id}
                    imageType={ImageType.Leagues}
                    alt={league.name}
                    size="md"
                    variant="square"
                    fit="contain"
                  />
                  <span className="mt-1.5 text-[11px] font-medium text-gray-900 dark:text-[#F0F0F0] text-center leading-tight">
                    {league.name}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: 팀 선택 */}
          {step === 'team' && (
            <>
              {isLoadingTeams ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-500 dark:text-gray-400 text-xs">
                  <Spinner size="md" className="mb-2" />
                  <span>팀 목록을 불러오는 중...</span>
                </div>
              ) : teamError ? (
                <div className="flex items-center justify-center h-40 text-red-500 dark:text-red-400 text-xs">
                  {teamError}
                </div>
              ) : teams.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-gray-500 dark:text-gray-400 text-xs">
                  팀 정보를 불러올 수 없습니다
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {teams.map(team => (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => handleTeamSelect(team)}
                      className="flex flex-col items-center p-2 rounded-lg bg-[#F5F5F5] dark:bg-[#262626] border border-black/7 dark:border-white/10 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors outline-none focus:outline-none"
                    >
                      <UnifiedSportsImage
                        imageId={team.id}
                        imageType={ImageType.Teams}
                        alt={team.name_ko}
                        size="md"
                        variant="square"
                        fit="contain"
                      />
                      <span className="mt-1.5 text-[11px] font-medium text-gray-900 dark:text-[#F0F0F0] text-center line-clamp-1 leading-tight">
                        {team.name_ko}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Step 3: 선수 선택 */}
          {step === 'player' && (
            <>
              {isLoadingPlayers ? (
                <div className="flex items-center justify-center h-40">
                  <Spinner size="md" />
                </div>
              ) : playerError ? (
                <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                  <span className="text-red-500 dark:text-red-400 text-xs">{playerError}</span>
                  <button
                    type="button"
                    onClick={() => selectedTeam && loadPlayers(selectedTeam.id)}
                    className="mt-3 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    다시 시도
                  </button>
                </div>
              ) : players.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-gray-500 dark:text-gray-400 text-xs">
                  선수 정보가 없습니다
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {players.map(player => {
                    const koreanName = getPlayerKoreanName(player.id)
                    const displayName = koreanName || player.name

                    return (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => handlePlayerSelect(player)}
                        className="flex flex-col items-center p-2 rounded-lg bg-[#F5F5F5] dark:bg-[#262626] border border-black/7 dark:border-white/10 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors outline-none focus:outline-none"
                      >
                        {/* 선수 이미지 */}
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <UnifiedSportsImage
                              imageId={player.id}
                              imageType={ImageType.Players}
                              alt={displayName}
                              size="md"
                              variant="circle"
                              className="w-full h-full"
                            />
                          </div>
                          {/* 팀 로고 뱃지 */}
                          {selectedTeam && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-white dark:bg-[#1D1D1D] shadow flex items-center justify-center">
                              <UnifiedSportsImage
                                imageId={selectedTeam.id}
                                imageType={ImageType.Teams}
                                alt={selectedTeam.name_ko}
                                width={10}
                                height={10}
                                variant="square"
                                fit="contain"
                              />
                            </div>
                          )}
                        </div>

                        <span className="mt-1 text-[10px] font-medium text-gray-900 dark:text-[#F0F0F0] text-center line-clamp-1 leading-tight w-full">
                          {displayName}
                        </span>
                        <span className="text-[9px] text-gray-500 dark:text-gray-400 leading-tight">
                          {player.number && `#${player.number}`}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="p-4 border-t border-black/7 dark:border-white/10">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] px-3 py-1.5 rounded-md text-xs transition-colors outline-none focus:outline-none"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
