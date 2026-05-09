'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Formation from './Formation';
import PlayerEvents from './components/PlayerEvents';
import PlayerStatsModal from './components/PlayerStatsModal';
import { MatchEvent } from '@/domains/livescore/types/match';
import { TeamLineup } from '@/domains/livescore/types/lineup';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import { useTeamLeague } from '@/shared/context/TeamLeagueContext';
import { PlayerKoreanNames } from '../../MatchPageClient';
import { Container, ContainerHeader, ContainerTitle, ContainerContent } from '@/shared/components/ui';
import { AllPlayerStatsResponse, PlayerStatsData } from '@/domains/livescore/types/lineup';
import { getPlayerHref } from '@/domains/livescore/utils/entityLinks';

// 4590 표준: Placeholder 상수
const PLAYER_PLACEHOLDER = '/images/placeholder-player.svg';
const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';
const COACH_PLACEHOLDER = '/images/placeholder-coach.svg';

const LineupInlineEmpty = ({ message }: { message: string }) => (
  <div className="px-3 py-4 text-center text-[13px] text-gray-500 dark:text-gray-400">
    {message}
  </div>
);

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
  // 4590 표준: 서버에서 전달받은 Storage URL 맵
  teamLogoUrls?: Record<number, string>;
  playerPhotoUrls?: Record<number, string>;
  isLoading?: boolean;
}

