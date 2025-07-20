'use client';

import { useRouter } from 'next/navigation';
import React, { useMemo } from 'react';
import { PlayerStats } from '@/domains/livescore/actions/teams/player-stats';
import ApiSportsImage from '@/shared/components/ApiSportsImage';
import { ImageType } from '@/shared/types/image';
import { getSupabaseStorageUrl } from '@/shared/utils/image-proxy';
import { LoadingState, ErrorState, EmptyState } from '@/domains/livescore/components/common/CommonComponents';

// 상수 정의
const POSITION_ORDER = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker', 'Coach'];
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
  
  // 선수단 정렬 로직을 useMemo로 최적화
  const sortedPlayers = useMemo(() => {
    if (squad.length === 0) return [];
    
    return [...squad].sort((a, b) => {
      const posA = POSITION_ORDER.indexOf(a.position);
      const posB = POSITION_ORDER.indexOf(b.position);
      
      if (posA !== posB) return posA - posB;
      
      // 같은 포지션 내에서는 이름 순으로 정렬
      return a.name.localeCompare(b.name);
    });
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

  // 렌더링에 사용할 현재 포지션 추적
  let currentPosition = '';

  return (
    <div className="mb-4 bg-white rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <tbody className="divide-y divide-gray-100">
            {sortedPlayers.map((member) => {
              // 포지션 헤더 표시 여부 결정
              const showPositionHeader = member.position !== currentPosition;
              currentPosition = member.position;
              
              // 선수 통계 정보 접근
              const playerStats = member.position !== 'Coach' ? (member as Player).stats : undefined;
              const isPlayer = member.position !== 'Coach';

              return (
                <React.Fragment key={member.id}>
                  {showPositionHeader && (
                    <tr className="bg-gray-50 border-l-4">
                      <td colSpan={3} className="px-2 sm:px-4 md:px-6 py-1">
                        <h3 className="text-sm md:text-base font-medium flex items-center gap-1">
                          <span>{POSITION_NAMES[member.position as keyof typeof POSITION_NAMES]}</span>
                          <span className="text-xs text-gray-500">
                            ({sortedPlayers.filter(p => p.position === member.position).length}명)
                          </span>
                        </h3>
                      </td>
                      <td className="px-1 sm:px-2 md:px-6 py-1 text-center text-xs font-medium whitespace-nowrap">나이</td>
                      {isPlayer ? (
                        <>
                          <td className="px-1 sm:px-2 md:px-6 py-1 text-center text-xs font-medium whitespace-nowrap">출장</td>
                          <td className="px-1 sm:px-2 md:px-6 py-1 text-center text-xs font-medium whitespace-nowrap">골</td>
                          <td className="px-1 sm:px-2 md:px-6 py-1 text-center text-xs font-medium whitespace-nowrap">도움</td>
                          <td className="px-1 sm:px-2 md:px-6 py-1 text-center text-xs font-medium whitespace-nowrap">
                            <span className="inline-block w-3 h-3 bg-yellow-400 rounded-sm" title="경고"/>
                          </td>
                          <td className="px-1 sm:px-2 md:px-6 py-1 text-center text-xs font-medium whitespace-nowrap">
                            <span className="inline-block w-3 h-3 bg-red-500 rounded-sm" title="퇴장"/>
                          </td>
                        </>
                      ) : (
                        <td colSpan={5} className="px-1 sm:px-2 md:px-6 py-1"></td>
                      )}
                    </tr>
                  )}
                  <tr 
                    className={`hover:bg-gray-50 transition-colors ${isPlayer ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (isPlayer) {
                        router.push(`/livescore/football/player/${member.id}`);
                      }
                    }}
                  >
                    <td className="px-2 sm:px-4 md:px-6 py-1">
                      <div className="relative w-6 h-6 md:w-8 md:h-8 bg-gray-100 rounded-full overflow-hidden">
                        <ApiSportsImage
                          src={getSupabaseStorageUrl(
                            member.position === 'Coach' ? ImageType.Coachs : ImageType.Players,
                            member.id
                          )}
                          imageId={member.id}
                          imageType={member.position === 'Coach' ? ImageType.Coachs : ImageType.Players}
                          alt={member.name}
                          width={32}
                          height={32}
                          className="object-cover w-full h-full rounded-full"
                        />
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 md:px-6 py-1 text-sm md:text-base font-medium">
                      {isPlayer ? (member as Player).number : ''}
                    </td>
                    <td className="px-2 sm:px-4 md:px-6 py-1">
                      <div className="font-medium text-xs md:text-sm truncate max-w-[100px] md:max-w-none">
                        {member.name}
                      </div>
                    </td>
                    <td className="px-1 sm:px-2 md:px-6 py-1 text-xs text-center whitespace-nowrap">
                      {member.age}세
                    </td>
                    {isPlayer ? (
                      <>
                        <td className="px-1 sm:px-2 md:px-6 py-1 text-xs text-center whitespace-nowrap">
                          {playerStats?.appearances || 0}
                        </td>
                        <td className="px-1 sm:px-2 md:px-6 py-1 text-xs text-center whitespace-nowrap">
                          {playerStats?.goals || 0}
                        </td>
                        <td className="px-1 sm:px-2 md:px-6 py-1 text-xs text-center whitespace-nowrap">
                          {playerStats?.assists || 0}
                        </td>
                        <td className="px-1 sm:px-2 md:px-6 py-1 text-xs text-center whitespace-nowrap">
                          {playerStats?.yellowCards || 0}
                        </td>
                        <td className="px-1 sm:px-2 md:px-6 py-1 text-xs text-center whitespace-nowrap">
                          {playerStats?.redCards || 0}
                        </td>
                      </>
                    ) : (
                      <td colSpan={5} className="px-1 sm:px-2 md:px-6 py-1"></td>
                    )}
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
} 