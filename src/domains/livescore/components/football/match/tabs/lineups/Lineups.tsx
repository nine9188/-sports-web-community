'use client';

import { useState, useCallback, useMemo } from 'react';
import Formation from './Formation';
import PlayerImage from './components/PlayerImage';
import PlayerEvents from './components/PlayerEvents';
import PlayerStatsModal from './components/PlayerStatsModal';
import usePlayerStats from './hooks/usePlayerStats';
import useTeamCache from './hooks/useTeamCache';
import { TeamLineup, MatchEvent } from '@/domains/livescore/types/match';
import { LoadingState, ErrorState, EmptyState } from '@/domains/livescore/components/common/CommonComponents';
import { PlayerStats } from '@/domains/livescore/actions/match/playerStats';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';
import { getPlayerKoreanName } from '@/domains/livescore/constants/players';
import { Container, ContainerHeader, ContainerTitle, ContainerContent } from '@/shared/components/ui';

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
    playersStats?: Record<number, { response: PlayerStats[] }>;
    fixture?: {
      status?: {
        short?: string;
      };
    };
  };
}

export default function Lineups({ matchId, matchData }: LineupsProps) {
  // 상태 관리
  const [loading] = useState(!matchData?.lineups);
  const [lineups] = useState<{home: TeamLineup; away: TeamLineup} | null>(
    matchData?.lineups?.response || null
  );
  const [events] = useState<MatchEvent[]>(matchData?.events || []);
  const [error] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<{
    id: number;
    name: string;
    number: string;
    pos: string;
    team: {
      id: number;
      name: string;
    };
  } | null>(null);
  
  // 팀 정보 캐시 훅 사용
  const { getTeamDisplayName } = useTeamCache(
    matchData?.homeTeam,
    matchData?.awayTeam
  );
  
  // 선수 통계 데이터 로드 훅 사용
  const { playersStatsData } = usePlayerStats(
    matchId,
    lineups,
    matchData?.playersStats
  );

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
  

  // 선수 클릭 핸들러 - 성능 최적화
  const handlePlayerClick = useCallback((player: Player, teamId: number, teamName: string) => {
    // 선수 정보를 먼저 설정
    const playerInfo = {
      id: player.id,
      name: player.name,
      number: player.number.toString(),
      pos: player.pos || '',
      team: {
        id: teamId,
        name: teamName
      }
    };
    
    setSelectedPlayer(playerInfo);
    // 선수 정보 설정 후 모달 열기
    setIsModalOpen(true);
  }, []);
  
  // 모달 닫기 핸들러
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // 경기 상태 및 선수 평점 데이터 추출 - early return 전에 위치해야 함
  const matchStatus = matchData?.fixture?.status?.short;
  const playersRatings = useMemo(() => {
    const ratings: Record<number, number> = {};
    
    if (playersStatsData && Object.keys(playersStatsData).length > 0) {
      Object.entries(playersStatsData).forEach(([, playerData]) => {
        if (playerData?.response && Array.isArray(playerData.response) && playerData.response.length > 0) {
          const stats = playerData.response[0];
          if (stats?.player?.id && stats?.statistics?.[0]?.games?.rating) {
            const ratingValue = stats.statistics[0].games.rating;
            // 문자열일 수도 있으므로 변환
            const rating = typeof ratingValue === 'string' ? parseFloat(ratingValue) : Number(ratingValue);
            if (!isNaN(rating) && rating > 0) {
              ratings[stats.player.id] = rating;
            }
          }
        }
      });
    }
    
    return ratings;
  }, [playersStatsData]);

  // 로딩 중이면 로딩 표시
  if (loading) {
    return <LoadingState message="라인업 데이터를 불러오는 중..." />;
  }
  
  // 오류 표시
  if (error) {
    return <ErrorState message={error} />;
  }

  // 라인업 데이터가 없는 경우 처리
  if (!lineups) {
    return <EmptyState title="라인업 정보가 없습니다" message="현재 이 경기에 대한 라인업 정보를 제공할 수 없습니다." />;
  }

  const homeTeam = matchData?.homeTeam || { id: 0, name: '홈팀', logo: '/placeholder-team.png' };
  const awayTeam = matchData?.awayTeam || { id: 0, name: '원정팀', logo: '/placeholder-team.png' };
  const homeLineup = lineups.home;
  const awayLineup = lineups.away;
  
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
              <tr key={`startXI-${index}`} className={index % 2 === 0 ? 'bg-white dark:bg-[#1D1D1D]' : 'bg-gray-50 dark:bg-[#2D2D2D]'}>
                <td className="border-r border-black/5 dark:border-white/10">
                  {homeLineup.startXI && index < homeLineup.startXI.length && (
                    <div
                      className="flex items-center gap-3 cursor-pointer hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors py-2 px-4"
                      onClick={() => handlePlayerClick(
                        homeLineup.startXI[index].player,
                        homeTeam.id,
                        homeTeam.name
                      )}
                    >
                      <div className="relative">
                        {homeLineup.startXI[index].player.id ? (
                          <PlayerImage
                            alt={`${homeLineup.startXI[index].player.name} 선수 사진`}
                            playerId={homeLineup.startXI[index].player.id}
                            priority={index < 5} // 처음 5명은 우선 로딩
                            width={"w-10"}
                            height={"h-10"}
                            className="border-2 border-gray-200 dark:border-gray-700"
                          />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-sm bg-gray-100 dark:bg-gray-800 rounded-full border-2 border-gray-200 dark:border-gray-700">
                            {homeLineup.startXI[index].player.number || '-'}
                          </div>
                        )}
                        {homeLineup.startXI[index].player.captain && (
                          <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                            C
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-900 dark:text-gray-100">
                          {/* 선수 한국어 이름 매핑 */}
                          {getPlayerKoreanName(homeLineup.startXI[index].player.id) || homeLineup.startXI[index].player.name}
                          {homeLineup.startXI[index].player.captain && (
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
                        awayTeam.name
                      )}
                    >
                      <div className="relative">
                        {awayLineup.startXI[index].player.id ? (
                          <PlayerImage 
                            alt={`${awayLineup.startXI[index].player.name} 선수 사진`}
                            playerId={awayLineup.startXI[index].player.id}
                            priority={index < 5} // 처음 5명은 우선 로딩
                            width={"w-10"}
                            height={"h-10"}
                            className="border-2 border-gray-200 dark:border-gray-700"
                          />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-sm bg-gray-100 dark:bg-gray-800 rounded-full border-2 border-gray-200 dark:border-gray-700">
                            {awayLineup.startXI[index].player.number || '-'}
                          </div>
                        )}
                        {awayLineup.startXI[index].player.captain && (
                          <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                            C
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-900 dark:text-gray-100">
                          {/* 선수 한국어 이름 매핑 */}
                          {getPlayerKoreanName(awayLineup.startXI[index].player.id) || awayLineup.startXI[index].player.name}
                          {awayLineup.startXI[index].player.captain && (
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
              <tr key={`subs-${index}`} className={index % 2 === 0 ? 'bg-white dark:bg-[#1D1D1D]' : 'bg-gray-50 dark:bg-[#2D2D2D]'}>
                <td className="w-1/2 border-r border-black/5 dark:border-white/10">
                  {homeLineup.substitutes && index < homeLineup.substitutes.length && (
                    <div
                      className="flex items-center gap-3 cursor-pointer hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors py-2 px-4"
                      onClick={() => handlePlayerClick(
                        homeLineup.substitutes[index].player, 
                        homeTeam.id, 
                        homeTeam.name
                      )}
                    >
                      <div className="relative">
                        {homeLineup.substitutes[index].player.id ? (
                          <PlayerImage 
                            alt={`${homeLineup.substitutes[index].player.name} 선수 사진`}
                            playerId={homeLineup.substitutes[index].player.id}
                          />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-sm bg-gray-100 dark:bg-gray-800 rounded-full border-2 border-gray-200 dark:border-gray-700">
                            {homeLineup.substitutes[index].player.number || '-'}
                          </div>
                        )}
                        {homeLineup.substitutes[index].player.captain && (
                          <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                            C
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-900 dark:text-gray-100">
                          {/* 선수 한국어 이름 매핑 */}
                          {getPlayerKoreanName(homeLineup.substitutes[index].player.id) || homeLineup.substitutes[index].player.name}
                          {homeLineup.substitutes[index].player.captain && (
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
                        awayTeam.name
                      )}
                    >
                      <div className="relative">
                        {awayLineup.substitutes[index].player.id ? (
                          <PlayerImage 
                            alt={`${awayLineup.substitutes[index].player.name} 선수 사진`}
                            playerId={awayLineup.substitutes[index].player.id}
                          />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-sm bg-gray-100 dark:bg-gray-800 rounded-full border-2 border-gray-200 dark:border-gray-700">
                            {awayLineup.substitutes[index].player.number || '-'}
                          </div>
                        )}
                        {awayLineup.substitutes[index].player.captain && (
                          <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                            C
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-900 dark:text-gray-100">
                          {/* 선수 한국어 이름 매핑 */}
                          {getPlayerKoreanName(awayLineup.substitutes[index].player.id) || awayLineup.substitutes[index].player.name}
                          {awayLineup.substitutes[index].player.captain && (
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
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center">
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
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center">
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
                    onClick={() => handlePlayerClick(item.player, homeTeam.id, homeTeam.name)}
                  >
                    <div className="relative">
                      {item.player.id ? (
                        <PlayerImage
                          alt={`${item.player.name} 선수 사진`}
                          playerId={item.player.id}
                          priority={index < 5}
                          width="w-10"
                          height="h-10"
                          className="border-2 border-gray-200 dark:border-gray-700"
                        />
                      ) : (
                        <div className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-sm bg-gray-100 dark:bg-gray-800 rounded-full border-2 border-gray-200 dark:border-gray-700">
                          {item.player.number || '-'}
                        </div>
                      )}
                      {item.player.captain && (
                        <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                          C
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-900 dark:text-gray-100">
                        {getPlayerKoreanName(item.player.id) || item.player.name}
                        {item.player.captain && (
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
                    onClick={() => handlePlayerClick(item.player, homeTeam.id, homeTeam.name)}
                  >
                    <div className="relative">
                      {item.player.id ? (
                        <PlayerImage
                          alt={`${item.player.name} 선수 사진`}
                          playerId={item.player.id}
                        />
                      ) : (
                        <div className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-sm bg-gray-100 dark:bg-gray-800 rounded-full border-2 border-gray-200 dark:border-gray-700">
                          {item.player.number || '-'}
                        </div>
                      )}
                      {item.player.captain && (
                        <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                          C
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-900 dark:text-gray-100">
                        {getPlayerKoreanName(item.player.id) || item.player.name}
                        {item.player.captain && (
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
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center">
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
                    onClick={() => handlePlayerClick(item.player, awayTeam.id, awayTeam.name)}
                  >
                    <div className="relative">
                      {item.player.id ? (
                        <PlayerImage
                          alt={`${item.player.name} 선수 사진`}
                          playerId={item.player.id}
                          priority={index < 5}
                          width="w-10"
                          height="h-10"
                          className="border-2 border-gray-200 dark:border-gray-700"
                        />
                      ) : (
                        <div className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-sm bg-gray-100 dark:bg-gray-800 rounded-full border-2 border-gray-200 dark:border-gray-700">
                          {item.player.number || '-'}
                        </div>
                      )}
                      {item.player.captain && (
                        <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                          C
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-900 dark:text-gray-100">
                        {getPlayerKoreanName(item.player.id) || item.player.name}
                        {item.player.captain && (
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
                    onClick={() => handlePlayerClick(item.player, awayTeam.id, awayTeam.name)}
                  >
                    <div className="relative">
                      {item.player.id ? (
                        <PlayerImage
                          alt={`${item.player.name} 선수 사진`}
                          playerId={item.player.id}
                        />
                      ) : (
                        <div className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-sm bg-gray-100 dark:bg-gray-800 rounded-full border-2 border-gray-200 dark:border-gray-700">
                          {item.player.number || '-'}
                        </div>
                      )}
                      {item.player.captain && (
                        <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                          C
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-900 dark:text-gray-100">
                        {getPlayerKoreanName(item.player.id) || item.player.name}
                        {item.player.captain && (
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
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center">
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
          matchId={matchId}
          playerInfo={{
            name: getPlayerKoreanName(selectedPlayer.id) || selectedPlayer.name,
            number: selectedPlayer.number,
            pos: selectedPlayer.pos,
            team: {
              id: selectedPlayer.team.id,
              name: getTeamDisplayName(selectedPlayer.team.id, selectedPlayer.team.name)
            }
          }}
          preloadedStats={playersStatsData[selectedPlayer.id]}
        />
      )}
    </div>
  );
}

// 성능 디버깅을 위한 displayName 추가
Lineups.displayName = 'Lineups'; 