export default function Lineups({ matchId, matchData, allPlayerStats, playerKoreanNames = {}, teamLogoUrls = {}, playerPhotoUrls = {}, isLoading = false }: LineupsProps) {
  const { getTeamById } = useTeamLeague();
  // 4590 표준: 헬퍼 함수
  const getTeamLogo = (id: number) => teamLogoUrls[id] || TEAM_PLACEHOLDER;
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

  const matchStatus = matchData?.fixture?.status?.short;
  const initialLineups = matchData?.lineups?.response;
  const initialEvents = matchData?.events;
  const resolvedLineups = initialLineups ?? null;
  const resolvedEvents = initialEvents ?? [];
  const resolvedPlayerStats = allPlayerStats ?? null;

  // 서버에서 프리로드된 데이터 사용 (클라이언트 fetch 제거)
  const playersRatings = resolvedPlayerStats?.ratings ?? {};
  const captainIds = resolvedPlayerStats?.captainIds ?? [];

  // 전체 선수 통계 데이터 (모달에서 사용)
  const allPlayersData = resolvedPlayerStats?.allPlayersData ?? [];

  // 주장 여부 확인 헬퍼 함수 (lineup API 데이터 또는 player stats API 데이터 사용)
  const isCaptain = (playerId: number, lineupCaptain?: boolean): boolean => {
    return lineupCaptain === true || captainIds.includes(playerId);
  };

  const rawLineups = resolvedLineups;
  const events = resolvedEvents;
  const lineupPlayerIds = useMemo(() => {
    if (!rawLineups) return [];

    const ids = new Set<number>();
    rawLineups.home?.startXI?.forEach(item => item.player?.id && ids.add(item.player.id));
    rawLineups.home?.substitutes?.forEach(item => item.player?.id && ids.add(item.player.id));
    rawLineups.away?.startXI?.forEach(item => item.player?.id && ids.add(item.player.id));
    rawLineups.away?.substitutes?.forEach(item => item.player?.id && ids.add(item.player.id));
    return Array.from(ids);
  }, [rawLineups]);

  const lineups = useMemo(() => {
    if (!rawLineups) return null;

    const photoMap = playerPhotoUrls;
    const normalizePhoto = (player: Player) => (
      photoMap[player.id]
      || (player.photo?.includes('media.api-sports.io') ? PLAYER_PLACEHOLDER : player.photo)
      || PLAYER_PLACEHOLDER
    );
    const mergePlayers = (items: TeamLineup['startXI']) => items.map(item => ({
      ...item,
      player: {
        ...item.player,
        photo: normalizePhoto(item.player),
      },
    }));

    return {
      home: {
        ...rawLineups.home,
        startXI: mergePlayers(rawLineups.home?.startXI || []),
        substitutes: mergePlayers(rawLineups.home?.substitutes || []),
      },
      away: {
        ...rawLineups.away,
        startXI: mergePlayers(rawLineups.away?.startXI || []),
        substitutes: mergePlayers(rawLineups.away?.substitutes || []),
      },
    };
  }, [rawLineups, playerPhotoUrls]);

  const mergedPlayerKoreanNames = useMemo(() => ({
    ...playerKoreanNames,
  }), [playerKoreanNames]);

  // 팀 이름 헬퍼 함수
  const getTeamDisplayName = (id: number, fallbackName: string): string => {
    const teamInfo = getTeamById(id);
    return teamInfo?.name_ko || fallbackName;
  };
  const renderPlayerName = (player: Player) => {
    const displayName = mergedPlayerKoreanNames[player.id] || player.name;
    if (!player.id) return displayName;

    return (
      <Link
        href={getPlayerHref(player)}
        className="hover:underline"
        prefetch={false}
        onClick={(event) => event.stopPropagation()}
      >
        {displayName}
      </Link>
    );
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

  const homeTeam = matchData?.homeTeam || { id: 0, name: '홈팀', logo: '/placeholder-team.svg' };
  const awayTeam = matchData?.awayTeam || { id: 0, name: '원정팀', logo: '/placeholder-team.svg' };
  const createEmptyLineup = (team: typeof homeTeam): TeamLineup => ({
    team: {
      id: team.id,
      name: team.name,
      logo: team.logo,
    },
    formation: '-',
    startXI: [],
    substitutes: [],
  });
  const homeLineup = lineups?.home ?? createEmptyLineup(homeTeam);
  const awayLineup = lineups?.away ?? createEmptyLineup(awayTeam);
  const isLineupsLoading = isLoading;

  // 팀별 전체 선수 목록 (선발 + 교체) - 네비게이션용
  const homeAllPlayers: Player[] = [
    ...(homeLineup.startXI?.map(item => item.player) || []),
    ...(homeLineup.substitutes?.map(item => item.player) || [])
  ];
  const awayAllPlayers: Player[] = [
    ...(awayLineup.startXI?.map(item => item.player) || []),
    ...(awayLineup.substitutes?.map(item => item.player) || [])
  ];

  const renderTeamHeader = (team: typeof homeTeam, formation?: string) => (
    <div className="flex items-center gap-2 border-b border-black/5 bg-[#F5F5F5] px-4 py-3 dark:border-white/10 dark:bg-[#262626]">
      <UnifiedSportsImageClient
        src={getTeamLogo(team.id)}
        alt={`${getTeamDisplayName(team.id, team.name)} 로고`}
        size="sm"
        variant="square"
        priority={true}
        fit="contain"
      />
      <span className="min-w-0 truncate text-[13px] font-medium text-gray-900 dark:text-gray-100">
        {getTeamDisplayName(team.id, team.name)}
      </span>
      {formation && (
        <span className="ml-auto flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
          {formation}
        </span>
      )}
    </div>
  );

  const renderPlayerRow = (
    player: Player,
    index: number,
    team: typeof homeTeam,
    allPlayers: Player[],
    priority = false
  ) => (
    <li
      key={`${team.id}-${player.id || player.name}-${index}`}
      className="flex cursor-pointer items-center gap-3 px-4 py-2 transition-colors hover:bg-[#EAEAEA] dark:hover:bg-[#333333]"
      onClick={() => handlePlayerClick(player, team.id, team.name, allPlayers)}
    >
      <div className="relative flex-shrink-0">
        {player.id ? (
          <UnifiedSportsImageClient
            src={player.photo || PLAYER_PLACEHOLDER}
            alt={`${player.name} 선수 사진`}
            size="lg"
            variant="circle"
            priority={priority}
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F5F5] text-[13px] font-bold text-gray-700 dark:bg-[#262626] dark:text-gray-300">
            {player.number || '-'}
          </div>
        )}
        {isCaptain(player.id, player.captain) && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-white">
            C
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs text-gray-900 dark:text-gray-100">
          {renderPlayerName(player)}
          {isCaptain(player.id, player.captain) && (
            <span className="ml-1 text-xs font-semibold text-yellow-600 dark:text-yellow-400">(주장)</span>
          )}
        </div>
        <div className="flex flex-wrap items-center text-xs text-gray-500 dark:text-gray-400">
          {player.pos || '-'} {player.number}
          <PlayerEvents player={player} events={events} />
        </div>
      </div>
    </li>
  );

  const renderLineupList = (
    players: TeamLineup['startXI'],
    team: typeof homeTeam,
    allPlayers: Player[],
    emptyMessage: string,
    prioritizeImages = false
  ) => (
    <ul className="divide-y divide-black/5 dark:divide-white/10">
      {(!players || players.length === 0) ? (
        <li>
          <LineupInlineEmpty message={isLineupsLoading ? '불러오는 중...' : emptyMessage} />
        </li>
      ) : (
        players.map((item, index) => renderPlayerRow(item.player, index, team, allPlayers, prioritizeImages && index < 5))
      )}
    </ul>
  );

  const renderCoach = (coach: TeamLineup['coach'] | undefined) => (
    <div className="flex items-center gap-3 px-4 py-2">
      {coach?.id ? (
        <UnifiedSportsImageClient
          src={coach.photo || COACH_PLACEHOLDER}
          alt={`${coach.name || '감독'} 사진`}
          size="lg"
          variant="circle"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-black/7 bg-[#F5F5F5] dark:border-white/10 dark:bg-[#262626]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs text-gray-900 dark:text-gray-100">{coach?.name || '정보 없음'}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">감독</div>
      </div>
    </div>
  );

  const renderLineupPanel = (
    title: string,
    content: React.ReactNode
  ) => (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <ContainerHeader>
        <ContainerTitle>{title}</ContainerTitle>
      </ContainerHeader>
      <ContainerContent className="p-0">
        {content}
      </ContainerContent>
    </Container>
  );

  const renderTeamLineupColumn = (
    team: typeof homeTeam,
    lineup: TeamLineup,
    allPlayers: Player[]
  ) => (
    <div className="flex flex-col gap-4">
      <Container className="bg-white dark:bg-[#1D1D1D]">
        <ContainerContent className="p-0">
          {renderTeamHeader(team, lineup.formation)}
        </ContainerContent>
      </Container>
      {renderLineupPanel(
        '선발 라인업',
        renderLineupList(lineup.startXI, team, allPlayers, '선발 라인업 데이터가 없습니다.', true)
      )}
      {renderLineupPanel(
        '교체 선수',
        renderLineupList(lineup.substitutes, team, allPlayers, '교체 선수 데이터가 없습니다.')
      )}
      {renderLineupPanel(
        '감독',
        (lineup.coach?.name || isLineupsLoading)
          ? renderCoach(lineup.coach)
          : <LineupInlineEmpty message="감독 데이터가 없습니다." />
      )}
    </div>
  );

  // 포메이션 데이터 준비
  const homeFormationData = prepareFormationData(homeLineup);
  const awayFormationData = prepareFormationData(awayLineup);
  const hasFormationPlayers = (homeLineup.startXI?.length || 0) > 0 || (awayLineup.startXI?.length || 0) > 0;
  const isFormationLoading = isLineupsLoading && !hasFormationPlayers;
  
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
            playerKoreanNames={mergedPlayerKoreanNames}
            homeTeamDisplayName={getTeamDisplayName(homeTeam.id, homeTeam.name)}
            awayTeamDisplayName={getTeamDisplayName(awayTeam.id, awayTeam.name)}
            homeTeamLogoUrl={getTeamLogo(homeTeam.id)}
            awayTeamLogoUrl={getTeamLogo(awayTeam.id)}
            isLoading={isFormationLoading}
          />
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {renderTeamLineupColumn(homeTeam, homeLineup, homeAllPlayers)}
        {renderTeamLineupColumn(awayTeam, awayLineup, awayAllPlayers)}
      </div>

      {false && (
      <>
      
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
                <th scope="col" className="w-1/2 py-3 px-4 text-left text-[13px] font-medium text-gray-500 dark:text-gray-400 border-r border-black/5 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <UnifiedSportsImageClient
                      src={getTeamLogo(homeTeam.id)}
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
                <th scope="col" className="w-1/2 py-3 px-4 text-left text-[13px] font-medium text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <UnifiedSportsImageClient
                      src={getTeamLogo(awayTeam.id)}
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
            {(homeLineup.startXI?.length || 0) === 0 && (awayLineup.startXI?.length || 0) === 0 && (
              <tr>
                <td className="w-1/2 border-r border-black/5 dark:border-white/10">
                  <LineupInlineEmpty message={isLineupsLoading ? '불러오는 중...' : '선발 라인업 데이터가 없습니다.'} />
                </td>
                <td className="w-1/2">
                  <LineupInlineEmpty message={isLineupsLoading ? '불러오는 중...' : '선발 라인업 데이터가 없습니다.'} />
                </td>
              </tr>
            )}
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
                          <UnifiedSportsImageClient
                            src={homeLineup.startXI[index].player.photo || PLAYER_PLACEHOLDER}
                            alt={`${homeLineup.startXI[index].player.name} 선수 사진`}
                            size="lg"
                            variant="circle"
                            priority={index < 5}
                          />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-[13px] bg-[#F5F5F5] dark:bg-[#262626] rounded-full">
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
                          {renderPlayerName(homeLineup.startXI[index].player)}
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
                          <UnifiedSportsImageClient
                            src={awayLineup.startXI[index].player.photo || PLAYER_PLACEHOLDER}
                            alt={`${awayLineup.startXI[index].player.name} 선수 사진`}
                            size="lg"
                            variant="circle"
                            priority={index < 5}
                          />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-[13px] bg-[#F5F5F5] dark:bg-[#262626] rounded-full">
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
                          {renderPlayerName(awayLineup.startXI[index].player)}
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
            {(homeLineup.substitutes?.length || 0) === 0 && (awayLineup.substitutes?.length || 0) === 0 && (
              <tr>
                <td className="w-1/2 border-r border-black/5 dark:border-white/10">
                  <LineupInlineEmpty message={isLineupsLoading ? '불러오는 중...' : '교체 선수 데이터가 없습니다.'} />
                </td>
                <td className="w-1/2">
                  <LineupInlineEmpty message={isLineupsLoading ? '불러오는 중...' : '교체 선수 데이터가 없습니다.'} />
                </td>
              </tr>
            )}
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
                          <UnifiedSportsImageClient
                            src={homeLineup.substitutes[index].player.photo || PLAYER_PLACEHOLDER}
                            alt={`${homeLineup.substitutes[index].player.name} 선수 사진`}
                            size="lg"
                            variant="circle"
                          />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-[13px] bg-[#F5F5F5] dark:bg-[#262626] rounded-full">
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
                          {renderPlayerName(homeLineup.substitutes[index].player)}
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
                          <UnifiedSportsImageClient
                            src={awayLineup.substitutes[index].player.photo || PLAYER_PLACEHOLDER}
                            alt={`${awayLineup.substitutes[index].player.name} 선수 사진`}
                            size="lg"
                            variant="circle"
                          />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-[13px] bg-[#F5F5F5] dark:bg-[#262626] rounded-full">
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
                          {renderPlayerName(awayLineup.substitutes[index].player)}
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
      {(homeLineup.coach?.name || awayLineup.coach?.name) ? (
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
                        <UnifiedSportsImageClient
                          src={homeLineup.coach?.photo || COACH_PLACEHOLDER}
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
                        <UnifiedSportsImageClient
                          src={awayLineup.coach?.photo || COACH_PLACEHOLDER}
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
      ) : (
        <Container className="bg-white dark:bg-[#1D1D1D]">
          <ContainerHeader>
            <ContainerTitle>감독</ContainerTitle>
          </ContainerHeader>
          <ContainerContent className="p-0">
            <div className="grid grid-cols-2 divide-x divide-black/5 dark:divide-white/10">
              <LineupInlineEmpty message={isLineupsLoading ? '불러오는 중...' : '감독 데이터가 없습니다.'} />
              <LineupInlineEmpty message={isLineupsLoading ? '불러오는 중...' : '감독 데이터가 없습니다.'} />
            </div>
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
                  <UnifiedSportsImageClient
                    src={getTeamLogo(homeTeam.id)}
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
                {(!homeLineup.startXI || homeLineup.startXI.length === 0) && (
                  <LineupInlineEmpty message={isLineupsLoading ? '불러오는 중...' : '선발 라인업 데이터가 없습니다.'} />
                )}
                {homeLineup.startXI?.map((item, index) => (
                  <div
                    key={`home-start-${index}`}
                    className="flex items-center gap-3 cursor-pointer hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors py-2 px-4"
                    onClick={() => handlePlayerClick(item.player, homeTeam.id, homeTeam.name, homeAllPlayers)}
                  >
                    <div className="relative">
                      {item.player.id ? (
                        <UnifiedSportsImageClient
                          src={item.player.photo || PLAYER_PLACEHOLDER}
                          alt={`${item.player.name} 선수 사진`}
                          size="lg"
                          variant="circle"
                          priority={index < 5}
                        />
                      ) : (
                        <div className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-[13px] bg-[#F5F5F5] dark:bg-[#262626] rounded-full">
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
                        {renderPlayerName(item.player)}
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
                {(!homeLineup.substitutes || homeLineup.substitutes.length === 0) && (
                  <LineupInlineEmpty message={isLineupsLoading ? '불러오는 중...' : '교체 선수 데이터가 없습니다.'} />
                )}
                {homeLineup.substitutes?.map((item, index) => (
                  <div
                    key={`home-sub-${index}`}
                    className="flex items-center gap-3 cursor-pointer hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors py-2 px-4"
                    onClick={() => handlePlayerClick(item.player, homeTeam.id, homeTeam.name, homeAllPlayers)}
                  >
                    <div className="relative">
                      {item.player.id ? (
                        <UnifiedSportsImageClient
                          src={item.player.photo || PLAYER_PLACEHOLDER}
                          alt={`${item.player.name} 선수 사진`}
                          size="lg"
                          variant="circle"
                        />
                      ) : (
                        <div className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-[13px] bg-[#F5F5F5] dark:bg-[#262626] rounded-full">
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
                        {renderPlayerName(item.player)}
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
          {homeLineup.coach?.name ? (
            <Container className="bg-white dark:bg-[#1D1D1D]">
              <ContainerHeader>
                <ContainerTitle>감독</ContainerTitle>
              </ContainerHeader>
              <ContainerContent className="p-0">
                <div className="flex items-center gap-3 py-2 px-4">
                  {homeLineup.coach?.id ? (
                    <UnifiedSportsImageClient
                      src={homeLineup.coach?.photo || COACH_PLACEHOLDER}
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
          ) : (
            <Container className="bg-white dark:bg-[#1D1D1D]">
              <ContainerHeader>
                <ContainerTitle>감독</ContainerTitle>
              </ContainerHeader>
              <ContainerContent className="p-0">
                <LineupInlineEmpty message={isLineupsLoading ? '불러오는 중...' : '감독 데이터가 없습니다.'} />
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
                  <UnifiedSportsImageClient
                    src={getTeamLogo(awayTeam.id)}
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
                {(!awayLineup.startXI || awayLineup.startXI.length === 0) && (
                  <LineupInlineEmpty message={isLineupsLoading ? '불러오는 중...' : '선발 라인업 데이터가 없습니다.'} />
                )}
                {awayLineup.startXI?.map((item, index) => (
                  <div
                    key={`away-start-${index}`}
                    className="flex items-center gap-3 cursor-pointer hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors py-2 px-4"
                    onClick={() => handlePlayerClick(item.player, awayTeam.id, awayTeam.name, awayAllPlayers)}
                  >
                    <div className="relative">
                      {item.player.id ? (
                        <UnifiedSportsImageClient
                          src={item.player.photo || PLAYER_PLACEHOLDER}
                          alt={`${item.player.name} 선수 사진`}
                          size="lg"
                          variant="circle"
                          priority={index < 5}
                        />
                      ) : (
                        <div className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-[13px] bg-[#F5F5F5] dark:bg-[#262626] rounded-full">
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
                        {renderPlayerName(item.player)}
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
                {(!awayLineup.substitutes || awayLineup.substitutes.length === 0) && (
                  <LineupInlineEmpty message={isLineupsLoading ? '불러오는 중...' : '교체 선수 데이터가 없습니다.'} />
                )}
                {awayLineup.substitutes?.map((item, index) => (
                  <div
                    key={`away-sub-${index}`}
                    className="flex items-center gap-3 cursor-pointer hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors py-2 px-4"
                    onClick={() => handlePlayerClick(item.player, awayTeam.id, awayTeam.name, awayAllPlayers)}
                  >
                    <div className="relative">
                      {item.player.id ? (
                        <UnifiedSportsImageClient
                          src={item.player.photo || PLAYER_PLACEHOLDER}
                          alt={`${item.player.name} 선수 사진`}
                          size="lg"
                          variant="circle"
                        />
                      ) : (
                        <div className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-[13px] bg-[#F5F5F5] dark:bg-[#262626] rounded-full">
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
                        {renderPlayerName(item.player)}
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
          {awayLineup.coach?.name ? (
            <Container className="bg-white dark:bg-[#1D1D1D]">
              <ContainerHeader>
                <ContainerTitle>감독</ContainerTitle>
              </ContainerHeader>
              <ContainerContent className="p-0">
                <div className="flex items-center gap-3 py-2 px-4">
                  {awayLineup.coach?.id ? (
                    <UnifiedSportsImageClient
                      src={awayLineup.coach?.photo || COACH_PLACEHOLDER}
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
          ) : (
            <Container className="bg-white dark:bg-[#1D1D1D]">
              <ContainerHeader>
                <ContainerTitle>감독</ContainerTitle>
              </ContainerHeader>
              <ContainerContent className="p-0">
                <LineupInlineEmpty message={isLineupsLoading ? '불러오는 중...' : '감독 데이터가 없습니다.'} />
              </ContainerContent>
            </Container>
          )}
        </div>
      </div>
      
      </>
      )}

      {/* 선수 통계 모달 */}
      {selectedPlayer && (
        <PlayerStatsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          playerId={selectedPlayer.id}
          playerInfo={{
            name: mergedPlayerKoreanNames[selectedPlayer.id] || selectedPlayer.name,
            name_en: selectedPlayer.name,
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
          teamLogoUrl={getTeamLogo(selectedPlayer.team.id)}
        />
      )}
    </div>
  );
} 
