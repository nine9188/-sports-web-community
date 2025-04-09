'use client';

import { useState, useEffect } from 'react';
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
  playerId: number;
  baseUrl?: string;
  injuriesData?: Injury[];
}

export default function PlayerInjuries({
  playerId,
  baseUrl = '',
  injuriesData: initialInjuriesData = [] 
}: PlayerInjuriesProps) {
  const [injuriesData, setInjuriesData] = useState<Injury[]>(initialInjuriesData);
  const [loading, setLoading] = useState<boolean>(initialInjuriesData.length === 0);
  const [error, setError] = useState<string | null>(null);

  // 컴포넌트 마운트 시 부상 데이터 가져오기
  useEffect(() => {
    // 이미 데이터가 있으면 가져오지 않음
    if (initialInjuriesData.length > 0) return;
    
    const fetchInjuriesData = async () => {
      try {
        setLoading(true);
        
        // API 요청 URL 설정
        const apiUrl = baseUrl 
          ? `${baseUrl}/api/livescore/football/players/${playerId}/injuries` 
          : `/api/livescore/football/players/${playerId}/injuries`;
        
        const response = await fetch(apiUrl, { cache: 'no-store' });
        
        if (!response.ok) {
          throw new Error('부상 정보를 불러오는데 실패했습니다.');
        }
        
        const data = await response.json();
        setInjuriesData(data || []);
      } catch (error) {
        console.error('부상 데이터 로딩 오류:', error);
        setError('부상 정보를 불러오는데 실패했습니다.');
        setInjuriesData([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInjuriesData();
  }, [playerId, baseUrl, initialInjuriesData.length]);

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

  if (loading) {
    return <div className="text-center py-8">부상 정보를 불러오는 중...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  if (!injuriesData || injuriesData.length === 0) {
    return <div className="text-center py-8 text-gray-500">부상 기록이 없습니다.</div>;
  }

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