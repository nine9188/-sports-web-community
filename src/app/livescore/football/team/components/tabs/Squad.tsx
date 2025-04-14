'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

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
  number: number;
  position: string;
  photo: string;
  stats: {
    appearances: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
  };
}

interface SquadProps {
  squad: (Player | Coach)[];
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

export default function Squad({ squad }: SquadProps) {
  const router = useRouter();
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  // 선수단 정렬 로직
  const sortedPlayers = [...squad].sort((a, b) => {
    const posA = positionOrder.indexOf(a.position);
    const posB = positionOrder.indexOf(b.position);
    
    if (posA !== posB) return posA - posB;
    
    // 같은 포지션 내에서는 이름 순으로 정렬
    return a.name.localeCompare(b.name);
  });

  const handleImageError = (id: number) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  if (!squad || squad.length === 0) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg text-center">
        선수단 정보가 없습니다.
      </div>
    );
  }

  let currentPosition = '';

  return (
    <div className="mb-4 bg-white rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <tbody className="divide-y divide-gray-100">
            {sortedPlayers.map((member) => {
              const showPositionHeader = member.position !== currentPosition;
              currentPosition = member.position;

              return (
                <React.Fragment key={member.id}>
                  {showPositionHeader && (
                    <tr className={`bg-gray-50 ${positionColors[member.position as keyof typeof positionColors]}`}>
                      <td colSpan={3} className="px-2 sm:px-4 md:px-6 py-2">
                        <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                          <span>{positionNames[member.position as keyof typeof positionNames]}</span>
                          <span className="text-xs md:text-sm text-gray-500">
                            ({sortedPlayers.filter(p => p.position === member.position).length}명)
                          </span>
                        </h3>
                      </td>
                      <td className="px-1 sm:px-2 md:px-6 py-2 text-center text-xs md:text-sm font-medium whitespace-nowrap">나이</td>
                      {member.position === 'Coach' ? (
                        <td colSpan={5} className="px-1 sm:px-2 md:px-6 py-2"></td>
                      ) : (
                        <>
                          <td className="px-1 sm:px-2 md:px-6 py-2 text-center text-xs md:text-sm font-medium whitespace-nowrap">출장</td>
                          <td className="px-1 sm:px-2 md:px-6 py-2 text-center text-xs md:text-sm font-medium whitespace-nowrap">골</td>
                          <td className="px-1 sm:px-2 md:px-6 py-2 text-center text-xs md:text-sm font-medium whitespace-nowrap">도움</td>
                          <td className="px-1 sm:px-2 md:px-6 py-2 text-center text-xs md:text-sm font-medium whitespace-nowrap">
                            <span className="inline-block w-3 h-3 md:w-4 md:h-4 bg-yellow-400 rounded-sm" title="경고"/>
                          </td>
                          <td className="px-1 sm:px-2 md:px-6 py-2 text-center text-xs md:text-sm font-medium whitespace-nowrap">
                            <span className="inline-block w-3 h-3 md:w-4 md:h-4 bg-red-500 rounded-sm" title="퇴장"/>
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
                    <td className="px-2 sm:px-4 md:px-6 py-2">
                      <div className="relative w-8 h-8 md:w-10 md:h-10 bg-gray-100 rounded-full overflow-hidden">
                        {!imageErrors[member.id] ? (
                          <Image
                            src={member.photo}
                            alt={member.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 32px, 40px"
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
                    <td className="px-2 sm:px-4 md:px-6 py-2 text-base md:text-lg font-semibold">
                      {member.position === 'Coach' ? '' : (member as Player).number}
                    </td>
                    <td className="px-2 sm:px-4 md:px-6 py-2">
                      <div className="font-medium text-sm md:text-lg truncate max-w-[100px] md:max-w-none">
                        {member.name}
                      </div>
                    </td>
                    <td className="px-1 sm:px-2 md:px-6 py-2 text-xs md:text-sm text-center whitespace-nowrap">
                      {member.age}세
                    </td>
                    {member.position === 'Coach' ? (
                      <td colSpan={5} className="px-1 sm:px-2 md:px-6 py-2"></td>
                    ) : (
                      <>
                        <td className="px-1 sm:px-2 md:px-6 py-2 text-xs md:text-sm text-center whitespace-nowrap">
                          {(member as Player).stats.appearances}
                        </td>
                        <td className="px-1 sm:px-2 md:px-6 py-2 text-xs md:text-sm text-center whitespace-nowrap">
                          {(member as Player).stats.goals}
                        </td>
                        <td className="px-1 sm:px-2 md:px-6 py-2 text-xs md:text-sm text-center whitespace-nowrap">
                          {(member as Player).stats.assists}
                        </td>
                        <td className="px-1 sm:px-2 md:px-6 py-2 text-xs md:text-sm text-center whitespace-nowrap">
                          {(member as Player).stats.yellowCards}
                        </td>
                        <td className="px-1 sm:px-2 md:px-6 py-2 text-xs md:text-sm text-center whitespace-nowrap">
                          {(member as Player).stats.redCards}
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