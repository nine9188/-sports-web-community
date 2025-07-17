'use client';

import { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Formation from './Formation';
import PlayerImage from './components/PlayerImage';
import PlayerEvents from './components/PlayerEvents';
import PlayerStatsModal from './components/PlayerStatsModal';
import usePlayerStats from './hooks/usePlayerStats';
import useTeamCache from './hooks/useTeamCache';
import { TeamLineup, MatchEvent } from '@/domains/livescore/types/match';
import { LoadingState, ErrorState, EmptyState } from '@/domains/livescore/components/common/CommonComponents';
import { PlayerStats } from '@/domains/livescore/actions/match/playerStats';

// 프리미어리그 팀 선수 데이터 import
import { 
  liverpoolPlayers, 
  NottinghamForestPlayers, 
  Arsenalplayers, 
  NewcastleUnitedplayers,
  Chelseaplayers, 
  ManchesterCityplayers, 
  AstonVillaplayers, 
  Bournemouthplayers, 
  Fulhamplayers, 
  Brightonplayers 
} from '@/domains/livescore/constants/teams/premier-league/premier-teams';

// 선수 데이터 타입
type PremierLeaguePlayer = 
  | { id: number; name: string; koreanName: string; } 
  | { id?: number; name: string; role?: string; korean_name: string; } 
  | { id: number; english_name: string; korean_name: string; }
  | { id: number; englishName: string; koreanName: string; };

type PremierLeagueTeamPlayers = {
  liverpoolPlayers: PremierLeaguePlayer[];
  NottinghamForestPlayers: PremierLeaguePlayer[];
  Arsenalplayers: PremierLeaguePlayer[];
  NewcastleUnitedplayers: PremierLeaguePlayer[];
  Chelseaplayers: PremierLeaguePlayer[];
  ManchesterCityplayers: PremierLeaguePlayer[];
  AstonVillaplayers: PremierLeaguePlayer[];
  Bournemouthplayers: PremierLeaguePlayer[];
  Fulhamplayers: PremierLeaguePlayer[];
  Brightonplayers: PremierLeaguePlayer[];
};

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
  };
}

