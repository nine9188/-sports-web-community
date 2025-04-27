'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { PlayerStats } from '@/app/actions/livescore/teams/player-stats';
import { LoadingState, ErrorState, EmptyState } from '@/app/livescore/football/components/CommonComponents';

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

// 포지션 순서 변경 - Coach를 마지막으로
const positionOrder = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker', 'Coach'];
const positionNames = {
  Coach: '감독',
  Goalkeeper: '골키퍼',
  Defender: '수비수',
  Midfielder: '미드필더',
  Attacker: '공격수'
};

// 포지션별 색상 정의 (배경색 제거하고 보더만 유지)
const positionColors = {
  Coach: 'border-l-4',
  Goalkeeper: 'border-l-4',
  Defender: 'border-l-4',
  Midfielder: 'border-l-4',
  Attacker: 'border-l-4'
};

export default function Squad({ initialSquad, initialStats, isLoading: externalLoading, error: externalError }: SquadProps) {
  const router = useRouter();
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [squad, setSquad] = useState<(Player | Coach)[]>(initialSquad || []);

  // 초기 데이터가 props로 제공된 경우 stats 합치기
  useEffect(() => {
    if (initialSquad && initialSquad.length > 0 && initialStats && Object.keys(initialStats).length > 0) {
      // 선수단 데이터와 통계 데이터 병합
      const mergedSquad = initialSquad.map(member => {
        if (member.position !== 'Coach' && initialStats) {
          const playerId = member.id;
          const playerStats = initialStats[playerId];
          
          if (playerStats) {
            return {
              ...member,
              stats: playerStats
            };
          }
        }
        return member;
      });
      
      setSquad(mergedSquad);
    }
  }, [initialSquad, initialStats]);

  const handleImageError = (id: number) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  // 로딩 상태 처리
  if (externalLoading) {
    return <LoadingState message="선수단 정보를 불러오는 중..." />;
  }

  // 에러 상태 처리
  if (externalError) {
    return <ErrorState message={externalError || '선수단 정보를 불러올 수 없습니다'} />;
  }

  // 데이터가 없는 경우
  if (!squad || squad.length === 0) {
    return <EmptyState title="선수단 데이터가 없습니다" message="현재 이 팀에 대한 선수단 정보를 제공할 수 없습니다." />;
  }

  // 선수단 정렬 로직
  const sortedPlayers = [...squad].sort((a, b) => {
    const posA = positionOrder.indexOf(a.position);
    const posB = positionOrder.indexOf(b.position);
    
    if (posA !== posB) return posA - posB;
    
    // 같은 포지션 내에서는 이름 순으로 정렬
    return a.name.localeCompare(b.name);
  });

  let currentPosition = '';

  return (
    <div className="mb-4 bg-white rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <tbody className="divide-y divide-gray-100">
            {sortedPlayers.map((member) => {
              const showPositionHeader = member.position !== currentPosition;
              currentPosition = member.position;
              
              // 선수 통계 정보 접근
              const playerStats = member.position !== 'Coach' ? (member as Player).stats : undefined;

              return (
                <React.Fragment key={member.id}>
                  {showPositionHeader && (
                    <tr className={`bg-gray-50 ${positionColors[member.position as keyof typeof positionColors]}`}>
                      <td colSpan={3} className="px-2 sm:px-4 md:px-6 py-1">
                        <h3 className="text-sm md:text-base font-medium flex items-center gap-1">
                          <span>{positionNames[member.position as keyof typeof positionNames]}</span>
                          <span className="text-xs text-gray-500">
                            ({sortedPlayers.filter(p => p.position === member.position).length}명)
                          </span>
                        </h3>
                      </td>
                      <td className="px-1 sm:px-2 md:px-6 py-1 text-center text-xs font-medium whitespace-nowrap">나이</td>
                      {member.position === 'Coach' ? (
                        <td colSpan={5} className="px-1 sm:px-2 md:px-6 py-1"></td>
                      ) : (
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
                      )}
                    </tr>
                  )}
                  <tr 
                    className={`hover:bg-gray-50 ${member.position !== 'Coach' ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (member.position !== 'Coach') {
                        router.push(`/livescore/football/player/${member.id}`);
                      }
                    }}
                  >
                    <td className="px-2 sm:px-4 md:px-6 py-1">
                      <div className="relative w-6 h-6 md:w-8 md:h-8 bg-gray-100 rounded-full overflow-hidden">
                        {!imageErrors[member.id] ? (
                          <Image
                            src={member.photo}
                            alt={member.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 24px, 32px"
                            priority={false}
                            loading="lazy"
                            onError={() => handleImageError(member.id)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-xs">
                            {member.name.charAt(0)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 md:px-6 py-1 text-sm md:text-base font-medium">
                      {member.position === 'Coach' ? '' : (member as Player).number}
                    </td>
                    <td className="px-2 sm:px-4 md:px-6 py-1">
                      <div className="font-medium text-xs md:text-sm truncate max-w-[100px] md:max-w-none">
                        {member.name}
                      </div>
                    </td>
                    <td className="px-1 sm:px-2 md:px-6 py-1 text-xs text-center whitespace-nowrap">
                      {member.age}세
                    </td>
                    {member.position === 'Coach' ? (
                      <td colSpan={5} className="px-1 sm:px-2 md:px-6 py-1"></td>
                    ) : (
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