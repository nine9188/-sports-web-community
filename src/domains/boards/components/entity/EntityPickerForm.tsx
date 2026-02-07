'use client'

/**
 * 4590 표준 적용:
 * - 리그/팀/선수 이미지: UnifiedSportsImageClient 사용
 * - URL은 props로 전달받거나 placeholder 사용
 */

import { useState, useEffect, useRef } from 'react'
import { useClickOutside } from '@/shared/hooks/useClickOutside'
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient'
import { type TeamMapping } from '@/domains/livescore/constants/teams'
import { type Player } from '@/domains/livescore/actions/teams/squad'
import { ChevronLeft, Users, User } from 'lucide-react'
import { Button, TabList, type TabItem } from '@/shared/components/ui'
import Spinner from '@/shared/components/Spinner';
import { useLeagueTeams, useTeamPlayers } from '@/domains/boards/hooks/useEntityQueries';
import { DARK_MODE_LEAGUE_IDS } from '@/shared/utils/matchCard';

// 4590 표준: placeholder 및 Storage URL
const LEAGUE_PLACEHOLDER = '/images/placeholder-league.svg';
const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';
const PLAYER_PLACEHOLDER = '/images/placeholder-player.svg';
const SUPABASE_URL = 'https://vnjjfhsuzoxcljqqwwvx.supabase.co';

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
  onSelectPlayer: (player: Player, team: TeamMapping, koreanName?: string) => void
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

  // 선택 상태
  const [selectedLeagueId, setSelectedLeagueId] = useState<number | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<TeamMapping | null>(null)

  // 4590 표준: 다크모드 감지
  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'))
    checkDark()
    const observer = new MutationObserver(checkDark)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // React Query로 데이터 관리 (의존 쿼리, 4590 표준: Storage URL 포함)
  const {
    data: teams = [],
    isLoading: isLoadingTeams,
    error: teamsError,
    teamLogoUrls,
  } = useLeagueTeams(selectedLeagueId);

  const {
    data: playerData = { players: [], koreanNames: {} },
    isLoading: isLoadingPlayers,
    error: playersError,
    refetch: refetchPlayers,
    playerPhotoUrls,
    teamLogoUrl: selectedTeamLogoUrl,
  } = useTeamPlayers(activeTab === 'player' ? selectedTeam?.id ?? null : null);

  const { players, koreanNames } = playerData;

  // 4590 표준: URL 헬퍼 함수 (리그는 다크모드 지원, 직접 Storage URL 생성)
  const getLeagueLogo = (id: number) => {
    if (!id) return LEAGUE_PLACEHOLDER
    const hasDarkMode = DARK_MODE_LEAGUE_IDS.includes(id)
    if (isDark && hasDarkMode) {
      return `${SUPABASE_URL}/storage/v1/object/public/leagues/${id}-1.png`
    }
    return `${SUPABASE_URL}/storage/v1/object/public/leagues/${id}.png`
  }
  const getTeamLogo = (id: number) => teamLogoUrls[id] || TEAM_PLACEHOLDER;
  const getPlayerPhoto = (id: number) => playerPhotoUrls[id] || PLAYER_PLACEHOLDER;

  // 에러 메시지 변환
  const teamError = teamsError ? '팀 목록을 불러올 수 없습니다' : null;
  const playerError = playersError ? '선수 정보를 불러올 수 없습니다' : null;


  // 리그 선택 시 자동으로 팀 목록 step으로 이동
  useEffect(() => {
    if (selectedLeagueId && teams.length > 0 && step === 'league') {
      setStep('team')
    }
  }, [selectedLeagueId, teams.length, step])

  // 뒤로가기
  const handleBack = () => {
    if (step === 'player') {
      setStep('team')
      setSelectedTeam(null)
    } else if (step === 'team') {
      setStep('league')
      setSelectedLeagueId(null)
    }
  }

  // 탭 변경 시 초기화
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    setStep('league')
    setSelectedLeagueId(null)
    setSelectedTeam(null)
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
      // 선수 탭: 선수 목록으로 이동 (React Query가 자동으로 데이터 로드)
      setSelectedTeam(team)
      setStep('player')
    }
  }

  // 선수 선택
  const handlePlayerSelect = (player: Player) => {
    if (selectedTeam) {
      const koreanName = koreanNames[player.id] || undefined
      onSelectPlayer(player, selectedTeam, koreanName)
      handleClose()
    }
  }

  // 모달 닫기 시 초기화
  const handleClose = () => {
    setActiveTab('team')
    setStep('league')
    setSelectedLeagueId(null)
    setSelectedTeam(null)
    onClose()
  }

  // 외부 클릭 감지
  useClickOutside(dropdownRef, handleClose, isOpen)

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
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => e.preventDefault()}
      >
        {/* 헤더 */}
        <div className="bg-[#F5F5F5] dark:bg-[#262626] h-12 px-4 flex items-center justify-between border-b border-black/10 dark:border-white/15">
          <div className="flex items-center gap-2">
            {step !== 'league' && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="w-6 h-6"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </Button>
            )}
            <h3 className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
              {activeTab === 'team' ? '팀 선택' : '선수 선택'}
            </h3>
          </div>
        </div>

        {/* 탭 */}
        <TabList
          tabs={[
            { id: 'team', label: '팀', icon: <Users className="h-3.5 w-3.5" /> },
            { id: 'player', label: '선수', icon: <User className="h-3.5 w-3.5" /> },
          ] as TabItem[]}
          activeTab={activeTab}
          onTabChange={(id) => handleTabChange(id as Tab)}
          variant="contained"
          className="mb-0"
        />

        {/* 브레드크럼 - 탭과 연결 */}
        {step !== 'league' && (
          <div className="flex items-center gap-2 px-4 py-2 text-xs text-gray-500 dark:text-gray-400 bg-[#FAFAFA] dark:bg-[#232323]">
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
                  <UnifiedSportsImageClient
                    src={getLeagueLogo(league.id)}
                    alt={league.name}
                    width={32}
                    height={32}
                    className="w-8 h-8 object-contain"
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
                      <UnifiedSportsImageClient
                        src={getTeamLogo(team.id)}
                        alt={team.name_ko}
                        width={32}
                        height={32}
                        className="w-8 h-8 object-contain"
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
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => refetchPlayers()}
                    className="mt-3 h-auto px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-[#F0F0F0]"
                  >
                    다시 시도
                  </Button>
                </div>
              ) : players.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-gray-500 dark:text-gray-400 text-xs">
                  선수 정보가 없습니다
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {players.map(player => {
                    const displayName = koreanNames[player.id] || player.name

                    return (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => handlePlayerSelect(player)}
                        className="flex flex-col items-center p-2 rounded-lg bg-[#F5F5F5] dark:bg-[#262626] border border-black/7 dark:border-white/10 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors outline-none focus:outline-none"
                      >
                        {/* 선수 이미지 */}
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full border border-black/7 dark:border-white/10 overflow-hidden">
                            <UnifiedSportsImageClient
                              src={getPlayerPhoto(player.id)}
                              alt={displayName}
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                              variant="circle"
                            />
                          </div>
                          {/* 팀 로고 뱃지 */}
                          {selectedTeam && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-white dark:bg-[#1D1D1D] shadow flex items-center justify-center">
                              <UnifiedSportsImageClient
                                src={selectedTeamLogoUrl || TEAM_PLACEHOLDER}
                                alt={selectedTeam.name_ko}
                                width={10}
                                height={10}
                                className="w-full h-full object-contain"
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
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              className="px-3 py-1.5 text-xs"
            >
              취소
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
