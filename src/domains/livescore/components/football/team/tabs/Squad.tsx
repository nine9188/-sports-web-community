'use client';

import { useRouter } from 'next/navigation';
import React, { useMemo } from 'react';
import { PlayerStats } from '@/domains/livescore/actions/teams/player-stats';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';
import { LoadingState, ErrorState, EmptyState } from '@/domains/livescore/components/common/CommonComponents';
import { getPlayerKoreanName } from '@/domains/livescore/constants/players';
import { Container, ContainerHeader, ContainerTitle, ContainerContent } from '@/shared/components/ui/container';

// 상수 정의 - 감독을 최상단으로 노출, 그 다음 골키퍼, 공격수, 미드필더, 수비수 순
const POSITION_ORDER = ['Coach', 'Goalkeeper', 'Attacker', 'Midfielder', 'Defender'];
const POSITION_NAMES = {
  Coach: '감독',
  Goalkeeper: '골키퍼',
  Defender: '수비수',
  Midfielder: '미드필더',
  Attacker: '공격수'
};

// 컴포넌트에서 사용할 타입 정의
interface Coach {
  id: number;
  name: string;
  age: number;
  photo: string;
  position: 'Coach';
}

interface Player {
  id: number;
  name: string;
  age: number;
  number?: number;
  position: string;
  photo: string;
  stats?: {
    appearances: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
  };
}

interface SquadProps {
  initialSquad?: (Player | Coach)[];
  initialStats?: Record<number, PlayerStats>;
  isLoading?: boolean;
  error?: string | null;
}

