'use client';

import { useState, useCallback } from 'react';
import Formation from './Formation';
import PlayerEvents from './components/PlayerEvents';
import PlayerStatsModal from './components/PlayerStatsModal';
import { TeamLineup, MatchEvent } from '@/domains/livescore/types/match';
import { EmptyState } from '@/domains/livescore/components/common/CommonComponents';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';
import { getTeamById } from '@/domains/livescore/constants/teams';
import { PlayerKoreanNames } from '../../MatchPageClient';
import { Container, ContainerHeader, ContainerTitle, ContainerContent } from '@/shared/components/ui';
import { AllPlayerStatsResponse, PlayerStatsData } from '@/domains/livescore/types/lineup';

interface Player {
  id: number;
  name: string;
  number: number;
  pos: string;
  grid: string | null;
  captain?: boolean;
  photo?: string;
}

interface LineupsProps {
  matchId: string;
  matchData?: {
    lineups?: {
      response: {
        home: TeamLineup;
        away: TeamLineup;
      } | null;
    };
    events?: MatchEvent[];
    homeTeam?: {
      id: number;
      name: string;
      logo: string;
    };
    awayTeam?: {
      id: number;
      name: string;
      logo: string;
    };
    fixture?: {
      status?: {
        short?: string;
      };
    };
  };
  // 서버에서 프리로드된 전체 선수 통계 데이터 (평점, 주장, 통계 포함)
  allPlayerStats?: AllPlayerStatsResponse | null;
  playerKoreanNames?: PlayerKoreanNames;
}

