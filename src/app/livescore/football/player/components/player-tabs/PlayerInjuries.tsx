'use client';

import Image from 'next/image';

interface Injury {
  fixture: {
    date: string;
  };
  league: {
    name: string;
    season: string;
  };
  team: {
    name: string;
    logo: string;
  };
  type: string;
  reason: string;
}

interface PlayerInjuriesProps {
  injuriesData: Injury[];
}

export default function PlayerInjuries({ injuriesData }: PlayerInjuriesProps) {
  if (!injuriesData || injuriesData.length === 0) {
    return <div className="text-center py-8 text-gray-500">부상 기록이 없습니다.</div>;
  }

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

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        {injuriesData.map((injury, index) => (
          <div key={index} className="relative pl-8 pb-6">
            <div className="absolute left-3 top-2 w-3 h-3 rounded-full bg-red-500 border-4 border-white"></div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-sm text-gray-500 mb-2">{formatDate(injury.fixture.date)}</div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 relative">
                  <Image
                    src={injury.team.logo}
                    alt={injury.team.name}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <div>
                  <div className="font-semibold">{injury.team.name}</div>
                  <div className="text-sm text-gray-600">{injury.league.name} - {injury.league.season}</div>
                </div>
              </div>
              <div className="mt-3 p-3 bg-red-50 rounded-lg">
                <div className="text-sm font-medium text-red-800">부상 유형: {injury.type}</div>
                <div className="text-sm text-red-700 mt-1">사유: {injury.reason}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 