export default function Squad({ initialSquad, initialStats, isLoading: externalLoading, error: externalError }: SquadProps) {
  const router = useRouter();

  // 데이터 병합 처리를 useMemo를 사용하여 최적화
  const squad = useMemo(() => {
    if (!initialSquad || initialSquad.length === 0) return [];
    
    return initialSquad.map(member => {
      if (member.position !== 'Coach' && initialStats) {
        const playerStats = initialStats[member.id];
        if (playerStats) {
          return {
            ...member,
            stats: playerStats
          };
        }
      }
      return member;
    });
  }, [initialSquad, initialStats]);
  
  // 선수단을 포지션별로 그룹화하는 로직
  const groupedPlayers = useMemo(() => {
    if (squad.length === 0) return {};

    // 포지션 정보가 있는 선수만 필터링
    const validPlayers = squad.filter(member => {
      if (!member.position || member.position.trim() === '') return false;
      if (!POSITION_ORDER.includes(member.position)) return false;
      return true;
    });

    // 포지션별로 그룹화
    const grouped: Record<string, (Player | Coach)[]> = {};
    
    validPlayers.forEach(member => {
      if (!grouped[member.position]) {
        grouped[member.position] = [];
      }
      grouped[member.position].push(member);
    });

    // 각 그룹 내에서 이름순 정렬
    Object.keys(grouped).forEach(position => {
      grouped[position].sort((a, b) => {
        const nameA = getPlayerKoreanName(a.id) || a.name;
        const nameB = getPlayerKoreanName(b.id) || b.name;
        return nameA.localeCompare(nameB);
      });
    });

    return grouped;
  }, [squad]);

  // 로딩 상태 처리
  if (externalLoading) {
    return <LoadingState message="선수단 정보를 불러오는 중..." />;
  }

  // 에러 상태 처리
  if (externalError) {
    return <ErrorState message={externalError || '선수단 정보를 불러올 수 없습니다'} />;
  }

  // 데이터가 없는 경우
  if (!initialSquad || initialSquad.length === 0) {
    return <EmptyState title="선수단 데이터가 없습니다" message="현재 이 팀에 대한 선수단 정보를 제공할 수 없습니다." />;
  }

  return (
    <div className="space-y-4">
      {POSITION_ORDER.map(position => {
        const members = groupedPlayers[position];
        if (!members || members.length === 0) return null;

        const isPlayer = position !== 'Coach';

        return (
          <Container key={position} className="bg-white dark:bg-[#1D1D1D]">
            <ContainerHeader>
              <ContainerTitle>
                {POSITION_NAMES[position as keyof typeof POSITION_NAMES]}
                <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-2">
                  ({members.length}명)
                </span>
              </ContainerTitle>
            </ContainerHeader>
            
            <ContainerContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F5F5F5] dark:bg-[#262626]">
                    <tr>
                      <th className="px-2 sm:px-4 md:px-6 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">사진</th>
                      <th className="px-2 sm:px-4 md:px-6 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">번호</th>
                      <th className="px-2 sm:px-4 md:px-6 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">이름</th>
                      <th className="px-1 sm:px-2 md:px-6 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">나이</th>
                      {isPlayer && (
                        <>
                          <th className="px-1 sm:px-2 md:px-6 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">출장</th>
                          <th className="px-1 sm:px-2 md:px-6 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">골</th>
                          <th className="px-1 sm:px-2 md:px-6 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">도움</th>
                          <th className="px-1 sm:px-2 md:px-6 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            <span className="inline-block w-3 h-3 bg-yellow-400 dark:bg-yellow-500 rounded-sm" title="경고"/>
                          </th>
                          <th className="px-1 sm:px-2 md:px-6 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            <span className="inline-block w-3 h-3 bg-red-500 dark:bg-red-600 rounded-sm" title="퇴장"/>
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/10">
                    {members.map(member => {
                      const playerStats = isPlayer ? (member as Player).stats : undefined;

                      return (
                        <tr 
                          key={member.id}
                          className={`hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors ${isPlayer ? 'cursor-pointer' : ''}`}
                          onClick={() => {
                            if (isPlayer) {
                              router.push(`/livescore/football/player/${member.id}`);
                            }
                          }}
                        >
                          <td className="px-2 sm:px-4 md:px-6 py-2 whitespace-nowrap">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-[#F5F5F5] dark:bg-[#333333] rounded-full overflow-hidden flex-shrink-0">
                              <UnifiedSportsImage
                                imageId={member.id}
                                imageType={position === 'Coach' ? ImageType.Coachs : ImageType.Players}
                                alt={member.name}
                                width={40}
                                height={40}
                                className="!w-full !h-full !rounded-none"
                              />
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 md:px-6 py-2 text-xs font-medium text-center text-gray-900 dark:text-[#F0F0F0] whitespace-nowrap">
                            {isPlayer ? (member as Player).number : '-'}
                          </td>
                          <td className="px-2 sm:px-4 md:px-6 py-2">
                            <div className="font-medium text-xs text-gray-900 dark:text-[#F0F0F0] max-w-[115px] md:max-w-none truncate md:whitespace-normal">
                              {getPlayerKoreanName(member.id) || member.name}
                            </div>
                          </td>
                          <td className="px-1 sm:px-2 md:px-6 py-2 text-xs text-center whitespace-nowrap text-gray-900 dark:text-[#F0F0F0]">
                            {member.age}세
                          </td>
                          {isPlayer && (
                            <>
                              <td className="px-1 sm:px-2 md:px-6 py-2 text-xs text-center whitespace-nowrap text-gray-900 dark:text-[#F0F0F0]">
                                {playerStats?.appearances || 0}
                              </td>
                              <td className="px-1 sm:px-2 md:px-6 py-2 text-xs text-center whitespace-nowrap text-gray-900 dark:text-[#F0F0F0]">
                                {playerStats?.goals || 0}
                              </td>
                              <td className="px-1 sm:px-2 md:px-6 py-2 text-xs text-center whitespace-nowrap text-gray-900 dark:text-[#F0F0F0]">
                                {playerStats?.assists || 0}
                              </td>
                              <td className="px-1 sm:px-2 md:px-6 py-2 text-xs text-center whitespace-nowrap text-gray-900 dark:text-[#F0F0F0]">
                                {playerStats?.yellowCards || 0}
                              </td>
                              <td className="px-1 sm:px-2 md:px-6 py-2 text-xs text-center whitespace-nowrap text-gray-900 dark:text-[#F0F0F0]">
                                {playerStats?.redCards || 0}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </ContainerContent>
          </Container>
        );
      })}
    </div>
  );
} 