export default function Lineups({ matchId, matchData, allPlayerStats, playerKoreanNames = {} }: LineupsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<{
    id: number;
    name: string;
    number: string;
    pos: string;
    photo?: string;
    team: {
      id: number;
      name: string;
    };
  } | null>(null);
  // 현재 팀의 선수 목록과 인덱스 (네비게이션용)
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

  // 서버에서 프리로드된 데이터 사용 (클라이언트 fetch 제거)
  const playersRatings = allPlayerStats?.ratings ?? {};
  const captainIds = allPlayerStats?.captainIds ?? [];

  // 전체 선수 통계 데이터 (모달에서 사용)
  const allPlayersData = allPlayerStats?.allPlayersData ?? [];

  // 주장 여부 확인 헬퍼 함수 (lineup API 데이터 또는 player stats API 데이터 사용)
  const isCaptain = (playerId: number, lineupCaptain?: boolean): boolean => {
    return lineupCaptain === true || captainIds.includes(playerId);
  };

  const lineups = matchData?.lineups?.response || null;
  const events = matchData?.events || [];

  // 팀 이름 헬퍼 함수
  const getTeamDisplayName = (id: number, fallbackName: string): string => {
    const teamInfo = getTeamById(id);
    return teamInfo?.name_ko || fallbackName;
  };

  // 포메이션 데이터를 가공하는 함수
  const prepareFormationData = useCallback((teamLineup: TeamLineup) => {
    if (!teamLineup || !teamLineup.startXI) return null;
    
    return {
      team: {
        id: teamLineup.team.id,
        name: teamLineup.team.name,
        colors: teamLineup.team.colors || {
          player: {
            primary: '1a5f35',
            number: 'ffffff',
            border: '1a5f35'
          },
          goalkeeper: {
            primary: 'ffd700',
            number: '000000',
            border: 'ffd700'
          }
        }
      },
      formation: teamLineup.formation,
      startXI: teamLineup.startXI.map(item => {
        // API 응답에 따라 player가 직접 제공되거나 중첩 구조로 제공될 수 있음
        const playerData = 'player' in item ? item.player : item;
        return {
          id: playerData.id,
          name: playerData.name,
          number: playerData.number,
          pos: playerData.pos,
          grid: playerData.grid || '',
          captain: playerData.captain || false,
          photo: playerData.photo || ''
        };
      })
    };
  }, []);
  

  const handlePlayerClick = useCallback((player: Player, teamId: number, teamName: string, allPlayers: Player[]) => {
    const index = allPlayers.findIndex(p => p.id === player.id);
    setTeamPlayers(allPlayers);
    setCurrentPlayerIndex(index >= 0 ? index : 0);
    setSelectedPlayer({
      id: player.id,
      name: player.name,
      number: player.number.toString(),
      pos: player.pos || '',
      photo: player.photo,
      team: { id: teamId, name: teamName }
    });
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // 선수 네비게이션
  const handlePrevPlayer = useCallback(() => {
    if (currentPlayerIndex > 0 && selectedPlayer) {
      const newIndex = currentPlayerIndex - 1;
      const player = teamPlayers[newIndex];
      setCurrentPlayerIndex(newIndex);
      setSelectedPlayer({
        ...selectedPlayer,
        id: player.id,
        name: player.name,
        number: player.number.toString(),
        pos: player.pos || '',
        photo: player.photo,
      });
    }
  }, [currentPlayerIndex, teamPlayers, selectedPlayer]);

  const handleNextPlayer = useCallback(() => {
    if (currentPlayerIndex < teamPlayers.length - 1 && selectedPlayer) {
      const newIndex = currentPlayerIndex + 1;
      const player = teamPlayers[newIndex];
      setCurrentPlayerIndex(newIndex);
      setSelectedPlayer({
        ...selectedPlayer,
        id: player.id,
        name: player.name,
        number: player.number.toString(),
        pos: player.pos || '',
        photo: player.photo,
      });
    }
  }, [currentPlayerIndex, teamPlayers, selectedPlayer]);

  const matchStatus = matchData?.fixture?.status?.short;

  if (!lineups) {
    return <EmptyState title="라인업 정보가 없습니다" message="현재 이 경기에 대한 라인업 정보를 제공할 수 없습니다." />;
  }

  const homeTeam = matchData?.homeTeam || { id: 0, name: '홈팀', logo: '/placeholder-team.png' };
  const awayTeam = matchData?.awayTeam || { id: 0, name: '원정팀', logo: '/placeholder-team.png' };
  const homeLineup = lineups.home;
  const awayLineup = lineups.away;

  // 팀별 전체 선수 목록 (선발 + 교체) - 네비게이션용
  const homeAllPlayers: Player[] = [
    ...(homeLineup.startXI?.map(item => item.player) || []),
    ...(homeLineup.substitutes?.map(item => item.player) || [])
  ];
  const awayAllPlayers: Player[] = [
    ...(awayLineup.startXI?.map(item => item.player) || []),
    ...(awayLineup.substitutes?.map(item => item.player) || [])
  ];

  // 포메이션 데이터 준비
  const homeFormationData = prepareFormationData(homeLineup);
  const awayFormationData = prepareFormationData(awayLineup);
  
  return (
    <div>
      {/* 포메이션 시각화 - 제일 상단에 배치 */}
      {(homeFormationData && awayFormationData) && (
        <div className="mb-4">
          <Formation
            homeTeamData={homeFormationData}
            awayTeamData={awayFormationData}
            matchStatus={matchStatus}
            playersRatings={playersRatings}
            playerKoreanNames={playerKoreanNames}
          />
        </div>
      )}
      
      {/* 데스크톱: 기존 테이블 레이아웃 */}
      <div className="hidden md:block">
      {/* 선발 라인업 테이블 */}
      <Container className="bg-white dark:bg-[#1D1D1D] mb-4">
        <ContainerHeader>
          <ContainerTitle>선발 라인업</ContainerTitle>
        </ContainerHeader>
        <ContainerContent className="p-0">
          <table className="min-w-full">
            <thead className="bg-[#F5F5F5] dark:bg-[#262626]">
              <tr>
                <th scope="col" className="w-1/2 py-3 px-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400 border-r border-black/5 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <UnifiedSportsImage
                      imageId={homeTeam.id}
                      imageType={ImageType.Teams}
                      alt={`${getTeamDisplayName(homeTeam.id, homeTeam.name)} 로고`}
                      size="sm"
                      variant="square"
                      priority={true}
                      fit="contain"
                    />
                    <span className="font-medium text-gray-900 dark:text-gray-100">{getTeamDisplayName(homeTeam.id, homeTeam.name)}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">{homeLineup.formation}</span>
                  </div>
                </th>
                <th scope="col" className="w-1/2 py-3 px-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <UnifiedSportsImage
                      imageId={awayTeam.id}
                      imageType={ImageType.Teams}
                      alt={`${getTeamDisplayName(awayTeam.id, awayTeam.name)} 로고`}
                      size="sm"
                      variant="square"
                      priority={true}
                      fit="contain"
                    />
                    <span className="font-medium text-gray-900 dark:text-gray-100">{getTeamDisplayName(awayTeam.id, awayTeam.name)}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">{awayLineup.formation}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/10 bg-white dark:bg-[#1D1D1D]">

            {/* 선발 라인업 행 생성 - 최대 11명 */}
            {Array.from({ length: Math.max(
              homeLineup.startXI?.length || 0,
              awayLineup.startXI?.length || 0
            ) }).map((_, index) => (
              <tr key={`startXI-${index}`} className={index % 2 === 0 ? 'bg-white dark:bg-[#1D1D1D]' : 'bg-[#F5F5F5] dark:bg-[#2D2D2D]'}>
                <td className="border-r border-black/5 dark:border-white/10">
                  {homeLineup.startXI && index < homeLineup.startXI.length && (
                    <div
                      className="flex items-center gap-3 cursor-pointer hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors py-2 px-4"
                      onClick={() => handlePlayerClick(
                        homeLineup.startXI[index].player,
                        homeTeam.id,
                        homeTeam.name,
                        homeAllPlayers
                      )}
                    >
                      <div className="relative">
                        {homeLineup.startXI[index].player.id ? (
                          <UnifiedSportsImage
                            imageId={homeLineup.startXI[index].player.id}
                            imageType={ImageType.Players}
                            alt={`${homeLineup.startXI[index].player.name} 선수 사진`}
                            size="lg"
                            variant="circle"
                            priority={index < 5}
                                                      />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-sm bg-[#F5F5F5] dark:bg-[#262626] rounded-full">
                            {homeLineup.startXI[index].player.number || '-'}
                          </div>
                        )}
                        {isCaptain(homeLineup.startXI[index].player.id, homeLineup.startXI[index].player.captain) && (
                          <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                            C
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-900 dark:text-gray-100">
                          {/* 선수 한국어 이름 매핑 */}
                          {playerKoreanNames[homeLineup.startXI[index].player.id] || homeLineup.startXI[index].player.name}
                          {isCaptain(homeLineup.startXI[index].player.id, homeLineup.startXI[index].player.captain) && (
                            <span className="ml-1 text-xs text-yellow-600 dark:text-yellow-400 font-semibold">(주장)</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center flex-wrap">
                          {homeLineup.startXI[index].player.pos || '-'} {homeLineup.startXI[index].player.number}
                          <PlayerEvents player={homeLineup.startXI[index].player} events={events} />
                        </div>
                      </div>
                    </div>
                  )}
                </td>
                <td>
                  {awayLineup.startXI && index < awayLineup.startXI.length && (
                    <div
                      className="flex items-center gap-3 cursor-pointer hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors py-2 px-4"
                      onClick={() => handlePlayerClick(
                        awayLineup.startXI[index].player,
                        awayTeam.id,
                        awayTeam.name,
                        awayAllPlayers
                      )}
                    >
                      <div className="relative">
                        {awayLineup.startXI[index].player.id ? (
                          <UnifiedSportsImage
                            imageId={awayLineup.startXI[index].player.id}
                            imageType={ImageType.Players}
                            alt={`${awayLineup.startXI[index].player.name} 선수 사진`}
                            size="lg"
                            variant="circle"
                            priority={index < 5}
                                                      />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-sm bg-[#F5F5F5] dark:bg-[#262626] rounded-full">
                            {awayLineup.startXI[index].player.number || '-'}
                          </div>
                        )}
                        {isCaptain(awayLineup.startXI[index].player.id, awayLineup.startXI[index].player.captain) && (
                          <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                            C
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-900 dark:text-gray-100">
                          {/* 선수 한국어 이름 매핑 */}
                          {playerKoreanNames[awayLineup.startXI[index].player.id] || awayLineup.startXI[index].player.name}
                          {isCaptain(awayLineup.startXI[index].player.id, awayLineup.startXI[index].player.captain) && (
                            <span className="ml-1 text-xs text-yellow-600 dark:text-yellow-400 font-semibold">(주장)</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center flex-wrap">
                          {awayLineup.startXI[index].player.pos || '-'} {awayLineup.startXI[index].player.number}
                          <PlayerEvents player={awayLineup.startXI[index].player} events={events} />
                        </div>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </ContainerContent>
      </Container>

      {/* 교체 선수 테이블 */}
      <Container className="bg-white dark:bg-[#1D1D1D] mb-4">
        <ContainerHeader>
          <ContainerTitle>교체 선수</ContainerTitle>
        </ContainerHeader>
        <ContainerContent className="p-0">
          <table className="min-w-full">
            <tbody className="divide-y divide-black/5 dark:divide-white/10 bg-white dark:bg-[#1D1D1D]">

            {/* 교체 선수 행 생성 */}
            {Array.from({ length: Math.max(
              homeLineup.substitutes?.length || 0,
              awayLineup.substitutes?.length || 0
            ) }).map((_, index) => (
              <tr key={`subs-${index}`} className={index % 2 === 0 ? 'bg-white dark:bg-[#1D1D1D]' : 'bg-[#F5F5F5] dark:bg-[#2D2D2D]'}>
                <td className="w-1/2 border-r border-black/5 dark:border-white/10">
                  {homeLineup.substitutes && index < homeLineup.substitutes.length && (
                    <div
                      className="flex items-center gap-3 cursor-pointer hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors py-2 px-4"
                      onClick={() => handlePlayerClick(
                        homeLineup.substitutes[index].player,
                        homeTeam.id,
                        homeTeam.name,
                        homeAllPlayers
                      )}
                    >
                      <div className="relative">
                        {homeLineup.substitutes[index].player.id ? (
                          <UnifiedSportsImage
                            imageId={homeLineup.substitutes[index].player.id}
                            imageType={ImageType.Players}
                            alt={`${homeLineup.substitutes[index].player.name} 선수 사진`}
                            size="lg"
                            variant="circle"
                                                      />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-sm bg-[#F5F5F5] dark:bg-[#262626] rounded-full">
                            {homeLineup.substitutes[index].player.number || '-'}
                          </div>
                        )}
                        {isCaptain(homeLineup.substitutes[index].player.id, homeLineup.substitutes[index].player.captain) && (
                          <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                            C
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-900 dark:text-gray-100">
                          {/* 선수 한국어 이름 매핑 */}
                          {playerKoreanNames[homeLineup.substitutes[index].player.id] || homeLineup.substitutes[index].player.name}
                          {isCaptain(homeLineup.substitutes[index].player.id, homeLineup.substitutes[index].player.captain) && (
                            <span className="ml-1 text-xs text-yellow-600 dark:text-yellow-400 font-semibold">(주장)</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center flex-wrap">
                          {homeLineup.substitutes[index].player.pos || '-'} {homeLineup.substitutes[index].player.number}
                          <PlayerEvents player={homeLineup.substitutes[index].player} events={events} />
                        </div>
                      </div>
                    </div>
                  )}
                </td>
                <td className="w-1/2">
                  {awayLineup.substitutes && index < awayLineup.substitutes.length && (
                    <div
                      className="flex items-center gap-3 cursor-pointer hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors py-2 px-4"
                      onClick={() => handlePlayerClick(
                        awayLineup.substitutes[index].player,
                        awayTeam.id,
                        awayTeam.name,
                        awayAllPlayers
                      )}
                    >
                      <div className="relative">
                        {awayLineup.substitutes[index].player.id ? (
                          <UnifiedSportsImage
                            imageId={awayLineup.substitutes[index].player.id}
                            imageType={ImageType.Players}
                            alt={`${awayLineup.substitutes[index].player.name} 선수 사진`}
                            size="lg"
                            variant="circle"
                                                      />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-sm bg-[#F5F5F5] dark:bg-[#262626] rounded-full">
                            {awayLineup.substitutes[index].player.number || '-'}
                          </div>
                        )}
                        {isCaptain(awayLineup.substitutes[index].player.id, awayLineup.substitutes[index].player.captain) && (
                          <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                            C
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-900 dark:text-gray-100">
                          {/* 선수 한국어 이름 매핑 */}
                          {playerKoreanNames[awayLineup.substitutes[index].player.id] || awayLineup.substitutes[index].player.name}
                          {isCaptain(awayLineup.substitutes[index].player.id, awayLineup.substitutes[index].player.captain) && (
                            <span className="ml-1 text-xs text-yellow-600 dark:text-yellow-400 font-semibold">(주장)</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center flex-wrap">
                          {awayLineup.substitutes[index].player.pos || '-'} {awayLineup.substitutes[index].player.number}
                          <PlayerEvents player={awayLineup.substitutes[index].player} events={events} />
                        </div>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </ContainerContent>
      </Container>

      {/* 감독 테이블 - 둘 다 있을 때만 표시 */}
      {homeLineup.coach && awayLineup.coach && homeLineup.coach.name && awayLineup.coach.name && (
        <Container className="bg-white dark:bg-[#1D1D1D]">
          <ContainerHeader>
            <ContainerTitle>감독</ContainerTitle>
          </ContainerHeader>
          <ContainerContent className="p-0">
            <table className="min-w-full">
              <tbody className="bg-white dark:bg-[#1D1D1D]">
                <tr>
                  <td className="w-1/2 py-2 px-4 border-r border-black/5 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      {homeLineup.coach?.id ? (
                        <UnifiedSportsImage
                          imageId={homeLineup.coach.id}
                          imageType={ImageType.Coachs}
                          alt={`${homeLineup.coach?.name || '감독'} 사진`}
                          size="lg"
                          variant="circle"
                                                  />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#F5F5F5] dark:bg-[#262626] border border-black/7 dark:border-white/10 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="text-xs text-gray-900 dark:text-gray-100">{homeLineup.coach?.name || '정보 없음'}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">감독</div>
                      </div>
                    </div>
                  </td>
                  <td className="w-1/2 py-2 px-4">
                    <div className="flex items-center gap-3">
                      {awayLineup.coach?.id ? (
                        <UnifiedSportsImage
                          imageId={awayLineup.coach.id}
                          imageType={ImageType.Coachs}
                          alt={`${awayLineup.coach?.name || '감독'} 사진`}
                          size="lg"
                          variant="circle"
                                                  />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#F5F5F5] dark:bg-[#262626] border border-black/7 dark:border-white/10 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="text-xs text-gray-900 dark:text-gray-100">{awayLineup.coach?.name || '정보 없음'}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">감독</div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </ContainerContent>
        </Container>
      )}
      </div>

      {/* 모바일: 팀별 세로 레이아웃 */}
      <div className="md:hidden space-y-4">
        {/* 홈팀 전체 섹션 */}
        <div className="space-y-4">
          {/* 홈팀 선발 라인업 */}
          <Container className="bg-white dark:bg-[#1D1D1D]">
            <ContainerHeader>
              <div className="flex items-center justify-between w-full">
                <ContainerTitle>선발 라인업</ContainerTitle>
                <div className="flex items-center gap-2">
                  <UnifiedSportsImage
                    imageId={homeTeam.id}
                    imageType={ImageType.Teams}
                    alt={`${getTeamDisplayName(homeTeam.id, homeTeam.name)} 로고`}
                    size="sm"
                    variant="square"
                    priority={true}
                    fit="contain"
                  />
                  <div>
                    <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                      {getTeamDisplayName(homeTeam.id, homeTeam.name)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {homeLineup.formation}
                    </div>
                  </div>
                </div>
              </div>
            </ContainerHeader>
            <ContainerContent className="p-0">
              <div className="divide-y divide-black/5 dark:divide-white/10">
                {homeLineup.startXI?.map((item, index) => (
                  <div
                    key={`home-start-${index}`}
                    className="flex items-center gap-3 cursor-pointer hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors py-2 px-4"
                    onClick={() => handlePlayerClick(item.player, homeTeam.id, homeTeam.name, homeAllPlayers)}
                  >
                    <div className="relative">
                      {item.player.id ? (
                        <UnifiedSportsImage
                          imageId={item.player.id}
                          imageType={ImageType.Players}
                          alt={`${item.player.name} 선수 사진`}
                          size="lg"
                          variant="circle"
                          priority={index < 5}
                                                  />
                      ) : (
                        <div className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-sm bg-[#F5F5F5] dark:bg-[#262626] rounded-full">
                          {item.player.number || '-'}
                        </div>
                      )}
                      {isCaptain(item.player.id, item.player.captain) && (
                        <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                          C
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-900 dark:text-gray-100">
                        {playerKoreanNames[item.player.id] || item.player.name}
                        {isCaptain(item.player.id, item.player.captain) && (
                          <span className="ml-1 text-xs text-yellow-600 dark:text-yellow-400 font-semibold">(주장)</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center flex-wrap">
                        {item.player.pos || '-'} {item.player.number}
                        <PlayerEvents player={item.player} events={events} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ContainerContent>
          </Container>

          {/* 홈팀 교체 선수 */}
          <Container className="bg-white dark:bg-[#1D1D1D]">
            <ContainerHeader>
              <ContainerTitle>교체 선수</ContainerTitle>
            </ContainerHeader>
            <ContainerContent className="p-0">
              <div className="divide-y divide-black/5 dark:divide-white/10">
                {homeLineup.substitutes?.map((item, index) => (
                  <div
                    key={`home-sub-${index}`}
                    className="flex items-center gap-3 cursor-pointer hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors py-2 px-4"
                    onClick={() => handlePlayerClick(item.player, homeTeam.id, homeTeam.name, homeAllPlayers)}
                  >
                    <div className="relative">
                      {item.player.id ? (
                        <UnifiedSportsImage
                          imageId={item.player.id}
                          imageType={ImageType.Players}
                          alt={`${item.player.name} 선수 사진`}
                          size="lg"
                          variant="circle"
                                                  />
                      ) : (
                        <div className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-sm bg-[#F5F5F5] dark:bg-[#262626] rounded-full">
                          {item.player.number || '-'}
                        </div>
                      )}
                      {isCaptain(item.player.id, item.player.captain) && (
                        <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                          C
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-900 dark:text-gray-100">
                        {playerKoreanNames[item.player.id] || item.player.name}
                        {isCaptain(item.player.id, item.player.captain) && (
                          <span className="ml-1 text-xs text-yellow-600 dark:text-yellow-400 font-semibold">(주장)</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center flex-wrap">
                        {item.player.pos || '-'} {item.player.number}
                        <PlayerEvents player={item.player} events={events} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ContainerContent>
          </Container>

          {/* 홈팀 감독 */}
          {homeLineup.coach && homeLineup.coach.name && (
            <Container className="bg-white dark:bg-[#1D1D1D]">
              <ContainerHeader>
                <ContainerTitle>감독</ContainerTitle>
              </ContainerHeader>
              <ContainerContent className="p-0">
                <div className="flex items-center gap-3 py-2 px-4">
                  {homeLineup.coach?.id ? (
                    <UnifiedSportsImage
                      imageId={homeLineup.coach.id}
                      imageType={ImageType.Coachs}
                      alt={`${homeLineup.coach?.name || '감독'} 사진`}
                      size="lg"
                      variant="circle"
                                          />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#F5F5F5] dark:bg-[#262626] border border-black/7 dark:border-white/10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-xs text-gray-900 dark:text-gray-100">{homeLineup.coach?.name || '정보 없음'}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">감독</div>
                  </div>
                </div>
              </ContainerContent>
            </Container>
          )}
        </div>

          {/* 원정팀 전체 섹션 */}
        <div className="space-y-4">
          {/* 원정팀 선발 라인업 */}
          <Container className="bg-white dark:bg-[#1D1D1D]">
            <ContainerHeader>
              <div className="flex items-center justify-between w-full">
                <ContainerTitle>선발 라인업</ContainerTitle>
                <div className="flex items-center gap-2">
                  <UnifiedSportsImage
                    imageId={awayTeam.id}
                    imageType={ImageType.Teams}
                    alt={`${getTeamDisplayName(awayTeam.id, awayTeam.name)} 로고`}
                    size="sm"
                    variant="square"
                    priority={true}
                    fit="contain"
                  />
                  <div>
                    <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                      {getTeamDisplayName(awayTeam.id, awayTeam.name)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {awayLineup.formation}
                    </div>
                  </div>
                </div>
              </div>
            </ContainerHeader>
            <ContainerContent className="p-0">
              <div className="divide-y divide-black/5 dark:divide-white/10">
                {awayLineup.startXI?.map((item, index) => (
                  <div
                    key={`away-start-${index}`}
                    className="flex items-center gap-3 cursor-pointer hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors py-2 px-4"
                    onClick={() => handlePlayerClick(item.player, awayTeam.id, awayTeam.name, awayAllPlayers)}
                  >
                    <div className="relative">
                      {item.player.id ? (
                        <UnifiedSportsImage
                          imageId={item.player.id}
                          imageType={ImageType.Players}
                          alt={`${item.player.name} 선수 사진`}
                          size="lg"
                          variant="circle"
                          priority={index < 5}
                                                  />
                      ) : (
                        <div className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-sm bg-[#F5F5F5] dark:bg-[#262626] rounded-full">
                          {item.player.number || '-'}
                        </div>
                      )}
                      {isCaptain(item.player.id, item.player.captain) && (
                        <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                          C
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-900 dark:text-gray-100">
                        {playerKoreanNames[item.player.id] || item.player.name}
                        {isCaptain(item.player.id, item.player.captain) && (
                          <span className="ml-1 text-xs text-yellow-600 dark:text-yellow-400 font-semibold">(주장)</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center flex-wrap">
                        {item.player.pos || '-'} {item.player.number}
                        <PlayerEvents player={item.player} events={events} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ContainerContent>
          </Container>

          {/* 원정팀 교체 선수 */}
          <Container className="bg-white dark:bg-[#1D1D1D]">
            <ContainerHeader>
              <ContainerTitle>교체 선수</ContainerTitle>
            </ContainerHeader>
            <ContainerContent className="p-0">
              <div className="divide-y divide-black/5 dark:divide-white/10">
                {awayLineup.substitutes?.map((item, index) => (
                  <div
                    key={`away-sub-${index}`}
                    className="flex items-center gap-3 cursor-pointer hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors py-2 px-4"
                    onClick={() => handlePlayerClick(item.player, awayTeam.id, awayTeam.name, awayAllPlayers)}
                  >
                    <div className="relative">
                      {item.player.id ? (
                        <UnifiedSportsImage
                          imageId={item.player.id}
                          imageType={ImageType.Players}
                          alt={`${item.player.name} 선수 사진`}
                          size="lg"
                          variant="circle"
                                                  />
                      ) : (
                        <div className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-sm bg-[#F5F5F5] dark:bg-[#262626] rounded-full">
                          {item.player.number || '-'}
                        </div>
                      )}
                      {isCaptain(item.player.id, item.player.captain) && (
                        <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                          C
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-900 dark:text-gray-100">
                        {playerKoreanNames[item.player.id] || item.player.name}
                        {isCaptain(item.player.id, item.player.captain) && (
                          <span className="ml-1 text-xs text-yellow-600 dark:text-yellow-400 font-semibold">(주장)</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center flex-wrap">
                        {item.player.pos || '-'} {item.player.number}
                        <PlayerEvents player={item.player} events={events} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ContainerContent>
          </Container>

          {/* 원정팀 감독 */}
          {awayLineup.coach && awayLineup.coach.name && (
            <Container className="bg-white dark:bg-[#1D1D1D]">
              <ContainerHeader>
                <ContainerTitle>감독</ContainerTitle>
              </ContainerHeader>
              <ContainerContent className="p-0">
                <div className="flex items-center gap-3 py-2 px-4">
                  {awayLineup.coach?.id ? (
                    <UnifiedSportsImage
                      imageId={awayLineup.coach.id}
                      imageType={ImageType.Coachs}
                      alt={`${awayLineup.coach?.name || '감독'} 사진`}
                      size="lg"
                      variant="circle"
                                          />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#F5F5F5] dark:bg-[#262626] border border-black/7 dark:border-white/10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-xs text-gray-900 dark:text-gray-100">{awayLineup.coach?.name || '정보 없음'}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">감독</div>
                  </div>
                </div>
              </ContainerContent>
            </Container>
          )}
        </div>
      </div>
      
      {/* 선수 통계 모달 */}
      {selectedPlayer && (
        <PlayerStatsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          playerId={selectedPlayer.id}
          playerInfo={{
            name: playerKoreanNames[selectedPlayer.id] || selectedPlayer.name,
            number: selectedPlayer.number,
            pos: selectedPlayer.pos,
            photo: selectedPlayer.photo,
            team: {
              id: selectedPlayer.team.id,
              name: getTeamDisplayName(selectedPlayer.team.id, selectedPlayer.team.name)
            }
          }}
          allPlayersData={allPlayersData}
          onPrevPlayer={handlePrevPlayer}
          onNextPlayer={handleNextPlayer}
          hasPrev={currentPlayerIndex > 0}
          hasNext={currentPlayerIndex < teamPlayers.length - 1}
        />
      )}
    </div>
  );
} 