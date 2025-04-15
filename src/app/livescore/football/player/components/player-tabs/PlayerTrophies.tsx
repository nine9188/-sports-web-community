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
  
  // 트로피 종류별 분류 및 집계
  const trophySummary = trophiesData.reduce((acc, trophy) => {
    if (trophy.place === '우승') {
      acc.champion++;
    } else if (trophy.place === '준우승') {
      acc.runnerUp++;
    } else {
      acc.other++;
    }
    return acc;
  }, { total: trophiesData.length, champion: 0, runnerUp: 0, other: 0 });

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
    return (
      <div className="mb-4 bg-white rounded-lg border p-4">
        <div className="flex flex-col justify-center items-center py-6">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-3"></div>
          <p className="text-gray-600 text-sm font-medium">트로피 정보를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-4 bg-white rounded-lg border p-4">
        <div className="flex flex-col justify-center items-center py-6">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-14 w-14 mx-auto text-red-500 mb-3" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <p className="text-lg font-medium text-gray-600 mb-2">{error}</p>
          <p className="text-sm text-gray-500">네트워크 연결을 확인하고 다시 시도해주세요.</p>
        </div>
      </div>
    );
  }

  if (!trophiesData || trophiesData.length === 0) {
    return (
      <div className="mb-4 bg-white rounded-lg border p-4">
        <div className="text-center py-6">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-16 w-16 mx-auto text-gray-400 mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <p className="text-lg font-medium text-gray-600">수상 기록이 없습니다</p>
          <p className="text-sm text-gray-500 mt-2">
            이 선수의 수상 기록을 찾을 수 없습니다.
          </p>
        </div>
      </div>
    );
  }

  // 트로피 아이콘 렌더링 함수
  const renderTrophyIcon = (place: string) => {
    let color;
    
    // 우승, 준우승, 3위에 따라 색상 다르게 적용
    switch(place) {
      case '우승':
        color = 'text-yellow-500';
        break;
      case '준우승':
        color = 'text-gray-400';
        break;
      case '3위':
        color = 'text-amber-600';
        break;
      default:
        color = 'text-gray-500';
    }
    
    return (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={`h-5 w-5 ${color} mr-1`} 
        viewBox="0 0 20 20" 
        fill="currentColor"
      >
        <path 
          fillRule="evenodd" 
          d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.616a1 1 0 01.894-1.79l1.599.8L9 4.323V3a1 1 0 011-1z" 
          clipRule="evenodd" 
        />
      </svg>
    );
  };

  return (
    <div className="mb-4 bg-white rounded-lg">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        {/* 트로피 요약 정보 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">트로피 요약</div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.616a1 1 0 01.894-1.79l1.599.8L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-gray-700">총 트로피: <span className="text-yellow-600 font-bold">{trophySummary.total}개</span></span>
            </div>
            
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-medium text-gray-700">우승: <span className="text-yellow-600 font-bold">{trophySummary.champion}회</span></span>
            </div>
            
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-medium text-gray-700">준우승: <span className="font-bold">{trophySummary.runnerUp}회</span></span>
            </div>
            
            {trophySummary.other > 0 && (
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-medium text-gray-700">기타: <span className="font-bold">{trophySummary.other}회</span></span>
              </div>
            )}
          </div>
        </div>
        
        {/* 데스크탑 및 태블릿 버전 - 완전한 테이블 */}
        <table className="hidden md:table min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                리그
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                국가
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                결과
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                시즌
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {trophiesData.map((trophy, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    {trophy.leagueLogo ? (
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-50 rounded-md border border-gray-100 flex items-center justify-center">
                        <Image
                          src={trophy.leagueLogo}
                          alt={trophy.league}
                          width={24}
                          height={24}
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-5 w-5 text-gray-400" 
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                        </svg>
                      </div>
                    )}
                    <div className="font-medium text-gray-800">{trophy.league}</div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                  {trophy.country}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <span className={classNames('inline-flex items-center px-3 py-1 rounded-full text-xs font-medium', {
                    'bg-yellow-100 text-yellow-800': trophy.place === '우승',
                    'bg-gray-100 text-gray-800': trophy.place === '준우승',
                    'bg-amber-100 text-amber-800': trophy.place === '3위',
                    'bg-blue-100 text-blue-800': !['우승', '준우승', '3위'].includes(trophy.place)
                  })}>
                    <span className="flex items-center">
                      {renderTrophyIcon(trophy.place)}
                      {trophy.place}
                    </span>
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center text-gray-700 font-medium">
                  {trophy.season}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* 모바일 버전 - 간소화된 테이블 */}
        <table className="md:hidden min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                리그/대회
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                결과/시즌
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {trophiesData.map((trophy, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-3">
                    {trophy.leagueLogo ? (
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-50 rounded-md border border-gray-100 flex items-center justify-center p-1">
                        <Image
                          src={trophy.leagueLogo}
                          alt={trophy.league}
                          width={28}
                          height={28}
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-6 w-6 text-gray-400" 
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 text-sm">{trophy.league}</div>
                      <div className="text-xs text-gray-500 mt-1">{trophy.country}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={classNames('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', {
                    'bg-yellow-100 text-yellow-800': trophy.place === '우승',
                    'bg-gray-100 text-gray-800': trophy.place === '준우승',
                    'bg-amber-100 text-amber-800': trophy.place === '3위',
                    'bg-blue-100 text-blue-800': !['우승', '준우승', '3위'].includes(trophy.place)
                  })}>
                    <span className="flex items-center">
                      {renderTrophyIcon(trophy.place)}
                      {trophy.place}
                    </span>
                  </span>
                  <div className="text-xs text-gray-500 mt-1">{trophy.season}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 