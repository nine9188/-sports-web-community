'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import classNames from 'classnames';

interface Trophy {
  league: string;
  country: string;
  place: string;
  season: string;
  leagueLogo: string | null;
}

interface PlayerTrophiesProps {
  playerId: number;
  baseUrl?: string;
  trophiesData?: Trophy[];
}

export default function PlayerTrophies({ 
  playerId, 
  baseUrl = '',
  trophiesData: initialTrophiesData = [] 
}: PlayerTrophiesProps) {
  const [trophiesData, setTrophiesData] = useState<Trophy[]>(initialTrophiesData);
  const [loading, setLoading] = useState<boolean>(initialTrophiesData.length === 0);
  const [error, setError] = useState<string | null>(null);

  // 컴포넌트 마운트 시 트로피 데이터 가져오기
  useEffect(() => {
    // 이미 데이터가 있으면 가져오지 않음
    if (initialTrophiesData.length > 0) return;
    
    const fetchTrophiesData = async () => {
      try {
        setLoading(true);
        
        // API 요청 URL 설정
        const apiUrl = baseUrl 
          ? `${baseUrl}/api/livescore/football/players/${playerId}/trophies` 
          : `/api/livescore/football/players/${playerId}/trophies`;
        
        const response = await fetch(apiUrl, { cache: 'no-store' });
        
        if (!response.ok) {
          throw new Error('트로피 정보를 불러오는데 실패했습니다.');
        }
        
        const data = await response.json();
        setTrophiesData(data || []);
      } catch (error) {
        console.error('트로피 데이터 로딩 오류:', error);
        setError('트로피 정보를 불러오는데 실패했습니다.');
        setTrophiesData([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrophiesData();
  }, [playerId, baseUrl, initialTrophiesData.length]);

  if (loading) {
    return <div className="text-center py-8">트로피 정보를 불러오는 중...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  if (!trophiesData || trophiesData.length === 0) {
    return <div className="text-center py-8 text-gray-500">수상 기록이 없습니다.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {trophiesData.map((trophy, index) => (
        <div key={index} className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4">
          {trophy.leagueLogo ? (
            <div className="w-12 h-12 relative flex-shrink-0">
              <Image
                src={trophy.leagueLogo}
                alt={trophy.league}
                width={48}
                height={48}
                className="object-contain"
                unoptimized
              />
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-3 rounded-full flex-shrink-0">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6 text-gray-500" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.616a1 1 0 01.894-1.79l1.599.8L9 4.323V3a1 1 0 011-1z" 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{trophy.league}</h3>
            <p className="text-sm text-gray-600">{trophy.country}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={classNames('text-sm', {
                'font-bold': trophy.place === '우승',
                'text-gray-600': trophy.place !== '우승'
              })}>
                {trophy.place}
              </span>
              <span className="text-sm text-gray-500">
                {trophy.season}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 