// 모든 프리미어리그 팀 선수 데이터 합치기
const teamPlayersData: PremierLeagueTeamPlayers = {
  liverpoolPlayers,
  NottinghamForestPlayers,
  Arsenalplayers,
  NewcastleUnitedplayers,
  Chelseaplayers,
  ManchesterCityplayers,
  AstonVillaplayers,
  Bournemouthplayers,
  Fulhamplayers,
  Brightonplayers
};

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
  const { getTeamDisplayName, getTeamLogoUrl } = useTeamCache(
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
  
  // 한국어 이름 매핑 메모이제이션
  const koreanNameMap = useMemo(() => {
    const map = new Map<number, string>();
    
    // 모든 팀 데이터를 순회하여 한국어 이름 매핑 생성
    Object.values(teamPlayersData).forEach(teamPlayers => {
      teamPlayers.forEach(player => {
        if ('id' in player && player.id) {
          let koreanName = '';
          if ('koreanName' in player && player.koreanName) koreanName = player.koreanName;
          else if ('korean_name' in player && player.korean_name) koreanName = player.korean_name;
          
          if (koreanName) {
            map.set(player.id, koreanName);
          }
        }
      });
    });
    
    return map;
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
          />
        </div>
      )}
      
      {/* 통합된 테이블 구조 */}
      <div className="mb-4 bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="w-1/2 py-3 px-4 text-left text-sm font-medium text-gray-500 border-r border-gray-200">
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-6 h-6 relative flex-shrink-0 overflow-hidden">
                    <Image
                      src={getTeamLogoUrl(homeTeam.id, homeTeam.logo)}
                      alt={`${getTeamDisplayName(homeTeam.id, homeTeam.name)} 로고`}
                      width={24}
                      height={24}
                      className="w-full h-full object-contain"
                      unoptimized
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                  <span className="font-medium">{getTeamDisplayName(homeTeam.id, homeTeam.name)}</span>
                </div>
                <div className="text-xs text-gray-500">포메이션: {homeLineup.formation}</div>
              </th>
              <th scope="col" className="w-1/2 py-3 px-4 text-left text-sm font-medium text-gray-500">
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-6 h-6 relative flex-shrink-0 overflow-hidden">
                    <Image
                      src={getTeamLogoUrl(awayTeam.id, awayTeam.logo)}
                      alt={`${getTeamDisplayName(awayTeam.id, awayTeam.name)} 로고`}
                      width={24}
                      height={24}
                      className="w-full h-full object-contain"
                      unoptimized
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                  <span className="font-medium">{getTeamDisplayName(awayTeam.id, awayTeam.name)}</span>
                </div>
                <div className="text-xs text-gray-500">포메이션: {awayLineup.formation}</div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {/* 섹션 제목: 선발 라인업 */}
            <tr>
              <td colSpan={2} className="py-2 px-4 bg-gray-100 text-gray-700 font-bold">
                선발 라인업
              </td>
            </tr>
            
            {/* 선발 라인업 행 생성 - 최대 11명 */}
            {Array.from({ length: Math.max(
              homeLineup.startXI?.length || 0, 
              awayLineup.startXI?.length || 0
            ) }).map((_, index) => (
              <tr key={`startXI-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="py-2 px-4 border-r border-gray-200">
                  {homeLineup.startXI && index < homeLineup.startXI.length && (
                    <div 
                      className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors"
                      onClick={() => handlePlayerClick(
                        homeLineup.startXI[index].player, 
                        homeTeam.id, 
                        homeTeam.name
                      )}
                    >
                      <div className="relative">
                        {homeLineup.startXI[index].player.photo ? (
                          <PlayerImage 
                            src={homeLineup.startXI[index].player.photo}
                            alt={`${homeLineup.startXI[index].player.name} 선수 사진`}
                            playerId={homeLineup.startXI[index].player.id}
                            priority={index < 5} // 처음 5명은 우선 로딩
                            width={40}
                            height={40}
                            className="border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center text-gray-700 font-bold text-sm bg-gray-100 rounded-full border-2 border-gray-200">
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
                        <div className="text-sm font-medium">
                          {/* 선수 한국어 이름 매핑 */}
                          {koreanNameMap.get(homeLineup.startXI[index].player.id) || homeLineup.startXI[index].player.name}
                          {homeLineup.startXI[index].player.captain && (
                            <span className="ml-1 text-xs text-yellow-600 font-semibold">(주장)</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center flex-wrap">
                          {homeLineup.startXI[index].player.pos || '-'} {homeLineup.startXI[index].player.number}
                          <PlayerEvents player={homeLineup.startXI[index].player} events={events} />
                        </div>
                      </div>
                    </div>
                  )}
                </td>
                <td className="py-2 px-4">
                  {awayLineup.startXI && index < awayLineup.startXI.length && (
                    <div 
                      className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors"
                      onClick={() => handlePlayerClick(
                        awayLineup.startXI[index].player, 
                        awayTeam.id, 
                        awayTeam.name
                      )}
                    >
                      <div className="relative">
                        {awayLineup.startXI[index].player.photo ? (
                          <PlayerImage 
                            src={awayLineup.startXI[index].player.photo}
                            alt={`${awayLineup.startXI[index].player.name} 선수 사진`}
                            playerId={awayLineup.startXI[index].player.id}
                            priority={index < 5} // 처음 5명은 우선 로딩
                            width={40}
                            height={40}
                            className="border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center text-gray-700 font-bold text-sm bg-gray-100 rounded-full border-2 border-gray-200">
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
                        <div className="text-sm font-medium">
                          {/* 선수 한국어 이름 매핑 */}
                          {koreanNameMap.get(awayLineup.startXI[index].player.id) || awayLineup.startXI[index].player.name}
                          {awayLineup.startXI[index].player.captain && (
                            <span className="ml-1 text-xs text-yellow-600 font-semibold">(주장)</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center flex-wrap">
                          {awayLineup.startXI[index].player.pos || '-'} {awayLineup.startXI[index].player.number}
                          <PlayerEvents player={awayLineup.startXI[index].player} events={events} />
                        </div>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            
            {/* 섹션 제목: 교체 선수 */}
            <tr>
              <td colSpan={2} className="py-2 px-4 bg-gray-100 text-gray-700 font-bold">
                교체 선수
              </td>
            </tr>
            
            {/* 교체 선수 행 생성 */}
            {Array.from({ length: Math.max(
              homeLineup.substitutes?.length || 0, 
              awayLineup.substitutes?.length || 0
            ) }).map((_, index) => (
              <tr key={`subs-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="py-2 px-4 border-r border-gray-200">
                  {homeLineup.substitutes && index < homeLineup.substitutes.length && (
                    <div 
                      className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors"
                      onClick={() => handlePlayerClick(
                        homeLineup.substitutes[index].player, 
                        homeTeam.id, 
                        homeTeam.name
                      )}
                    >
                      <div className="relative">
                        {homeLineup.substitutes[index].player.photo ? (
                          <PlayerImage 
                            src={homeLineup.substitutes[index].player.photo}
                            alt={`${homeLineup.substitutes[index].player.name} 선수 사진`}
                            playerId={homeLineup.substitutes[index].player.id}
                          />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center text-gray-700 font-bold text-sm bg-gray-100 rounded-full border-2 border-gray-200">
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
                        <div className="text-sm font-medium">
                          {/* 선수 한국어 이름 매핑 */}
                          {koreanNameMap.get(homeLineup.substitutes[index].player.id) || homeLineup.substitutes[index].player.name}
                          {homeLineup.substitutes[index].player.captain && (
                            <span className="ml-1 text-xs text-yellow-600 font-semibold">(주장)</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center flex-wrap">
                          {homeLineup.substitutes[index].player.pos || '-'} {homeLineup.substitutes[index].player.number}
                          <PlayerEvents player={homeLineup.substitutes[index].player} events={events} />
                        </div>
                      </div>
                    </div>
                  )}
                </td>
                <td className="py-2 px-4">
                  {awayLineup.substitutes && index < awayLineup.substitutes.length && (
                    <div 
                      className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors"
                      onClick={() => handlePlayerClick(
                        awayLineup.substitutes[index].player, 
                        awayTeam.id, 
                        awayTeam.name
                      )}
                    >
                      <div className="relative">
                        {awayLineup.substitutes[index].player.photo ? (
                          <PlayerImage 
                            src={awayLineup.substitutes[index].player.photo}
                            alt={`${awayLineup.substitutes[index].player.name} 선수 사진`}
                            playerId={awayLineup.substitutes[index].player.id}
                          />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center text-gray-700 font-bold text-sm bg-gray-100 rounded-full border-2 border-gray-200">
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
                        <div className="text-sm font-medium">
                          {/* 선수 한국어 이름 매핑 */}
                          {koreanNameMap.get(awayLineup.substitutes[index].player.id) || awayLineup.substitutes[index].player.name}
                          {awayLineup.substitutes[index].player.captain && (
                            <span className="ml-1 text-xs text-yellow-600 font-semibold">(주장)</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center flex-wrap">
                          {awayLineup.substitutes[index].player.pos || '-'} {awayLineup.substitutes[index].player.number}
                          <PlayerEvents player={awayLineup.substitutes[index].player} events={events} />
                        </div>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            
            {/* 섹션 제목: 감독 - 둘 다 있을 때만 표시 */}
            {homeLineup.coach && awayLineup.coach && homeLineup.coach.name && awayLineup.coach.name && (
              <>
                <tr>
                  <td colSpan={2} className="py-2 px-4 bg-gray-100 text-gray-700 font-bold">
                    감독
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border-r border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {homeLineup.coach?.photo ? (
                          <PlayerImage 
                            src={homeLineup.coach.photo}
                            alt={`${homeLineup.coach.name} 감독 사진`}
                          />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center text-gray-700 font-bold text-sm bg-gray-100 rounded-full border-2 border-gray-200">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="감독 기본 아이콘">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{homeLineup.coach?.name || '정보 없음'}</div>
                        <div className="text-xs text-gray-500">감독</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {awayLineup.coach?.photo ? (
                          <PlayerImage 
                            src={awayLineup.coach.photo}
                            alt={`${awayLineup.coach.name} 감독 사진`}
                          />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center text-gray-700 font-bold text-sm bg-gray-100 rounded-full border-2 border-gray-200">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="감독 기본 아이콘">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{awayLineup.coach?.name || '정보 없음'}</div>
                        <div className="text-xs text-gray-500">감독</div>
                      </div>
                    </div>
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
      
      {/* 선수 통계 모달 */}
      {selectedPlayer && (
        <PlayerStatsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          playerId={selectedPlayer.id}
          matchId={matchId}
          playerInfo={{
            name: koreanNameMap.get(selectedPlayer.id) || selectedPlayer.name,
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