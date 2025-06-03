'use client';

import Image from 'next/image';
import { InjuryData } from '@/domains/livescore/types/player';

interface PlayerInjuriesProps {
  playerId: number;
  injuriesData?: InjuryData[];
}

export default function PlayerInjuries({
  injuriesData = []
}: PlayerInjuriesProps) {
  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    if (!dateString) return '날짜 정보 없음';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    } catch {
      return dateString;
    }
  };

  if (!injuriesData || injuriesData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        부상 기록이 없습니다.
      </div>
    );
  }
  
  return (
    <div className="mb-4 bg-white rounded-lg overflow-hidden">
      <div>
        <div className="relative p-4">
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          
          {injuriesData.map((injury, index) => (
            <div key={index} className="relative pl-6 pb-3">
              <div className="absolute left-2 top-2 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white"></div>
              <div className="bg-white p-2 rounded-lg border border-gray-200">
                <div className="flex items-center text-xs text-gray-500 mb-1">
                  <div className="mr-1">{formatDate(injury.fixture.date)}</div>
                  <div>•</div>
                  <div className="ml-1">{injury.league.name}</div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 flex-shrink-0 bg-white rounded-full border border-gray-200 flex items-center justify-center overflow-hidden p-0">
                    <Image
                      src={injury.team.logo || '/placeholder-team.png'}
                      alt={injury.team.name}
                      width={24}
                      height={24}
                      className="w-6 h-6 object-contain"
                      unoptimized
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-team.png';
                      }}
                    />
                  </div>
                  <div className="text-sm font-medium truncate">{injury.team.name}</div>
                </div>
                
                <div className="mt-1.5 p-1.5 bg-red-50 rounded-md text-xs">
                  <div className="font-medium text-red-800">부상 유형: {injury.type}</div>
                  <div className="text-red-700 mt-0.5">사유: {injury.reason}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 